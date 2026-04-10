import type { Hyperparameters, Point, Prediction, TrainingConfig, TrainingHistory, ExportFormat } from '../domain';
import { DEFAULT_TRAINING_CONFIG, DEFAULT_LR_SCHEDULE, exportHistory, isModelDisposedError } from '../domain';
import type { INeuralNetworkService, IVisualizerService, IDatasetRepository, DatasetOptions } from '../ports';
import type { ITrainingSession, TrainingState } from './ITrainingSession';
import { logger } from '../../infrastructure/logging/Logger';
import {
  LearningRateScheduler,
  EarlyStoppingStrategy,
  TrainingDataSplitter,
  SessionStateStore,
  DatasetPreparationService,
  ExperimentService,
} from './training';

/**
 * Configuration for training session behaviour.
 */
export interface TrainingSessionConfig {
  /** How often to render decision boundary (every N epochs). Default: 10 */
  readonly renderInterval: number;
  /** Grid resolution for boundary prediction. Default: 50 */
  readonly gridSize: number;
}

const DEFAULT_CONFIG: TrainingSessionConfig = {
  renderInterval: 5,
  gridSize: 50,
};

/**
 * Orchestrates the training workflow.
 * Acts as a thin facade coordinating four single-responsibility services:
 *
 * - SessionStateStore: mutable state + observer notifications
 * - DatasetPreparationService: data loading, preprocessing, splitting
 * - ExperimentService: config undo/redo, boundary snapshots, completion
 * - LearningRateScheduler / EarlyStoppingStrategy: training loop policies
 *
 * Keeps visualisation coordination (updateVisualisation, predictionGrid)
 * because it spans neuralNet + visualizer + state.
 *
 * @remarks
 * Concurrency Strategy (Guard-Rail Loop):
 * - `isTraining` controls whether the loop should continue
 * - `isProcessingStep` acts as a mutex to prevent overlapping async calls
 * - `requestAnimationFrame` fires ~60fps, but we skip frames while GPU is busy
 */
export class TrainingSession implements ITrainingSession {
  private readonly config: TrainingSessionConfig;

  // Decomposed services
  private readonly state: SessionStateStore;
  private readonly dataService: DatasetPreparationService;
  private readonly experiment: ExperimentService;
  private lrScheduler: LearningRateScheduler;
  private earlyStoppingStrategy: EarlyStoppingStrategy;

  // Visualisation state (stays in facade — spans neuralNet + visualizer)
  private readonly predictionGrid: Point[] = [];
  private cachedPredictions: Prediction[] = [];

  // Timing control
  private lastFrameTime = 0;
  private frameInterval = 0;

  // Learning rate tracking
  private initialLearningRate = 0.03;
  private currentHyperparameters: Hyperparameters | null = null;

  // Runtime training config (owned here, mirrored to state store for snapshots)
  private trainingConfig: Required<TrainingConfig> = { ...DEFAULT_TRAINING_CONFIG };

  constructor(
    private readonly neuralNet: INeuralNetworkService,
    private readonly visualizer: IVisualizerService,
    dataRepo: IDatasetRepository,
    config: Partial<TrainingSessionConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialisePredictionGrid();

    // Construct services
    // Construction order: StateStore → DatasetPrep → Experiment → LR/EarlyStopping
    this.state = new SessionStateStore({ ...this.trainingConfig });
    this.dataService = new DatasetPreparationService(dataRepo, new TrainingDataSplitter());
    this.experiment = new ExperimentService();

    this.lrScheduler = new LearningRateScheduler(
      this.initialLearningRate,
      this.trainingConfig.lrSchedule ?? DEFAULT_LR_SCHEDULE
    );
    this.earlyStoppingStrategy = new EarlyStoppingStrategy(
      this.trainingConfig.earlyStoppingPatience ?? 0
    );
  }

  // ===========================================================================
  // ITrainingSession — state
  // ===========================================================================

  getState(): TrainingState {
    return this.state.getState();
  }

  onStateChange(callback: (state: TrainingState) => void): () => void {
    return this.state.addListener(callback);
  }

  // ===========================================================================
  // ITrainingSession — configuration
  // ===========================================================================

  setTrainingConfig(config: Partial<TrainingConfig>): void {
    this.trainingConfig = { ...this.trainingConfig, ...config };
    this.state.setTrainingConfig(this.trainingConfig);

    if (config.targetFps !== undefined) {
      this.frameInterval = config.targetFps > 0 ? 1000 / config.targetFps : 0;
    }

    if (config.epochDelayMs !== undefined && config.epochDelayMs > 0) {
      this.frameInterval = config.epochDelayMs;
    }

    if (config.earlyStoppingPatience !== undefined) {
      this.earlyStoppingStrategy.setPatience(config.earlyStoppingPatience);
    }

    if (config.lrSchedule !== undefined) {
      this.lrScheduler.setSchedule(config.lrSchedule);
    }

    // Re-split data if validation split changed
    if (config.validationSplit !== undefined && this.dataService.hasData()) {
      this.dataService.splitData(this.trainingConfig.validationSplit);
    }

    this.state.notifyListeners('configChanged');
  }

  async setHyperparameters(config: Hyperparameters, skipHistory: boolean = false): Promise<void> {
    // Stop training before re-initializing to prevent accessing disposed model
    const wasTraining = this.state.getIsTraining() && !this.state.getIsPaused();
    if (wasTraining) {
      this.pause();
      while (this.state.getIsProcessingStep()) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    await this.neuralNet.initialize(config);
    this.state.setInitialised(true);
    this.state.resetProgress();

    // Store for LR scheduling and reset scheduler
    this.currentHyperparameters = config;
    this.initialLearningRate = config.learningRate;
    this.lrScheduler.setInitialLR(config.learningRate);
    this.lrScheduler.setSchedule(this.trainingConfig.lrSchedule ?? DEFAULT_LR_SCHEDULE);

    this.earlyStoppingStrategy.reset();

    if (!skipHistory) {
      this.experiment.pushConfig(config, 'Configuration updated');
    }

    this.state.notifyListeners('initialized');
  }

  // ===========================================================================
  // ITrainingSession — data
  // ===========================================================================

  async loadData(datasetType: string, options?: DatasetOptions): Promise<void> {
    const allData = await this.dataService.loadData(
      datasetType, options, this.trainingConfig.validationSplit
    );
    this.state.setDatasetLoaded(true);
    this.visualizer.renderData(allData);
    this.state.notifyListeners('dataLoaded');
  }

  setCustomData(points: Point[]): void {
    this.dataService.setCustomData(points, this.trainingConfig.validationSplit);
    this.state.setDatasetLoaded(points.length > 0);
    this.state.notifyListeners('configChanged');
  }

  getData(): Point[] {
    return this.dataService.getData();
  }

  getTrainingData(): Point[] {
    return this.dataService.getTrainingData();
  }

  getDetectedNumClasses(): number {
    return this.dataService.getDetectedNumClasses();
  }

  // ===========================================================================
  // ITrainingSession — training control
  // ===========================================================================

  start(): void {
    this.assertReadyToTrain();

    if (this.state.getIsTraining() && !this.state.getIsPaused()) {
      return; // Already running
    }

    this.state.setTraining(true);
    this.state.setPaused(false);
    this.state.notifyListeners('started');

    void this.loop();
  }

  pause(): void {
    if (!this.state.getIsTraining()) {
      return;
    }

    this.state.setPaused(true);
    this.state.notifyListeners('paused');
  }

  reset(): void {
    this.state.setTraining(false);
    this.state.setPaused(false);
    this.state.setProcessingStep(false);
    this.state.resetProgress();

    // Re-split data
    if (this.dataService.hasData()) {
      this.dataService.splitData(this.trainingConfig.validationSplit);
    }

    // Re-render data points without boundary
    if (this.state.getDatasetLoaded()) {
      this.visualizer.renderData(this.dataService.getAllData());
    }

    this.state.notifyListeners('reset');
  }

  clearAll(): void {
    this.state.clearAll();
    this.dataService.clear();
    this.visualizer.clear();
    this.state.notifyListeners('reset');
  }

  async step(): Promise<void> {
    this.assertReadyToTrain();

    if (this.state.getIsProcessingStep()) {
      return;
    }

    this.state.setProcessingStep(true);

    try {
      const epoch = this.state.incrementEpoch();

      const result = await this.neuralNet.train(this.dataService.getTrainingData());
      this.state.setMetrics(result.loss, result.accuracy);

      // Evaluate on validation data if available
      let valLoss: number | null = null;
      let valAccuracy: number | null = null;

      const validationData = this.dataService.getValidationData();
      if (validationData.length > 0) {
        const valResult = await this.neuralNet.evaluate(validationData);
        valLoss = valResult.loss;
        valAccuracy = valResult.accuracy;
        this.state.setValidationMetrics(valLoss, valAccuracy);
      }

      this.state.addHistoryRecord({
        epoch,
        loss: result.loss,
        accuracy: result.accuracy,
        valLoss,
        valAccuracy,
        timestamp: performance.now(),
        learningRate: this.lrScheduler.getCurrentLR(),
      });

      if (epoch === 1 || epoch % this.config.renderInterval === 0) {
        await this.updateVisualisation();
      }

      this.state.notifyListeners('trainingStep');
    } finally {
      this.state.setProcessingStep(false);
    }
  }

  // ===========================================================================
  // ITrainingSession — export / history
  // ===========================================================================

  exportHistory(format: ExportFormat): string {
    return exportHistory(this.state.getHistory(), format);
  }

  getHistory(): TrainingHistory {
    return this.state.getHistory();
  }

  getCurrentLearningRate(): number {
    return this.lrScheduler.getCurrentLR();
  }

  // ===========================================================================
  // ITrainingSession — dispose
  // ===========================================================================

  dispose(): void {
    this.state.setTraining(false);
    this.state.setPaused(false);
    this.state.setProcessingStep(false);
    this.state.clearListeners();
  }

  // ===========================================================================
  // Experiment service delegates
  // ===========================================================================

  onComplete(callback: (reason: 'maxEpochs' | 'earlyStopping' | 'manual') => void): void {
    this.experiment.onComplete(callback);
  }

  setRecording(enabled: boolean, interval = 10): void {
    this.experiment.setRecording(enabled, interval);
  }

  getBoundarySnapshots(): Array<{ epoch: number; predictions: Prediction[] }> {
    return this.experiment.getBoundarySnapshots();
  }

  clearBoundarySnapshots(): void {
    this.experiment.clearBoundarySnapshots();
  }

  async undoConfig(): Promise<boolean> {
    const config = this.experiment.undoConfig();
    if (!config) return false;
    await this.setHyperparameters(config, true);
    return true;
  }

  async redoConfig(): Promise<boolean> {
    const config = this.experiment.redoConfig();
    if (!config) return false;
    await this.setHyperparameters(config, true);
    return true;
  }

  canUndo(): boolean {
    return this.experiment.canUndo();
  }

  canRedo(): boolean {
    return this.experiment.canRedo();
  }

  // ===========================================================================
  // LR Finder
  // ===========================================================================

  async runLRFinder(
    minLR = 1e-7,
    maxLR = 1,
    steps = 100
  ): Promise<Array<{ lr: number; loss: number }>> {
    this.assertReadyToTrain();

    const wasTraining = this.state.getIsTraining() && !this.state.getIsPaused();
    if (wasTraining) {
      this.pause();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const results: Array<{ lr: number; loss: number }> = [];
    const lrMultiplier = Math.pow(maxLR / minLR, 1 / steps);
    let currentLR = minLR;

    const originalHyperparams = this.currentHyperparameters;
    if (!originalHyperparams) {
      throw new Error('Model not initialized');
    }

    for (let i = 0; i < steps; i++) {
      this.neuralNet.updateLearningRate(currentLR);

      const batch = this.getTrainingBatch();
      const result = await this.neuralNet.train(batch);

      results.push({ lr: currentLR, loss: result.loss });

      if (!isFinite(result.loss) || result.loss > 1e10) {
        break;
      }

      currentLR *= lrMultiplier;
    }

    // Restore original model
    await this.neuralNet.initialize(originalHyperparams);

    return results;
  }

  // ===========================================================================
  // Guard-Rail Training Loop (private)
  // ===========================================================================

  private async loop(): Promise<void> {
    if (!this.state.getIsTraining() || this.state.getIsPaused()) {
      return;
    }

    const { maxEpochs } = this.trainingConfig;
    if (maxEpochs > 0 && this.state.getEpoch() >= maxEpochs) {
      this.state.setTraining(false);
      this.state.notifyListeners('stopped');
      this.experiment.notifyComplete('maxEpochs');
      return;
    }

    if (this.state.getIsProcessingStep()) {
      requestAnimationFrame(() => void this.loop());
      return;
    }

    const now = performance.now();
    if (this.frameInterval > 0 && now - this.lastFrameTime < this.frameInterval) {
      requestAnimationFrame(() => void this.loop());
      return;
    }
    this.lastFrameTime = now;

    this.state.setProcessingStep(true);

    try {
      if (!this.neuralNet.isReady()) {
        this.state.setTraining(false);
        this.state.setProcessingStep(false);
        this.state.notifyListeners('stopped');
        return;
      }

      const batch = this.getTrainingBatch();
      const epoch = this.state.incrementEpoch();

      this.updateLearningRateIfNeeded();
      const epochLearningRate = this.lrScheduler.getCurrentLR();

      const result = await this.neuralNet.train(batch);
      this.state.setMetrics(result.loss, result.accuracy);

      let valLoss: number | null = null;
      let valAccuracy: number | null = null;

      const validationData = this.dataService.getValidationData();
      if (validationData.length > 0) {
        const valResult = await this.neuralNet.evaluate(validationData);
        valLoss = valResult.loss;
        valAccuracy = valResult.accuracy;
        this.state.setValidationMetrics(valLoss, valAccuracy);
      }

      this.state.addHistoryRecord({
        epoch,
        loss: result.loss,
        accuracy: result.accuracy,
        valLoss,
        valAccuracy,
        timestamp: performance.now(),
        learningRate: epochLearningRate,
      });

      if (this.earlyStoppingStrategy.shouldStop(valLoss)) {
        this.state.setTraining(false);
        this.state.notifyListeners('stopped');
        this.experiment.notifyComplete('earlyStopping');
        logger.info(`Early stopping triggered at epoch ${epoch}`, {
          component: 'TrainingSession',
          action: 'earlyStopping',
          epoch,
          bestValLoss: this.earlyStoppingStrategy.getBestValLoss(),
          epochsWithoutImprovement: this.earlyStoppingStrategy.getEpochsWithoutImprovement(),
        });
        return;
      }

      if (epoch === 1 || epoch % this.config.renderInterval === 0) {
        await this.updateVisualisation();
      }

      this.experiment.maybeRecordSnapshot(epoch, this.cachedPredictions);

      this.state.notifyListeners('trainingStep');
    } catch (error) {
      this.state.setTraining(false);
      this.state.notifyListeners('stopped');

      if (isModelDisposedError(error)) {
        return;
      }

      logger.error(
        'Training loop crashed',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'TrainingSession',
          action: 'loop',
          epoch: this.state.getEpoch(),
        }
      );
    } finally {
      this.state.setProcessingStep(false);
      if (!this.state.getIsTraining() || this.state.getIsPaused()) {
        this.state.notifyListeners('stopped');
      }
    }

    if (this.state.getIsTraining() && !this.state.getIsPaused()) {
      const stillUnderLimit = maxEpochs === 0 || this.state.getEpoch() < maxEpochs;
      if (stillUnderLimit) {
        requestAnimationFrame(() => void this.loop());
      } else {
        this.state.setTraining(false);
        this.state.notifyListeners('stopped');
        this.experiment.notifyComplete('maxEpochs');
      }
    }
  }

  // ===========================================================================
  // Private helpers
  // ===========================================================================

  private getTrainingBatch(): Point[] {
    const { batchSize } = this.trainingConfig;
    const trainingData = this.dataService.getTrainingData();

    if (batchSize <= 0 || batchSize >= trainingData.length) {
      return trainingData;
    }

    const shuffled = [...trainingData];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i] as Point;
      shuffled[i] = shuffled[j] as Point;
      shuffled[j] = temp;
    }

    return shuffled.slice(0, batchSize);
  }

  private async updateVisualisation(): Promise<void> {
    if (!this.state.getDatasetLoaded()) {
      return;
    }

    this.cachedPredictions = await this.neuralNet.predict(this.predictionGrid);

    if (!this.state.getDatasetLoaded()) {
      return;
    }

    const allData = this.dataService.getAllData();
    const pointPredictions = await this.neuralNet.predict(allData);

    if (!this.state.getDatasetLoaded()) {
      return;
    }

    this.visualizer.renderBoundary(this.cachedPredictions, this.config.gridSize);
    this.visualizer.renderData(allData);
    this.visualizer.setPointPredictions(pointPredictions);
  }

  private initialisePredictionGrid(): void {
    const { gridSize } = this.config;
    this.predictionGrid.length = 0;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i / (gridSize - 1)) * 2 - 1;
        const y = (j / (gridSize - 1)) * 2 - 1;
        this.predictionGrid.push({ x, y, label: 0 });
      }
    }
  }

  private updateLearningRateIfNeeded(): void {
    const previousLR = this.lrScheduler.getCurrentLR();
    this.lrScheduler.calculateLR(this.state.getEpoch(), this.trainingConfig.maxEpochs);

    if (this.lrScheduler.hasSignificantChange(previousLR, 0.01) && this.currentHyperparameters) {
      this.neuralNet.updateLearningRate(this.lrScheduler.getCurrentLR());
    }
  }

  private assertReadyToTrain(): void {
    if (!this.state.getIsInitialised()) {
      throw new Error('Hyperparameters not set. Call setHyperparameters() first.');
    }
    if (!this.state.getDatasetLoaded()) {
      throw new Error('No data loaded. Call loadData() first.');
    }
  }
}

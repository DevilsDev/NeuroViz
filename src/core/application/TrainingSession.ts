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
  shuffle,
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

interface EpochOutcome {
  readonly epoch: number;
  readonly earlyStop: boolean;
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

  // Serialises setHyperparameters calls so each config is applied in order
  private initQueue: Promise<void> = Promise.resolve();

  // Bumped by reset/re-init/dispose/clearAll. A step that was in flight when
  // the generation changed discards its results instead of writing them into
  // the fresh session.
  private sessionGeneration = 0;

  // Identifies the active loop chain; bumped by start() so a pause/resume
  // while a step is in flight doesn't leave two rAF chains running.
  private loopId = 0;

  // Learning rate tracking
  private initialLearningRate = 0.03;
  private currentHyperparameters: Hyperparameters | null = null;
  /** LR last pushed to the network; compared against the schedule each epoch */
  private appliedLearningRate: number | null = null;

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

  setHyperparameters(config: Hyperparameters, skipHistory: boolean = false): Promise<void> {
    // Queue rather than drop overlapping calls: a dropped call used to resolve
    // as if it had succeeded, so callers recorded a config that was never applied.
    const run = this.initQueue.then(() => this.applyHyperparameters(config, skipHistory));
    this.initQueue = run.catch(() => undefined);
    return run;
  }

  private async applyHyperparameters(config: Hyperparameters, skipHistory: boolean): Promise<void> {
    // Stop training and wait for any in-flight step (loop or manual step())
    // so the model isn't disposed underneath it
    if (this.state.getIsTraining() && !this.state.getIsPaused()) {
      this.pause();
    }
    await this.waitForInFlightStep();

    this.sessionGeneration++;
    // initialize() disposes the old model first, so until it succeeds there is
    // no usable model; a failed init must leave the session uninitialised
    this.state.setInitialised(false);
    await this.neuralNet.initialize(config);
    this.state.setInitialised(true);
    this.state.resetProgress();

    // Store for LR scheduling and reset scheduler
    this.currentHyperparameters = config;
    this.appliedLearningRate = config.learningRate;
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
    // Don't keep training (or let an in-flight step render) against the old data
    if (this.state.getIsTraining() && !this.state.getIsPaused()) {
      this.pause();
    }
    await this.waitForInFlightStep();

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

    this.loopId++;
    void this.loop(this.loopId);
  }

  pause(): void {
    if (!this.state.getIsTraining()) {
      return;
    }

    this.state.setPaused(true);
    this.state.notifyListeners('paused');
  }

  reset(): void {
    this.sessionGeneration++;
    this.state.setTraining(false);
    this.state.setPaused(false);
    // The step mutex is left alone: an in-flight step still owns it and
    // releases it when it finishes (its results are discarded).
    this.state.resetProgress();
    this.earlyStoppingStrategy.reset();

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
    this.sessionGeneration++;
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

    if (this.isAtEpochLimit()) {
      return;
    }

    if (!this.neuralNet.isReady()) {
      throw new Error('Model is not ready for training.');
    }

    const generation = this.sessionGeneration;
    const isStale = (): boolean => generation !== this.sessionGeneration;
    this.state.setProcessingStep(true);

    let outcome: EpochOutcome | null;
    try {
      outcome = await this.runEpoch(isStale);
      if (!outcome) return;
      this.state.notifyListeners('trainingStep');
    } finally {
      this.state.setProcessingStep(false);
    }

    if (outcome.earlyStop) {
      this.logEarlyStop(outcome.epoch);
      this.endSteppedRun('earlyStopping');
    } else if (this.isAtEpochLimit()) {
      this.endSteppedRun('maxEpochs');
    }
  }

  /**
   * Completion of a run driven by step(). A paused loop run is ended too; a
   * step-only run never set isTraining, so it gets no 'stopped' event.
   */
  private endSteppedRun(reason: 'maxEpochs' | 'earlyStopping'): void {
    if (this.state.getIsTraining()) {
      this.state.setTraining(false);
      this.state.setPaused(false);
      this.state.notifyListeners('stopped');
    }
    this.experiment.notifyComplete(reason);
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
    this.sessionGeneration++;
    this.state.setTraining(false);
    this.state.setPaused(false);
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
  // Guard-Rail Training Loop (private)
  // ===========================================================================

  private async loop(loopId: number): Promise<void> {
    if (loopId !== this.loopId || !this.state.getIsTraining() || this.state.getIsPaused()) {
      return;
    }

    if (this.isAtEpochLimit()) {
      this.state.setTraining(false);
      this.state.notifyListeners('stopped');
      this.experiment.notifyComplete('maxEpochs');
      return;
    }

    if (this.state.getIsProcessingStep()) {
      requestAnimationFrame(() => void this.loop(loopId));
      return;
    }

    const now = performance.now();
    if (this.frameInterval > 0 && now - this.lastFrameTime < this.frameInterval) {
      requestAnimationFrame(() => void this.loop(loopId));
      return;
    }
    this.lastFrameTime = now;

    const generation = this.sessionGeneration;
    const isStale = (): boolean => generation !== this.sessionGeneration;
    this.state.setProcessingStep(true);

    // Every exit path that ends the run only clears isTraining; the finally
    // block emits the single 'stopped' event for it.
    let earlyStoppedAt: number | null = null;
    try {
      if (!this.neuralNet.isReady()) {
        this.state.setTraining(false);
        return;
      }

      const outcome = await this.runEpoch(isStale);
      if (!outcome) return;

      if (outcome.earlyStop) {
        this.state.setTraining(false);
        earlyStoppedAt = outcome.epoch;
      } else {
        this.state.notifyListeners('trainingStep');
      }
    } catch (error) {
      if (isStale()) return;
      this.state.setTraining(false);

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
      // This step owns the mutex, so it always releases it, even when stale
      this.state.setProcessingStep(false);
      if (!isStale() && (!this.state.getIsTraining() || this.state.getIsPaused())) {
        this.state.notifyListeners('stopped');
      }
    }

    if (earlyStoppedAt !== null) {
      this.experiment.notifyComplete('earlyStopping');
      this.logEarlyStop(earlyStoppedAt);
      return;
    }

    // Only the most recently started loop chain keeps scheduling frames
    if (loopId === this.loopId && this.state.getIsTraining() && !this.state.getIsPaused()) {
      if (!this.isAtEpochLimit()) {
        requestAnimationFrame(() => void this.loop(loopId));
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

  private async waitForInFlightStep(): Promise<void> {
    while (this.state.getIsProcessingStep()) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  private getTrainingBatch(): Point[] {
    const { batchSize } = this.trainingConfig;
    const trainingData = this.dataService.getTrainingData();

    if (batchSize <= 0 || batchSize >= trainingData.length) {
      return trainingData;
    }

    return shuffle(trainingData).slice(0, batchSize);
  }

  private async updateVisualisation(): Promise<void> {
    if (!this.state.getDatasetLoaded() || !this.neuralNet.isReady()) {
      return;
    }

    this.cachedPredictions = await this.neuralNet.predict(this.predictionGrid);

    if (!this.state.getDatasetLoaded() || !this.neuralNet.isReady()) {
      return;
    }

    const allData = this.dataService.getAllData();
    const pointPredictions = await this.neuralNet.predict(allData);

    if (!this.state.getDatasetLoaded() || !this.neuralNet.isReady()) {
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

  /**
   * One epoch shared by loop() and step(): LR schedule, train, validate,
   * history, early-stopping check and (interval or final) boundary render.
   * Returns null when the session changed underneath it (results discarded).
   */
  private async runEpoch(isStale: () => boolean): Promise<EpochOutcome | null> {
    const batch = this.getTrainingBatch();
    const epoch = this.state.incrementEpoch();

    // Epochs are 1-based for display, the scheduler is 0-based
    this.updateLearningRateIfNeeded(epoch - 1);
    const epochLearningRate = this.lrScheduler.getCurrentLR();

    const result = await this.neuralNet.train(batch);
    if (isStale()) return null;
    this.state.setMetrics(result.loss, result.accuracy);

    let valLoss: number | null = null;
    let valAccuracy: number | null = null;

    const validationData = this.dataService.getValidationData();
    if (validationData.length > 0) {
      const valResult = await this.neuralNet.evaluate(validationData);
      if (isStale()) return null;
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

    const earlyStop = this.earlyStoppingStrategy.shouldStop(valLoss);
    const isFinalEpoch = earlyStop || this.isAtEpochLimit();

    if (isFinalEpoch || epoch === 1 || epoch % this.config.renderInterval === 0) {
      await this.updateVisualisation();
      if (isStale()) return null;
    }

    this.experiment.maybeRecordSnapshot(epoch, this.cachedPredictions);

    return { epoch, earlyStop };
  }

  private isAtEpochLimit(): boolean {
    const { maxEpochs } = this.trainingConfig;
    return maxEpochs > 0 && this.state.getEpoch() >= maxEpochs;
  }

  private logEarlyStop(epoch: number): void {
    logger.info(`Early stopping triggered at epoch ${epoch}`, {
      component: 'TrainingSession',
      action: 'earlyStopping',
      epoch,
      bestValLoss: this.earlyStoppingStrategy.getBestValLoss(),
      epochsWithoutImprovement: this.earlyStoppingStrategy.getEpochsWithoutImprovement(),
    });
  }

  private updateLearningRateIfNeeded(schedulerEpoch: number): void {
    const scheduledLR = this.lrScheduler.calculateLR(schedulerEpoch, this.trainingConfig.maxEpochs);

    // Compare against the LR actually applied, not the previous epoch's scheduled
    // value: otherwise slow schedules (<1%/epoch) never reach the optimizer.
    if (this.currentHyperparameters && scheduledLR !== this.appliedLearningRate) {
      this.neuralNet.updateLearningRate(scheduledLR);
      this.appliedLearningRate = scheduledLR;
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

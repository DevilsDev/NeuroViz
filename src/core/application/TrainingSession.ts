import type { Hyperparameters, Point, Prediction, TrainingConfig, TrainingHistory, ExportFormat } from '../domain';
import { DEFAULT_TRAINING_CONFIG, DEFAULT_LR_SCHEDULE, createEmptyHistory, addHistoryRecord, exportHistory } from '../domain';
import type { INeuralNetworkService, IVisualizerService, IDatasetRepository, DatasetOptions } from '../ports';
import type { ITrainingSession, TrainingState } from './ITrainingSession';
import { logger } from '../../infrastructure/logging/Logger';
import { LearningRateScheduler, EarlyStoppingStrategy, TrainingDataSplitter } from './training';

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
  renderInterval: 10,
  gridSize: 50,
};

/**
 * Orchestrates the training workflow.
 * Acts as the "Director" coordinating neural network, visualiser, and data repository.
 *
 * @remarks
 * Concurrency Strategy (Guard-Rail Loop):
 * - `isTraining` controls whether the loop should continue
 * - `isProcessingStep` acts as a mutex to prevent overlapping async calls
 * - `requestAnimationFrame` fires ~60fps, but we skip frames while GPU is busy
 *
 * This prevents "call stack pile-up" where Step 2 starts before Step 1 finishes.
 *
 * @example
 * ```
 * Frame 1: isProcessingStep=false → Execute train() → isProcessingStep=true
 * Frame 2: isProcessingStep=true  → Skip (GPU busy)
 * Frame 3: isProcessingStep=true  → Skip (GPU busy)
 * Frame 4: train() completes      → isProcessingStep=false
 * Frame 5: isProcessingStep=false → Execute train() → ...
 * ```
 */
export class TrainingSession implements ITrainingSession {
  private readonly config: TrainingSessionConfig;
  private readonly stateListeners: Set<(state: TrainingState) => void> = new Set();

  // Training state
  private currentEpoch = 0;
  private currentLoss: number | null = null;
  private currentAccuracy: number | null = null;
  private currentValLoss: number | null = null;
  private currentValAccuracy: number | null = null;
  private isInitialised = false;
  private datasetLoaded = false;

  // Training history
  private history: TrainingHistory = createEmptyHistory();
  private trainingStartTime = 0;

  // Loop control flags
  private isTraining = false;
  private isPaused = false;
  private isProcessingStep = false;

  // Data caches (reused to reduce GC pressure)
  private allData: Point[] = []; // Original full dataset
  private trainingData: Point[] = []; // Training split
  private validationData: Point[] = []; // Validation split
  private readonly predictionGrid: Point[] = [];
  private cachedPredictions: Prediction[] = [];

  // Runtime training configuration
  private trainingConfig: Required<TrainingConfig> = { ...DEFAULT_TRAINING_CONFIG };

  // Timing control
  private lastFrameTime = 0;
  private frameInterval = 0; // ms between frames (0 = no limit)

  // Decomposed services (SRP - each service has a single responsibility)
  private lrScheduler: LearningRateScheduler;
  private earlyStoppingStrategy: EarlyStoppingStrategy;
  private readonly dataSplitter: TrainingDataSplitter;

  // Learning rate tracking (for scheduler initialization)
  private initialLearningRate = 0.03;
  private currentHyperparameters: Hyperparameters | null = null;

  // Completion callback
  private onCompleteCallback: ((reason: 'maxEpochs' | 'earlyStopping' | 'manual') => void) | null = null;

  // Boundary evolution recording
  private boundarySnapshots: Array<{ epoch: number; predictions: Prediction[] }> = [];
  private recordingEnabled = false;
  private snapshotInterval = 10; // Record every N epochs

  constructor(
    private readonly neuralNet: INeuralNetworkService,
    private readonly visualizer: IVisualizerService,
    private readonly dataRepo: IDatasetRepository,
    config: Partial<TrainingSessionConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialisePredictionGrid();

    // Initialize decomposed services
    this.lrScheduler = new LearningRateScheduler(
      this.initialLearningRate,
      this.trainingConfig.lrSchedule ?? DEFAULT_LR_SCHEDULE
    );
    this.earlyStoppingStrategy = new EarlyStoppingStrategy(
      this.trainingConfig.earlyStoppingPatience ?? 0
    );
    this.dataSplitter = new TrainingDataSplitter();
  }

  /**
   * Returns a snapshot of the current training state.
   * isRunning is derived from isTraining flag.
   */
  getState(): TrainingState {
    return {
      currentEpoch: this.currentEpoch,
      currentLoss: this.currentLoss,
      currentAccuracy: this.currentAccuracy,
      currentValLoss: this.currentValLoss,
      currentValAccuracy: this.currentValAccuracy,
      isRunning: this.isTraining,
      isPaused: this.isPaused,
      isProcessing: this.isProcessingStep,
      isInitialised: this.isInitialised,
      datasetLoaded: this.datasetLoaded,
      maxEpochs: this.trainingConfig.maxEpochs,
      batchSize: this.trainingConfig.batchSize,
      targetFps: this.trainingConfig.targetFps,
      validationSplit: this.trainingConfig.validationSplit,
      history: this.history,
    };
  }

  /**
   * Updates runtime training configuration.
   * Can be called during training to adjust batch size, speed, etc.
   */
  setTrainingConfig(config: Partial<TrainingConfig>): void {
    this.trainingConfig = { ...this.trainingConfig, ...config };

    // Update frame interval based on target FPS
    if (config.targetFps !== undefined) {
      this.frameInterval = config.targetFps > 0 ? 1000 / config.targetFps : 0;
    }

    // Update frame interval based on epoch delay
    if (config.epochDelayMs !== undefined && config.epochDelayMs > 0) {
      this.frameInterval = config.epochDelayMs;
    }

    // Update early stopping patience
    if (config.earlyStoppingPatience !== undefined) {
      this.earlyStoppingStrategy.setPatience(config.earlyStoppingPatience);
    }

    // Update LR schedule
    if (config.lrSchedule !== undefined) {
      this.lrScheduler.setSchedule(config.lrSchedule);
    }

    // Re-split data if validation split changed
    if (config.validationSplit !== undefined && this.allData.length > 0) {
      this.splitData();
    }

    this.notifyListeners();
  }

  async setHyperparameters(config: Hyperparameters): Promise<void> {
    // Stop training before re-initializing to prevent accessing disposed model
    const wasTraining = this.isTraining && !this.isPaused;
    if (wasTraining) {
      this.pause();
      // Wait for current step to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await this.neuralNet.initialize(config);
    this.isInitialised = true;
    this.currentEpoch = 0;
    this.currentLoss = null;
    this.currentAccuracy = null;
    this.history = createEmptyHistory();

    // Store for LR scheduling and reset scheduler
    this.currentHyperparameters = config;
    this.initialLearningRate = config.learningRate;
    this.lrScheduler.setInitialLR(config.learningRate);
    this.lrScheduler.setSchedule(this.trainingConfig.lrSchedule ?? DEFAULT_LR_SCHEDULE);

    // Reset early stopping strategy
    this.earlyStoppingStrategy.reset();

    this.notifyListeners();
  }

  /**
   * Exports training history in the specified format.
   */
  exportHistory(format: ExportFormat): string {
    return exportHistory(this.history, format);
  }

  async loadData(datasetType: string, options?: DatasetOptions): Promise<void> {
    const rawData = await this.dataRepo.getDataset(datasetType, options);
    this.allData = this.applyPreprocessing(rawData, options?.preprocessing ?? 'none');
    this.splitData();
    this.datasetLoaded = true;
    this.visualizer.renderData(this.allData);
    this.notifyListeners();
  }

  /**
   * Applies preprocessing to the dataset features.
   */
  private applyPreprocessing(data: Point[], method: 'none' | 'normalize' | 'standardize'): Point[] {
    if (method === 'none' || data.length === 0) {
      return data;
    }

    const xs = data.map(p => p.x);
    const ys = data.map(p => p.y);

    if (method === 'normalize') {
      // Min-max normalization to [-1, 1]
      const xMin = Math.min(...xs);
      const xMax = Math.max(...xs);
      const yMin = Math.min(...ys);
      const yMax = Math.max(...ys);

      const xRange = xMax - xMin || 1;
      const yRange = yMax - yMin || 1;

      return data.map(p => ({
        x: ((p.x - xMin) / xRange) * 2 - 1,
        y: ((p.y - yMin) / yRange) * 2 - 1,
        label: p.label,
      }));
    }

    if (method === 'standardize') {
      // Z-score standardization
      const xMean = xs.reduce((a, b) => a + b, 0) / xs.length;
      const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;

      const xStd = Math.sqrt(xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0) / xs.length) || 1;
      const yStd = Math.sqrt(ys.reduce((sum, y) => sum + (y - yMean) ** 2, 0) / ys.length) || 1;

      return data.map(p => ({
        x: (p.x - xMean) / xStd,
        y: (p.y - yMean) / yStd,
        label: p.label,
      }));
    }

    return data;
  }

  /**
   * Splits the dataset into training and validation sets using TrainingDataSplitter.
   * Delegates to the splitter service for clean separation of concerns.
   */
  private splitData(): void {
    const { validationSplit } = this.trainingConfig;

    // Use the data splitter service
    const split = this.dataSplitter.split(this.allData, validationSplit, true);

    this.trainingData = split.training;
    this.validationData = split.validation;
    this.allData = split.all; // Updated with validation markers
  }

  /**
   * Starts the training loop.
   * Uses requestAnimationFrame with a guard-rail to prevent overlapping calls.
   */
  start(): void {
    this.assertReadyToTrain();

    if (this.isTraining && !this.isPaused) {
      return; // Already running
    }

    this.isTraining = true;
    this.isPaused = false;
    this.notifyListeners();

    // Kick off the guard-rail loop
    void this.loop();
  }

  /**
   * Pauses the training loop.
   * The current step will complete, but no new steps will start.
   */
  pause(): void {
    if (!this.isTraining) {
      return;
    }

    this.isPaused = true;
    this.notifyListeners();
  }

  /**
   * Resets training state to initial values.
   * Stops the loop and clears epoch/loss/history.
   */
  reset(): void {
    this.isTraining = false;
    this.isPaused = false;
    this.isProcessingStep = false;
    this.currentEpoch = 0;
    this.currentLoss = null;
    this.currentAccuracy = null;
    this.currentValLoss = null;
    this.currentValAccuracy = null;
    this.history = createEmptyHistory();

    // Re-split data (shuffles again for different validation set)
    if (this.allData.length > 0) {
      this.splitData();
    }

    // Re-render data points without boundary
    if (this.datasetLoaded) {
      this.visualizer.renderData(this.allData);
    }

    this.notifyListeners();
  }

  /**
   * Clears all data and resets to initial state.
   * Use this for a full session clear.
   */
  clearAll(): void {
    // Stop training
    this.isTraining = false;
    this.isPaused = false;
    this.isProcessingStep = false;

    // Clear training progress
    this.currentEpoch = 0;
    this.currentLoss = null;
    this.currentAccuracy = null;
    this.currentValLoss = null;
    this.currentValAccuracy = null;
    this.history = createEmptyHistory();

    // Clear all data
    this.allData = [];
    this.trainingData = [];
    this.validationData = [];
    this.datasetLoaded = false;
    this.isInitialised = false;

    // Clear visualisation
    this.visualizer.clear();

    this.notifyListeners();
  }

  /**
   * Executes a single training step manually.
   * Useful for step-by-step debugging.
   */
  async step(): Promise<void> {
    this.assertReadyToTrain();

    // Prevent overlapping manual steps
    if (this.isProcessingStep) {
      return;
    }

    this.isProcessingStep = true;

    try {
      this.currentEpoch++;

      // Train on training data
      const result = await this.neuralNet.train(this.trainingData);
      this.currentLoss = result.loss;
      this.currentAccuracy = result.accuracy;

      // Evaluate on validation data if available
      let valLoss: number | null = null;
      let valAccuracy: number | null = null;

      if (this.validationData.length > 0) {
        const valResult = await this.neuralNet.evaluate(this.validationData);
        valLoss = valResult.loss;
        valAccuracy = valResult.accuracy;
        this.currentValLoss = valLoss;
        this.currentValAccuracy = valAccuracy;
      }

      // Record in history
      this.history = addHistoryRecord(this.history, {
        epoch: this.currentEpoch,
        loss: result.loss,
        accuracy: result.accuracy,
        valLoss,
        valAccuracy,
        timestamp: performance.now(),
      });

      // Render boundary at intervals
      if (this.currentEpoch % this.config.renderInterval === 0) {
        await this.updateVisualisation();
      }

      this.notifyListeners();
    } finally {
      this.isProcessingStep = false;
    }
  }

  onStateChange(callback: (state: TrainingState) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  /**
   * Cleans up resources and stops the training loop.
   */
  dispose(): void {
    this.isTraining = false;
    this.isPaused = false;
    this.isProcessingStep = false;
    this.stateListeners.clear();
    // Note: neuralNet.dispose() should be called by the composition root
  }

  // ===========================================================================
  // Guard-Rail Training Loop
  // ===========================================================================

  /**
   * The main training loop with guard-rail protection.
   *
   * Key behaviour:
   * 1. If not training or paused → exit
   * 2. If max epochs reached → auto-stop
   * 3. If already processing a step → skip this frame (GPU busy)
   * 4. If frame interval not elapsed → skip (speed control)
   * 5. Otherwise → execute step, then schedule next frame
   *
   * This ensures we never start Step N+1 before Step N completes,
   * even if requestAnimationFrame fires faster than GPU training.
   */
  private async loop(): Promise<void> {
    // Exit condition: training stopped or paused
    if (!this.isTraining || this.isPaused) {
      return;
    }

    // Check epoch limit (auto-stop)
    const { maxEpochs } = this.trainingConfig;
    if (maxEpochs > 0 && this.currentEpoch >= maxEpochs) {
      this.isTraining = false;
      this.notifyListeners();
      this.onCompleteCallback?.('maxEpochs');
      return;
    }

    // Guard-rail: skip if previous step still processing
    if (this.isProcessingStep) {
      // Schedule next check without executing a step
      requestAnimationFrame(() => void this.loop());
      return;
    }

    // Speed control: check if enough time has passed
    const now = performance.now();
    if (this.frameInterval > 0 && now - this.lastFrameTime < this.frameInterval) {
      requestAnimationFrame(() => void this.loop());
      return;
    }
    this.lastFrameTime = now;

    // Lock: prevent overlapping execution
    this.isProcessingStep = true;

    try {
      // Get training batch (all data or subset)
      const batch = this.getTrainingBatch();

      // Execute training step
      this.currentEpoch++;
      const result = await this.neuralNet.train(batch);
      this.currentLoss = result.loss;
      this.currentAccuracy = result.accuracy;

      // Evaluate on validation data if available
      let valLoss: number | null = null;
      let valAccuracy: number | null = null;

      if (this.validationData.length > 0) {
        const valResult = await this.neuralNet.evaluate(this.validationData);
        valLoss = valResult.loss;
        valAccuracy = valResult.accuracy;
        this.currentValLoss = valLoss;
        this.currentValAccuracy = valAccuracy;
      }

      // Record in history
      this.history = addHistoryRecord(this.history, {
        epoch: this.currentEpoch,
        loss: result.loss,
        accuracy: result.accuracy,
        valLoss,
        valAccuracy,
        timestamp: performance.now(),
      });

      // Check early stopping using strategy service
      if (this.earlyStoppingStrategy.shouldStop(valLoss)) {
        this.isTraining = false;
        this.notifyListeners();
        this.onCompleteCallback?.('earlyStopping');
        logger.info(`Early stopping triggered at epoch ${this.currentEpoch}`, {
          component: 'TrainingSession',
          action: 'earlyStopping',
          epoch: this.currentEpoch,
          bestValLoss: this.earlyStoppingStrategy.getBestValLoss(),
          epochsWithoutImprovement: this.earlyStoppingStrategy.getEpochsWithoutImprovement(),
        });
        return; // Exit loop
      }

      // Update learning rate based on schedule using scheduler service
      this.updateLearningRateIfNeeded();

      // Update visualisation at intervals (decouples rendering from training)
      if (this.currentEpoch % this.config.renderInterval === 0) {
        await this.updateVisualisation();
      }

      // Record boundary snapshot if recording is enabled
      if (this.recordingEnabled && this.currentEpoch % this.snapshotInterval === 0) {
        this.boundarySnapshots.push({
          epoch: this.currentEpoch,
          predictions: [...this.cachedPredictions],
        });
      }

      this.notifyListeners();
    } catch (error) {
      // Stop training on error (e.g., GradientExplosionError)
      this.isTraining = false;
      this.notifyListeners();
      console.error('Training loop error:', error);
      logger.error(
        'Training loop crashed',
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'TrainingSession',
          action: 'loop',
          epoch: this.currentEpoch,
        }
      );
    } finally {
      // Unlock: allow next step
      this.isProcessingStep = false;
      // Notify if we're stopping or pausing so UI knows processing is done
      if (!this.isTraining || this.isPaused) {
        this.notifyListeners();
      }
    }

    // Schedule next frame (only if still training and not at epoch limit)
    if (this.isTraining && !this.isPaused) {
      const stillUnderLimit = maxEpochs === 0 || this.currentEpoch < maxEpochs;
      if (stillUnderLimit) {
        requestAnimationFrame(() => void this.loop());
      } else {
        // Reached epoch limit
        this.isTraining = false;
        this.notifyListeners();
        this.onCompleteCallback?.('maxEpochs');
      }
    }
  }

  /**
   * Returns a batch of training data based on batchSize config.
   * If batchSize is 0 or >= data length, returns all data.
   * Otherwise, returns a random subset.
   */
  private getTrainingBatch(): Point[] {
    const { batchSize } = this.trainingConfig;

    // Use all data if batchSize is 0 or larger than dataset
    if (batchSize <= 0 || batchSize >= this.trainingData.length) {
      return this.trainingData;
    }

    // Random sampling without replacement
    const shuffled = [...this.trainingData];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i] as Point;
      shuffled[i] = shuffled[j] as Point;
      shuffled[j] = temp;
    }

    return shuffled.slice(0, batchSize);
  }

  // ===========================================================================
  // Visualisation
  // ===========================================================================

  /**
   * Updates the decision boundary visualisation.
   *
   * @remarks
   * The predictionGrid is reused across calls (no new allocations for input).
   * Predictions are immutable by design, so we replace the cached array.
   * Guards against rendering after session has been cleared.
   */
  private async updateVisualisation(): Promise<void> {
    // Guard: don't render if session was cleared while async operation was pending
    if (!this.datasetLoaded) {
      return;
    }

    // Get predictions (predictionGrid is reused, reducing input allocations)
    this.cachedPredictions = await this.neuralNet.predict(this.predictionGrid);

    // Guard again after async operation - session may have been cleared
    if (!this.datasetLoaded) {
      return;
    }

    // Render boundary, then data points on top
    this.visualizer.renderBoundary(this.cachedPredictions, this.config.gridSize);
    this.visualizer.renderData(this.allData);
  }

  // ===========================================================================
  // Initialisation Helpers
  // ===========================================================================

  /**
   * Pre-generates the prediction grid (once, at construction).
   * Grid points are in [-1, 1] range for both axes.
   */
  private initialisePredictionGrid(): void {
    const { gridSize } = this.config;

    // Clear and reuse existing array
    this.predictionGrid.length = 0;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Map grid indices to [-1, 1] range
        const x = (i / (gridSize - 1)) * 2 - 1;
        const y = (j / (gridSize - 1)) * 2 - 1;
        this.predictionGrid.push({ x, y, label: 0 });
      }
    }
  }

  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  private assertReadyToTrain(): void {
    if (!this.isInitialised) {
      throw new Error('Hyperparameters not set. Call setHyperparameters() first.');
    }
    if (!this.datasetLoaded) {
      throw new Error('No data loaded. Call loadData() first.');
    }
  }

  // ===========================================================================
  // Custom Data
  // ===========================================================================

  /**
   * Sets custom data points directly (for draw mode).
   * Bypasses the data repository and uses provided points.
   */
  setCustomData(points: Point[]): void {
    this.allData = [...points];
    this.datasetLoaded = points.length > 0;

    // Split into training/validation
    if (points.length > 0) {
      this.splitData();
    } else {
      this.trainingData = [];
      this.validationData = [];
    }

    this.notifyListeners();
  }

  /**
   * Returns the current dataset points.
   * Useful for session persistence.
   */
  getData(): Point[] {
    return [...this.allData];
  }

  /**
   * Returns the current training history.
   */
  getHistory(): TrainingHistory {
    return this.history;
  }

  /**
   * Returns the current learning rate (after warmup/decay adjustments).
   */
  getCurrentLearningRate(): number {
    return this.lrScheduler.getCurrentLR();
  }

  /**
   * Updates the learning rate using the LearningRateScheduler service.
   * Only updates if the change is significant to avoid unnecessary optimizer updates.
   */
  private updateLearningRateIfNeeded(): void {
    const previousLR = this.lrScheduler.getCurrentLR();
    const newLR = this.lrScheduler.calculateLR(this.currentEpoch, this.trainingConfig.maxEpochs);

    // Only update if LR changed significantly (more than 1%)
    if (this.lrScheduler.hasSignificantChange(previousLR, 0.01) && this.currentHyperparameters) {
      // Update optimizer learning rate WITHOUT destroying weights
      this.neuralNet.updateLearningRate(newLR);
    }
  }

  // ===========================================================================
  // Training Completion & Recording
  // ===========================================================================

  /**
   * Sets a callback to be called when training completes.
   * @param callback - Function called with completion reason
   */
  onComplete(callback: (reason: 'maxEpochs' | 'earlyStopping' | 'manual') => void): void {
    this.onCompleteCallback = callback;
  }

  /**
   * Enables or disables boundary evolution recording.
   * @param enabled - Whether to record snapshots
   * @param interval - Epochs between snapshots (default: 10)
   */
  setRecording(enabled: boolean, interval = 10): void {
    this.recordingEnabled = enabled;
    this.snapshotInterval = interval;
    if (enabled) {
      this.boundarySnapshots = [];
    }
  }

  /**
   * Returns recorded boundary snapshots.
   */
  getBoundarySnapshots(): Array<{ epoch: number; predictions: Prediction[] }> {
    return [...this.boundarySnapshots];
  }

  /**
   * Clears recorded boundary snapshots.
   */
  clearBoundarySnapshots(): void {
    this.boundarySnapshots = [];
  }

  /**
   * Runs learning rate finder test.
   * Trains with exponentially increasing LR and records loss at each step.
   * @param minLR - Starting learning rate (default: 1e-7)
   * @param maxLR - Ending learning rate (default: 1)
   * @param steps - Number of steps (default: 100)
   * @returns Array of {lr, loss} points
   */
  async runLRFinder(
    minLR = 1e-7,
    maxLR = 1,
    steps = 100
  ): Promise<Array<{ lr: number; loss: number }>> {
    this.assertReadyToTrain();

    // Pause training before running LR finder to prevent accessing disposed model
    const wasTraining = this.isTraining && !this.isPaused;
    if (wasTraining) {
      this.pause();
      // Wait for current step to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const results: Array<{ lr: number; loss: number }> = [];
    const lrMultiplier = Math.pow(maxLR / minLR, 1 / steps);
    let currentLR = minLR;

    // Store original hyperparameters to restore later
    const originalHyperparams = this.currentHyperparameters;
    if (!originalHyperparams) {
      throw new Error('Model not initialized');
    }

    // Run training steps with increasing LR
    for (let i = 0; i < steps; i++) {
      // Use dedicated method to update LR without destroying weights
      if ('setLearningRate' in this.neuralNet) {
        // @ts-ignore - We know it exists on our implementation
        this.neuralNet.setLearningRate(currentLR);
      } else {
        // Fallback for implementations that don't support dynamic LR
        await this.neuralNet.initialize({
          ...originalHyperparams,
          learningRate: currentLR,
        });
      }

      // Train one batch
      const batch = this.getTrainingBatch();
      const result = await this.neuralNet.train(batch);

      results.push({
        lr: currentLR,
        loss: result.loss,
      });

      // Stop if loss explodes
      if (!isFinite(result.loss) || result.loss > 1e10) {
        break;
      }

      // Increase LR exponentially
      currentLR *= lrMultiplier;
    }

    // Restore original model
    await this.neuralNet.initialize(originalHyperparams);

    return results;
  }
}

import type { Hyperparameters, Point, Prediction, TrainingConfig, TrainingHistory, ExportFormat, LRScheduleConfig } from '../domain';
import { DEFAULT_TRAINING_CONFIG, DEFAULT_LR_SCHEDULE, createEmptyHistory, addHistoryRecord, exportHistory } from '../domain';
import type { INeuralNetworkService, IVisualizerService, IDatasetRepository, DatasetOptions } from '../ports';
import type { ITrainingSession, TrainingState } from './ITrainingSession';

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

  // Early stopping tracking
  private bestValLoss: number | null = null;
  private epochsWithoutImprovement = 0;

  // Learning rate scheduling
  private initialLearningRate = 0.03;
  private currentLearningRate = 0.03;
  private currentHyperparameters: Hyperparameters | null = null;

  constructor(
    private readonly neuralNet: INeuralNetworkService,
    private readonly visualizer: IVisualizerService,
    private readonly dataRepo: IDatasetRepository,
    config: Partial<TrainingSessionConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialisePredictionGrid();
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

    // Re-split data if validation split changed
    if (config.validationSplit !== undefined && this.allData.length > 0) {
      this.splitData();
    }

    this.notifyListeners();
  }

  async setHyperparameters(config: Hyperparameters): Promise<void> {
    await this.neuralNet.initialize(config);
    this.isInitialised = true;
    this.currentEpoch = 0;
    this.currentLoss = null;
    this.currentAccuracy = null;
    this.history = createEmptyHistory();
    
    // Store for LR scheduling
    this.currentHyperparameters = config;
    this.initialLearningRate = config.learningRate;
    this.currentLearningRate = config.learningRate;
    
    // Reset early stopping
    this.bestValLoss = null;
    this.epochsWithoutImprovement = 0;
    
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
   * Splits the dataset into training and validation sets based on validationSplit.
   * Shuffles data before splitting for randomness.
   */
  private splitData(): void {
    const { validationSplit } = this.trainingConfig;

    if (validationSplit <= 0 || validationSplit >= 1) {
      // No validation split
      this.trainingData = this.allData;
      this.validationData = [];
      return;
    }

    // Shuffle data
    const shuffled = [...this.allData];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i] as Point;
      shuffled[i] = shuffled[j] as Point;
      shuffled[j] = temp;
    }

    // Split
    const splitIndex = Math.floor(shuffled.length * (1 - validationSplit));
    this.trainingData = shuffled.slice(0, splitIndex).map(p => ({ ...p, isValidation: false }));
    this.validationData = shuffled.slice(splitIndex).map(p => ({ ...p, isValidation: true }));
    
    // Update allData with validation markers for visualization
    this.allData = [...this.trainingData, ...this.validationData];
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

      // Check early stopping
      if (this.checkEarlyStopping(valLoss)) {
        this.isTraining = false;
        this.notifyListeners();
        console.log(`Early stopping triggered at epoch ${this.currentEpoch}`);
        return; // Exit loop
      }

      // Update learning rate based on schedule
      await this.updateLearningRateIfNeeded();

      // Update visualisation at intervals (decouples rendering from training)
      if (this.currentEpoch % this.config.renderInterval === 0) {
        await this.updateVisualisation();
      }

      this.notifyListeners();
    } catch (error) {
      // Stop training on error (e.g., GradientExplosionError)
      this.isTraining = false;
      this.notifyListeners();
      console.error('Training loop error:', error);
    } finally {
      // Unlock: allow next step
      this.isProcessingStep = false;
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
    if (!this.datasetLoaded || !this.isTraining) {
      return;
    }
    
    // Get predictions (predictionGrid is reused, reducing input allocations)
    this.cachedPredictions = await this.neuralNet.predict(this.predictionGrid);

    // Guard again after async operation - session may have been cleared
    if (!this.datasetLoaded || !this.isTraining) {
      return;
    }

    // Render boundary, then data points on top
    this.visualizer.renderBoundary(this.cachedPredictions, this.config.gridSize);
    this.visualizer.renderData(this.trainingData);
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
   * Returns the current learning rate (after warmup/decay adjustments).
   */
  getCurrentLearningRate(): number {
    return this.currentLearningRate;
  }

  // ===========================================================================
  // Learning Rate Scheduling
  // ===========================================================================

  /**
   * Calculates the learning rate based on the current epoch and schedule.
   * Applies warmup first if configured, then applies the decay schedule.
   */
  private calculateScheduledLR(epoch: number): number {
    const schedule = this.trainingConfig.lrSchedule ?? DEFAULT_LR_SCHEDULE;
    const initialLR = this.initialLearningRate;
    const warmupEpochs = schedule.warmupEpochs ?? 0;

    // Apply warmup: linear increase from 0 to initialLR
    if (warmupEpochs > 0 && epoch < warmupEpochs) {
      return initialLR * (epoch + 1) / warmupEpochs;
    }

    // Adjust epoch for decay calculation (subtract warmup epochs)
    const effectiveEpoch = warmupEpochs > 0 ? epoch - warmupEpochs : epoch;

    switch (schedule.type) {
      case 'exponential': {
        // LR = initial_lr * decay_rate^epoch
        const decayRate = schedule.decayRate ?? 0.95;
        return initialLR * Math.pow(decayRate, effectiveEpoch);
      }

      case 'step': {
        // LR = initial_lr * decay_rate^(epoch / decay_steps)
        const decayRate = schedule.decayRate ?? 0.5;
        const decaySteps = schedule.decaySteps ?? 10;
        const numDecays = Math.floor(effectiveEpoch / decaySteps);
        return initialLR * Math.pow(decayRate, numDecays);
      }

      case 'cosine': {
        // Cosine annealing: LR = initial_lr * 0.5 * (1 + cos(pi * epoch / max_epochs))
        const maxEpochs = Math.max((this.trainingConfig.maxEpochs || 100) - warmupEpochs, 1);
        const progress = Math.min(effectiveEpoch / maxEpochs, 1);
        return initialLR * 0.5 * (1 + Math.cos(Math.PI * progress));
      }

      case 'none':
      default:
        return initialLR;
    }
  }

  /**
   * Updates the learning rate if it has changed significantly.
   * Recompiles the model with the new learning rate.
   */
  private async updateLearningRateIfNeeded(): Promise<void> {
    const newLR = this.calculateScheduledLR(this.currentEpoch);
    
    // Only update if LR changed by more than 1%
    const lrChangeRatio = Math.abs(newLR - this.currentLearningRate) / this.currentLearningRate;
    if (lrChangeRatio > 0.01 && this.currentHyperparameters) {
      this.currentLearningRate = newLR;
      
      // Reinitialize with new learning rate (keeps weights via TF.js optimizer update)
      // Note: This is a simplified approach - ideally we'd just update the optimizer
      await this.neuralNet.initialize({
        ...this.currentHyperparameters,
        learningRate: newLR,
      });
    }
  }

  // ===========================================================================
  // Early Stopping
  // ===========================================================================

  /**
   * Checks if training should stop early based on validation loss.
   * Returns true if early stopping is triggered.
   */
  private checkEarlyStopping(valLoss: number | null): boolean {
    const patience = this.trainingConfig.earlyStoppingPatience ?? 0;
    
    // Early stopping disabled
    if (patience <= 0 || valLoss === null) {
      return false;
    }

    // First validation loss - set as best
    if (this.bestValLoss === null) {
      this.bestValLoss = valLoss;
      this.epochsWithoutImprovement = 0;
      return false;
    }

    // Check if validation loss improved
    if (valLoss < this.bestValLoss) {
      this.bestValLoss = valLoss;
      this.epochsWithoutImprovement = 0;
      return false;
    }

    // No improvement
    this.epochsWithoutImprovement++;
    
    // Trigger early stopping if patience exceeded
    return this.epochsWithoutImprovement >= patience;
  }
}

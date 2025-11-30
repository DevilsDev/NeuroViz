import type { Hyperparameters, Point, Prediction } from '../domain';
import type { INeuralNetworkService, IVisualizerService, IDatasetRepository } from '../ports';
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
  private isInitialised = false;
  private datasetLoaded = false;

  // Loop control flags
  private isTraining = false;
  private isPaused = false;
  private isProcessingStep = false;

  // Data caches (reused to reduce GC pressure)
  private trainingData: Point[] = [];
  private readonly predictionGrid: Point[] = [];
  private cachedPredictions: Prediction[] = [];

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
      isRunning: this.isTraining,
      isPaused: this.isPaused,
      isInitialised: this.isInitialised,
      datasetLoaded: this.datasetLoaded,
    };
  }

  async setHyperparameters(config: Hyperparameters): Promise<void> {
    await this.neuralNet.initialize(config);
    this.isInitialised = true;
    this.currentEpoch = 0;
    this.currentLoss = null;
    this.notifyListeners();
  }

  async loadData(datasetType: string): Promise<void> {
    this.trainingData = await this.dataRepo.getDataset(datasetType);
    this.datasetLoaded = true;
    this.visualizer.renderData(this.trainingData);
    this.notifyListeners();
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
   * Stops the loop and clears epoch/loss.
   */
  reset(): void {
    this.isTraining = false;
    this.isPaused = false;
    this.isProcessingStep = false;
    this.currentEpoch = 0;
    this.currentLoss = null;

    // Re-render data points without boundary
    if (this.datasetLoaded) {
      this.visualizer.renderData(this.trainingData);
    }

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
      this.currentLoss = await this.neuralNet.train(this.trainingData);

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
   * 2. If already processing a step → skip this frame (GPU busy)
   * 3. Otherwise → execute step, then schedule next frame
   *
   * This ensures we never start Step N+1 before Step N completes,
   * even if requestAnimationFrame fires faster than GPU training.
   */
  private async loop(): Promise<void> {
    // Exit condition: training stopped or paused
    if (!this.isTraining || this.isPaused) {
      return;
    }

    // Guard-rail: skip if previous step still processing
    if (this.isProcessingStep) {
      // Schedule next check without executing a step
      requestAnimationFrame(() => void this.loop());
      return;
    }

    // Lock: prevent overlapping execution
    this.isProcessingStep = true;

    try {
      // Execute training step
      this.currentEpoch++;
      this.currentLoss = await this.neuralNet.train(this.trainingData);

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

    // Schedule next frame (only if still training)
    if (this.isTraining && !this.isPaused) {
      requestAnimationFrame(() => void this.loop());
    }
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
   */
  private async updateVisualisation(): Promise<void> {
    // Get predictions (predictionGrid is reused, reducing input allocations)
    this.cachedPredictions = await this.neuralNet.predict(this.predictionGrid);

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
}

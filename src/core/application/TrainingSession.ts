import type { Hyperparameters, Point } from '../domain';
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
  /** Delay between training steps in ms (controls animation speed). Default: 50 */
  readonly stepDelayMs: number;
}

const DEFAULT_CONFIG: TrainingSessionConfig = {
  renderInterval: 10,
  gridSize: 50,
  stepDelayMs: 50,
};

/**
 * Orchestrates the training workflow.
 * Acts as the "Director" coordinating neural network, visualiser, and data repository.
 *
 * @remarks
 * - Uses constructor injection for all dependencies (loose coupling)
 * - Manages training loop lifecycle (start/pause/reset)
 * - Decouples training speed from rendering cost via renderInterval
 */
export class TrainingSession implements ITrainingSession {
  private readonly config: TrainingSessionConfig;
  private readonly stateListeners: Set<(state: TrainingState) => void> = new Set();

  private currentEpoch = 0;
  private currentLoss: number | null = null;
  private isRunning = false;
  private isPaused = false;
  private isInitialised = false;
  private datasetLoaded = false;

  private trainingData: Point[] = [];
  private predictionGrid: Point[] = [];
  private animationFrameId: number | null = null;
  private stepTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly neuralNet: INeuralNetworkService,
    private readonly visualizer: IVisualizerService,
    private readonly dataRepo: IDatasetRepository,
    config: Partial<TrainingSessionConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.predictionGrid = this.generatePredictionGrid();
  }

  getState(): TrainingState {
    return {
      currentEpoch: this.currentEpoch,
      currentLoss: this.currentLoss,
      isRunning: this.isRunning,
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

  start(): void {
    this.assertReadyToTrain();

    if (this.isRunning && !this.isPaused) {
      return; // Already running
    }

    this.isRunning = true;
    this.isPaused = false;
    this.notifyListeners();
    this.scheduleNextStep();
  }

  pause(): void {
    if (!this.isRunning) {
      return;
    }

    this.isPaused = true;
    this.cancelScheduledStep();
    this.notifyListeners();
  }

  reset(): void {
    this.cancelScheduledStep();
    this.currentEpoch = 0;
    this.currentLoss = null;
    this.isRunning = false;
    this.isPaused = false;

    // Re-render data points without boundary
    if (this.datasetLoaded) {
      this.visualizer.renderData(this.trainingData);
    }

    this.notifyListeners();
  }

  async step(): Promise<void> {
    this.assertReadyToTrain();

    this.currentEpoch++;
    this.currentLoss = await this.neuralNet.train(this.trainingData);

    // Render boundary at intervals to decouple training from rendering cost
    if (this.currentEpoch % this.config.renderInterval === 0) {
      await this.renderBoundary();
    }

    this.notifyListeners();
  }

  onStateChange(callback: (state: TrainingState) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  dispose(): void {
    this.cancelScheduledStep();
    this.isRunning = false;
    this.isPaused = false;
    this.stateListeners.clear();
    // Note: neuralNet.dispose() should be called by the composition root
  }

  private async executeStep(): Promise<void> {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    await this.step();
    this.scheduleNextStep();
  }

  private scheduleNextStep(): void {
    this.stepTimeoutId = setTimeout(() => {
      this.animationFrameId = requestAnimationFrame(() => {
        this.executeStep();
      });
    }, this.config.stepDelayMs);
  }

  private cancelScheduledStep(): void {
    if (this.stepTimeoutId !== null) {
      clearTimeout(this.stepTimeoutId);
      this.stepTimeoutId = null;
    }
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private async renderBoundary(): Promise<void> {
    const predictions = await this.neuralNet.predict(this.predictionGrid);
    this.visualizer.renderBoundary(predictions, this.config.gridSize);
    // Re-render data points on top of boundary
    this.visualizer.renderData(this.trainingData);
  }

  private generatePredictionGrid(): Point[] {
    const grid: Point[] = [];
    const { gridSize } = this.config;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Map grid indices to [-1, 1] range
        const x = (i / (gridSize - 1)) * 2 - 1;
        const y = (j / (gridSize - 1)) * 2 - 1;
        grid.push({ x, y, label: 0 }); // Label ignored for prediction
      }
    }

    return grid;
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

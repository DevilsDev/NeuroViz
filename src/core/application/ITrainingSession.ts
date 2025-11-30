import type { Hyperparameters, TrainingConfig, TrainingHistory, ExportFormat } from '../domain';

/**
 * Training session state exposed to the UI layer.
 * Immutable snapshot of current training progress.
 */
export interface TrainingState {
  readonly currentEpoch: number;
  readonly currentLoss: number | null;
  /** Current training accuracy (0-1) */
  readonly currentAccuracy: number | null;
  /** Current validation loss (null if no validation split) */
  readonly currentValLoss: number | null;
  /** Current validation accuracy (null if no validation split) */
  readonly currentValAccuracy: number | null;
  readonly isRunning: boolean;
  readonly isPaused: boolean;
  readonly isInitialised: boolean;
  readonly datasetLoaded: boolean;
  /** Maximum epochs (0 = unlimited) */
  readonly maxEpochs: number;
  /** Current batch size (0 = all samples) */
  readonly batchSize: number;
  /** Target FPS for training loop */
  readonly targetFps: number;
  /** Validation split fraction (0-1) */
  readonly validationSplit: number;
  /** Training history with all epoch records */
  readonly history: TrainingHistory;
}

/**
 * Public interface for training session control.
 * Follows Interface Segregation Principle—exposes only control methods.
 *
 * @remarks
 * Implementation details (neural network, visualiser, data repo) are hidden.
 * UI layer interacts only through this contract.
 */
export interface ITrainingSession {
  /**
   * Returns the current training state.
   */
  getState(): TrainingState;

  /**
   * Configures hyperparameters and initialises the neural network.
   * Must be called before start().
   */
  setHyperparameters(config: Hyperparameters): Promise<void>;

  /**
   * Loads a dataset and renders it on the visualiser.
   * @param datasetType - Dataset identifier (e.g., 'circle', 'xor')
   */
  loadData(datasetType: string): Promise<void>;

  /**
   * Starts or resumes the training loop.
   * @throws If hyperparameters not set or data not loaded
   */
  start(): void;

  /**
   * Pauses the training loop. Can be resumed with start().
   */
  pause(): void;

  /**
   * Stops training and resets state.
   * Hyperparameters and loaded data are preserved.
   */
  reset(): void;

  /**
   * Executes a single training step manually.
   * Useful for step-by-step debugging.
   */
  step(): Promise<void>;

  /**
   * Updates runtime training configuration.
   * Can be called during training to adjust batch size, speed, etc.
   */
  setTrainingConfig(config: Partial<TrainingConfig>): void;

  /**
   * Exports training history in the specified format.
   * @param format - 'json' or 'csv'
   * @returns Formatted string of training history
   */
  exportHistory(format: ExportFormat): string;

  /**
   * Registers a callback for state changes.
   * @returns Unsubscribe function
   */
  onStateChange(callback: (state: TrainingState) => void): () => void;

  /**
   * Cleans up resources (stops training, disposes model).
   */
  dispose(): void;
}

import type { Hyperparameters, Point, Prediction } from '../domain';

/**
 * Result of a training step, including loss and accuracy.
 */
export interface TrainResult {
  /** Training loss for this batch/epoch */
  readonly loss: number;
  /** Training accuracy (0-1) for this batch/epoch */
  readonly accuracy: number;
}

/**
 * Port for neural network operations.
 * Abstracts the ML framework (TensorFlow.js, ONNX, etc.) from the core domain.
 *
 * @remarks
 * Implementations must handle their own resource lifecycle (model disposal, memory cleanup).
 */
export interface INeuralNetworkService {
  /**
   * Initialises the neural network with the given configuration.
   * Must be called before train() or predict().
   *
   * @param config - Hyperparameters defining network architecture and training settings
   * @throws If initialisation fails (e.g., invalid layer configuration)
   */
  initialize(config: Hyperparameters): Promise<void>;

  /**
   * Trains the network on the provided dataset.
   *
   * @param data - Array of labelled points for supervised learning
   * @returns Training result with loss and accuracy
   * @throws If called before initialize() or if training fails
   */
  train(data: Point[]): Promise<TrainResult>;

  /**
   * Generates predictions for a grid of points.
   * Used to compute decision boundaries for visualisation.
   *
   * @param grid - Array of points to classify (labels are ignored)
   * @returns Predictions with confidence scores for each grid point
   * @throws If called before initialize() or if inference fails
   */
  predict(grid: Point[]): Promise<Prediction[]>;

  /**
   * Evaluates the model on a dataset without updating weights.
   * Used for validation loss calculation.
   *
   * @param data - Array of labelled points for evaluation
   * @returns Evaluation result with loss and accuracy
   * @throws If called before initialize() or if evaluation fails
   */
  evaluate(data: Point[]): Promise<TrainResult>;

  /**
   * Exports the trained model as downloadable files.
   * Returns a Blob containing the model in TensorFlow.js format.
   *
   * @returns Object containing model topology and weights as Blobs
   * @throws If called before initialize() or if export fails
   */
  exportModel(): Promise<{ modelJson: Blob; weightsBlob: Blob }>;
}

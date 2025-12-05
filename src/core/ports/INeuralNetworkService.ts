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
   * Updates the learning rate without destroying trained weights.
   * Used for learning rate scheduling during training.
   *
   * @param newLearningRate - The new learning rate to apply
   * @throws If called before initialize()
   */
  updateLearningRate(newLearningRate: number): void;

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
   * Gets weight matrices for each layer connection.
   * Used for network diagram weight visualization.
   *
   * @returns Array of weight matrices [layer][fromNode][toNode]
   */
  getWeightMatrices(): number[][][];

  /**
   * Gets activations for each layer given an input point.
   * Used for neuron activation visualization.
   *
   * @param point - Input point to get activations for
   * @returns Array of activation arrays per layer
   */
  getLayerActivations(point: Point): number[][];

  /**
   * Loads a model from JSON and weights files.
   *
   * @param modelJson - The model topology JSON file
   * @param weightsBlob - The model weights binary file
   * @throws If loading fails
   */
  loadModel(modelJson: File, weightsBlob: File): Promise<void>;
}

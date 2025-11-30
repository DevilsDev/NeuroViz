/**
 * Supported optimizer algorithms.
 */
export type OptimizerType = 'sgd' | 'adam' | 'rmsprop' | 'adagrad';

/**
 * Supported activation functions.
 */
export type ActivationType = 'relu' | 'sigmoid' | 'tanh' | 'elu';

/**
 * Configuration for neural network architecture and training.
 * Encapsulates tuneable parameters that affect model behaviour.
 */
export interface Hyperparameters {
  /** Learning rate for gradient descent optimisation */
  readonly learningRate: number;

  /** Array defining neurons per hidden layer (e.g., [4, 2] = two layers with 4 and 2 neurons) */
  readonly layers: readonly number[];

  /** Optimizer algorithm (default: 'adam') */
  readonly optimizer?: OptimizerType;

  /** Activation function for hidden layers (default: 'relu') */
  readonly activation?: ActivationType;

  /** L2 regularization strength (weight decay). 0 = disabled. */
  readonly l2Regularization?: number;

  /** Number of output classes (default: 2 for binary classification) */
  readonly numClasses?: number;
}

/**
 * Runtime training configuration (can be changed during training).
 */
export interface TrainingConfig {
  /** Number of samples per training batch (default: all samples) */
  readonly batchSize?: number;

  /** Maximum epochs before auto-stop. 0 = unlimited. */
  readonly maxEpochs?: number;

  /** Target frames per second for training loop (default: 60) */
  readonly targetFps?: number;

  /** Delay between epochs in milliseconds (alternative to FPS control) */
  readonly epochDelayMs?: number;

  /** Fraction of data to use for validation (0-1). 0 = no validation. */
  readonly validationSplit?: number;
}

/**
 * Default hyperparameters for new networks.
 */
export const DEFAULT_HYPERPARAMETERS: Required<Hyperparameters> = {
  learningRate: 0.03,
  layers: [8, 4],
  optimizer: 'adam',
  activation: 'relu',
  l2Regularization: 0,
  numClasses: 2,
};

/**
 * Default training configuration.
 */
export const DEFAULT_TRAINING_CONFIG: Required<TrainingConfig> = {
  batchSize: 0, // 0 = use all samples
  maxEpochs: 0, // 0 = unlimited
  targetFps: 60,
  epochDelayMs: 0,
  validationSplit: 0.2, // 20% validation by default
};

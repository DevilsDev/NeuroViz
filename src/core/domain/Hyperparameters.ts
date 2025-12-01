/**
 * Supported optimizer algorithms.
 */
export type OptimizerType = 'sgd' | 'adam' | 'rmsprop' | 'adagrad';

/**
 * Supported activation functions.
 */
export type ActivationType = 'relu' | 'sigmoid' | 'tanh' | 'elu';

/**
 * Learning rate schedule types.
 */
export type LRScheduleType = 'none' | 'exponential' | 'step' | 'cosine';

/**
 * Learning rate schedule configuration.
 */
export interface LRScheduleConfig {
  /** Schedule type */
  readonly type: LRScheduleType;
  /** Decay rate for exponential/step decay (e.g., 0.95 = 5% decay) */
  readonly decayRate?: number;
  /** Steps between decay for step schedule */
  readonly decaySteps?: number;
  /** Number of warmup epochs (gradual increase from 0 to target LR). 0 = disabled. */
  readonly warmupEpochs?: number;
}

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

  /** Momentum for SGD optimizer (0-1). Only used when optimizer is 'sgd'. Default: 0.9 */
  readonly momentum?: number;

  /** Default activation function for hidden layers (default: 'relu') */
  readonly activation?: ActivationType;

  /** Per-layer activation functions. If provided, overrides `activation` for each layer. */
  readonly layerActivations?: readonly ActivationType[];

  /** L1 regularization strength (sparsity). 0 = disabled. */
  readonly l1Regularization?: number;

  /** L2 regularization strength (weight decay). 0 = disabled. */
  readonly l2Regularization?: number;

  /** Number of output classes (default: 2 for binary classification) */
  readonly numClasses?: number;

  /** Dropout rate (0-1). 0 = disabled. Applied after each hidden layer. */
  readonly dropoutRate?: number;

  /** Gradient clipping norm. 0 = disabled. Clips gradients to this max norm. */
  readonly clipNorm?: number;

  /** Whether to use batch normalization between layers. */
  readonly batchNorm?: boolean;
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

  /** Learning rate schedule configuration */
  readonly lrSchedule?: LRScheduleConfig;

  /** Early stopping patience (epochs without improvement). 0 = disabled. */
  readonly earlyStoppingPatience?: number;
}

/**
 * Default hyperparameters for new networks.
 */
export const DEFAULT_HYPERPARAMETERS: Required<Hyperparameters> = {
  learningRate: 0.03,
  layers: [8, 4],
  optimizer: 'adam',
  momentum: 0.9,
  activation: 'relu',
  layerActivations: [],
  l1Regularization: 0,
  l2Regularization: 0,
  numClasses: 2,
  dropoutRate: 0,
  clipNorm: 0,
  batchNorm: false,
};

/**
 * Default learning rate schedule.
 */
export const DEFAULT_LR_SCHEDULE: LRScheduleConfig = {
  type: 'none',
  decayRate: 0.95,
  decaySteps: 10,
  warmupEpochs: 0,
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
  lrSchedule: DEFAULT_LR_SCHEDULE,
  earlyStoppingPatience: 0, // 0 = disabled
};

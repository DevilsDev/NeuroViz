/**
 * Configuration for neural network architecture and training.
 * Encapsulates tuneable parameters that affect model behaviour.
 */
export interface Hyperparameters {
  /** Learning rate for gradient descent optimisation */
  readonly learningRate: number;
  /** Array defining neurons per hidden layer (e.g., [4, 2] = two layers with 4 and 2 neurons) */
  readonly layers: readonly number[];
}

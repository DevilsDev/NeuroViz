/**
 * Custom errors for TensorFlow.js neural network operations.
 */

/**
 * Thrown when gradient explosion causes NaN loss during training.
 * Typically indicates the learning rate is too high.
 */
export class GradientExplosionError extends Error {
  readonly code = 'GRADIENT_EXPLOSION';

  constructor(message = 'Training produced NaN loss. Try lowering the learning rate.') {
    super(message);
    this.name = 'GradientExplosionError';
    Object.setPrototypeOf(this, GradientExplosionError.prototype);
  }
}

/**
 * Thrown when attempting to use an uninitialised model.
 */
export class ModelNotInitialisedError extends Error {
  readonly code = 'MODEL_NOT_INITIALISED';

  constructor(message = 'Model not initialised. Call initialize() first.') {
    super(message);
    this.name = 'ModelNotInitialisedError';
    Object.setPrototypeOf(this, ModelNotInitialisedError.prototype);
  }
}

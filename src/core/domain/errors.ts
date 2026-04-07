/**
 * Base class for all NeuroViz domain errors.
 * Provides a typed `code` field for programmatic error discrimination
 * instead of string-matching on error messages.
 */
export abstract class NeuroVizError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * The model was disposed (e.g., during re-initialisation) while an async
 * operation was in flight. This is expected and should be silently ignored.
 */
export class ModelDisposedError extends NeuroVizError {
  readonly code = 'MODEL_DISPOSED';

  constructor(message = 'Model was disposed during operation.') {
    super(message);
  }
}

/**
 * Gradient explosion produced NaN loss during training.
 * Typically indicates the learning rate is too high.
 */
export class GradientExplosionError extends NeuroVizError {
  readonly code = 'GRADIENT_EXPLOSION';

  constructor(message = 'Training produced NaN loss. Try lowering the learning rate.') {
    super(message);
  }
}

/**
 * Attempted to use an uninitialised model.
 */
export class ModelNotInitialisedError extends NeuroVizError {
  readonly code = 'MODEL_NOT_INITIALISED';

  constructor(message = 'Model not initialised. Call initialize() first.') {
    super(message);
  }
}

/**
 * Dataset validation failed (e.g., empty data, invalid labels).
 */
export class DatasetError extends NeuroVizError {
  readonly code = 'DATASET_ERROR';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Training configuration is invalid.
 */
export class ConfigurationError extends NeuroVizError {
  readonly code = 'CONFIGURATION_ERROR';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Checks if an error is a ModelDisposedError or has a message indicating disposal.
 * Use this instead of string-matching on error messages.
 */
export function isModelDisposedError(error: unknown): boolean {
  if (error instanceof ModelDisposedError) return true;
  if (error instanceof Error && error.message.includes('disposed')) return true;
  return false;
}

/**
 * Represents a neural network prediction for a point in 2D space.
 * Used for rendering decision boundaries.
 */
export interface Prediction {
  /** X-coordinate of the predicted point */
  readonly x: number;
  /** Y-coordinate of the predicted point */
  readonly y: number;
  /** Confidence score (0-1) indicating prediction certainty */
  readonly confidence: number;
}

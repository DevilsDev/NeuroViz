/**
 * Represents a neural network prediction for a point in 2D space.
 * Used for rendering decision boundaries.
 */
export interface Prediction {
  /** X-coordinate of the predicted point */
  readonly x: number;
  /** Y-coordinate of the predicted point */
  readonly y: number;
  /** 
   * Confidence score (0-1) for binary classification.
   * For multi-class, this is the max probability.
   */
  readonly confidence: number;
  /** Predicted class label (0, 1, 2, ...) */
  readonly predictedClass: number;
  /** 
   * Probability distribution over all classes.
   * For binary: [p(class0), p(class1)]
   * For multi-class: [p(class0), p(class1), p(class2), ...]
   */
  readonly probabilities?: readonly number[];
}

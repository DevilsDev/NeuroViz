/**
 * Represents a data point in 2D space with a classification label.
 * Used as input for neural network training and visualisation.
 */
export interface Point {
  /** X-coordinate in the 2D plane */
  readonly x: number;
  /** Y-coordinate in the 2D plane */
  readonly y: number;
  /** Classification label (e.g., 0 or 1 for binary classification) */
  readonly label: number;
  /** Whether this point is part of the validation set (optional) */
  readonly isValidation?: boolean;
}

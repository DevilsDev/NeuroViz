/**
 * Early Stopping Strategy
 *
 * Monitors validation loss and determines when to stop training
 * to prevent overfitting.
 *
 * Strategy: Stop training if validation loss doesn't improve for
 * a specified number of epochs (patience).
 */
export class EarlyStoppingStrategy {
  private bestValLoss: number | null = null;
  private epochsWithoutImprovement = 0;

  constructor(private patience: number) {}

  /**
   * Checks if training should stop early based on current validation loss
   * @param valLoss - Current validation loss (null if no validation set)
   * @returns true if training should stop, false otherwise
   */
  shouldStop(valLoss: number | null): boolean {
    // Early stopping disabled or no validation data
    if (this.patience <= 0 || valLoss === null) {
      return false;
    }

    // First validation loss - set as best
    if (this.bestValLoss === null) {
      this.bestValLoss = valLoss;
      this.epochsWithoutImprovement = 0;
      return false;
    }

    // Check if validation loss improved
    if (valLoss < this.bestValLoss) {
      this.bestValLoss = valLoss;
      this.epochsWithoutImprovement = 0;
      return false;
    }

    // No improvement
    this.epochsWithoutImprovement++;

    // Trigger early stopping if patience exceeded
    return this.epochsWithoutImprovement >= this.patience;
  }

  /**
   * Resets the early stopping state
   * Call this when restarting training or reinitializing the model
   */
  reset(): void {
    this.bestValLoss = null;
    this.epochsWithoutImprovement = 0;
  }

  /**
   * Gets the best validation loss seen so far
   */
  getBestValLoss(): number | null {
    return this.bestValLoss;
  }

  /**
   * Gets the number of epochs without improvement
   */
  getEpochsWithoutImprovement(): number {
    return this.epochsWithoutImprovement;
  }

  /**
   * Updates the patience value
   */
  setPatience(patience: number): void {
    this.patience = patience;
  }

  /**
   * Gets the current patience value
   */
  getPatience(): number {
    return this.patience;
  }
}

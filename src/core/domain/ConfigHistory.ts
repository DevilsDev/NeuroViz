import type { Hyperparameters } from './Hyperparameters';

/**
 * Configuration snapshot for undo/redo
 */
export interface ConfigSnapshot {
  readonly config: Hyperparameters;
  readonly timestamp: number;
  readonly description: string;
}

/**
 * Configuration history manager for undo/redo functionality
 */
export class ConfigHistory {
  private history: ConfigSnapshot[] = [];
  private currentIndex: number = -1;
  private readonly maxHistory: number = 50; // Limit history size

  /**
   * Saves a configuration snapshot
   */
  push(config: Hyperparameters, description: string = 'Config change'): void {
    // Remove any history after current index (if we went back and made new changes)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new snapshot
    const snapshot: ConfigSnapshot = {
      config: { ...config },
      timestamp: Date.now(),
      description,
    };

    this.history.push(snapshot);
    this.currentIndex = this.history.length - 1;

    // Trim history if too large
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(this.history.length - this.maxHistory);
      this.currentIndex = this.history.length - 1;
    }
  }

  /**
   * Undo to previous configuration
   */
  undo(): Hyperparameters | null {
    if (!this.canUndo()) return null;

    this.currentIndex--;
    return this.getCurrent();
  }

  /**
   * Redo to next configuration
   */
  redo(): Hyperparameters | null {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    return this.getCurrent();
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current configuration
   */
  getCurrent(): Hyperparameters | null {
    return this.history[this.currentIndex]?.config ?? null;
  }

  /**
   * Get current snapshot
   */
  getCurrentSnapshot(): ConfigSnapshot | null {
    return this.history[this.currentIndex] ?? null;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get history size
   */
  size(): number {
    return this.history.length;
  }
}

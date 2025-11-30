import { vi } from 'vitest';
import type { INeuralNetworkService } from '../../../src/core/ports';
import type { Hyperparameters, Point, Prediction } from '../../../src/core/domain';

/**
 * Mock implementation of INeuralNetworkService for unit testing.
 * Provides predictable, controllable behaviour without TensorFlow.js dependency.
 */
export class MockNeuralNetworkService implements INeuralNetworkService {
  /** Tracks whether initialize() was called */
  initializeCalled = false;
  /** Stores the config passed to initialize() */
  lastConfig: Hyperparameters | null = null;
  /** Tracks number of train() calls */
  trainCallCount = 0;
  /** Tracks number of predict() calls */
  predictCallCount = 0;
  /** Configurable loss values to return from train() */
  lossSequence: number[] = [0.5, 0.4, 0.3, 0.2, 0.1];
  /** Current index in loss sequence */
  private lossIndex = 0;

  // Vitest spies for assertion
  readonly initialize = vi.fn(async (config: Hyperparameters): Promise<void> => {
    this.initializeCalled = true;
    this.lastConfig = config;
  });

  readonly train = vi.fn(async (_data: Point[]): Promise<number> => {
    this.trainCallCount++;
    const loss = this.lossSequence[this.lossIndex] ?? 0.01;
    this.lossIndex = Math.min(this.lossIndex + 1, this.lossSequence.length - 1);
    return loss;
  });

  readonly predict = vi.fn(async (grid: Point[]): Promise<Prediction[]> => {
    this.predictCallCount++;
    // Return mock predictions with confidence based on position
    return grid.map((point) => ({
      x: point.x,
      y: point.y,
      confidence: 0.5 + point.x * 0.25, // Deterministic confidence
    }));
  });

  /**
   * Reset all state and spies for clean test isolation.
   */
  reset(): void {
    this.initializeCalled = false;
    this.lastConfig = null;
    this.trainCallCount = 0;
    this.predictCallCount = 0;
    this.lossIndex = 0;
    this.initialize.mockClear();
    this.train.mockClear();
    this.predict.mockClear();
  }

  /**
   * Configure the sequence of loss values to return from train().
   */
  setLossSequence(losses: number[]): void {
    this.lossSequence = losses;
    this.lossIndex = 0;
  }
}

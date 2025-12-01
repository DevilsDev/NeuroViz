import { vi } from 'vitest';
import type { INeuralNetworkService, TrainResult } from '../../../src/core/ports';
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
  /** Tracks number of evaluate() calls */
  evaluateCallCount = 0;
  /** Configurable loss values to return from train() */
  lossSequence: number[] = [0.5, 0.4, 0.3, 0.2, 0.1];
  /** Configurable accuracy values to return from train() */
  accuracySequence: number[] = [0.5, 0.6, 0.7, 0.8, 0.9];
  /** Configurable validation loss values to return from evaluate() */
  valLossSequence: number[] = [0.6, 0.5, 0.4, 0.3, 0.2];
  /** Configurable validation accuracy values to return from evaluate() */
  valAccuracySequence: number[] = [0.4, 0.5, 0.6, 0.7, 0.8];
  /** Current index in loss/accuracy sequence */
  private lossIndex = 0;

  // Vitest spies for assertion
  readonly initialize = vi.fn(async (config: Hyperparameters): Promise<void> => {
    this.initializeCalled = true;
    this.lastConfig = config;
  });

  readonly train = vi.fn(async (_data: Point[]): Promise<TrainResult> => {
    this.trainCallCount++;
    const loss = this.lossSequence[this.lossIndex] ?? 0.01;
    const accuracy = this.accuracySequence[this.lossIndex] ?? 0.99;
    this.lossIndex = Math.min(this.lossIndex + 1, this.lossSequence.length - 1);
    return { loss, accuracy };
  });

  readonly predict = vi.fn(async (grid: Point[]): Promise<Prediction[]> => {
    this.predictCallCount++;
    // Return mock predictions with confidence based on position
    return grid.map((point) => ({
      x: point.x,
      y: point.y,
      confidence: 0.5 + point.x * 0.25, // Deterministic confidence
      predictedClass: point.x > 0 ? 1 : 0,
    }));
  });

  readonly evaluate = vi.fn(async (_data: Point[]): Promise<TrainResult> => {
    this.evaluateCallCount++;
    const loss = this.valLossSequence[this.lossIndex] ?? 0.02;
    const accuracy = this.valAccuracySequence[this.lossIndex] ?? 0.98;
    return { loss, accuracy };
  });

  readonly exportModel = vi.fn(async (): Promise<{ modelJson: Blob; weightsBlob: Blob }> => {
    return {
      modelJson: new Blob(['{}'], { type: 'application/json' }),
      weightsBlob: new Blob([new ArrayBuffer(0)], { type: 'application/octet-stream' }),
    };
  });

  readonly getWeights = vi.fn((): number[] => {
    return [0.1, 0.2, 0.3, 0.4];
  });

  readonly loadModel = vi.fn(async (_modelJson: File, _weightsBlob: File): Promise<void> => {
    // No-op for mock
  });

  /**
   * Reset all state and spies for clean test isolation.
   */
  reset(): void {
    this.initializeCalled = false;
    this.lastConfig = null;
    this.trainCallCount = 0;
    this.predictCallCount = 0;
    this.evaluateCallCount = 0;
    this.lossIndex = 0;
    this.initialize.mockClear();
    this.train.mockClear();
    this.predict.mockClear();
    this.evaluate.mockClear();
  }

  /**
   * Configure the sequence of loss values to return from train().
   */
  setLossSequence(losses: number[]): void {
    this.lossSequence = losses;
    this.lossIndex = 0;
  }
}

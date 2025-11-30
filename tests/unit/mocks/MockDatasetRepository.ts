import { vi } from 'vitest';
import type { IDatasetRepository } from '../../../src/core/ports';
import type { Point } from '../../../src/core/domain';

/**
 * Mock implementation of IDatasetRepository for unit testing.
 * Returns configurable datasets without any async delay.
 */
export class MockDatasetRepository implements IDatasetRepository {
  /** Tracks number of getDataset() calls */
  getDatasetCallCount = 0;
  /** Last dataset type requested */
  lastRequestedType: string | null = null;
  /** Configurable dataset to return */
  mockDataset: Point[] = [
    { x: 0, y: 0, label: 0 },
    { x: 1, y: 1, label: 1 },
  ];
  /** Whether to simulate an error */
  shouldThrow = false;
  /** Error message to throw */
  errorMessage = 'Dataset not found';

  // Vitest spy for assertion
  readonly getDataset = vi.fn(async (type: string): Promise<Point[]> => {
    this.getDatasetCallCount++;
    this.lastRequestedType = type;

    if (this.shouldThrow) {
      throw new Error(this.errorMessage);
    }

    return [...this.mockDataset];
  });

  /**
   * Reset all state and spies for clean test isolation.
   */
  reset(): void {
    this.getDatasetCallCount = 0;
    this.lastRequestedType = null;
    this.shouldThrow = false;
    this.getDataset.mockClear();
  }

  /**
   * Configure the dataset to return from getDataset().
   */
  setMockDataset(points: Point[]): void {
    this.mockDataset = points;
  }

  /**
   * Configure getDataset() to throw an error.
   */
  setError(message: string): void {
    this.shouldThrow = true;
    this.errorMessage = message;
  }
}

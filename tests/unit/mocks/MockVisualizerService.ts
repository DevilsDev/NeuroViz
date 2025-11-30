import { vi } from 'vitest';
import type { IVisualizerService } from '../../../src/core/ports';
import type { Point, Prediction } from '../../../src/core/domain';

/**
 * Mock implementation of IVisualizerService for unit testing.
 * Tracks render calls without any D3.js dependency.
 */
export class MockVisualizerService implements IVisualizerService {
  /** Tracks number of renderData() calls */
  renderDataCallCount = 0;
  /** Tracks number of renderBoundary() calls */
  renderBoundaryCallCount = 0;
  /** Last points passed to renderData() */
  lastRenderedPoints: Point[] = [];
  /** Last predictions passed to renderBoundary() */
  lastRenderedPredictions: Prediction[] = [];
  /** Last grid size passed to renderBoundary() */
  lastGridSize = 0;

  // Vitest spies for assertion
  readonly renderData = vi.fn((points: Point[]): void => {
    this.renderDataCallCount++;
    this.lastRenderedPoints = [...points];
  });

  readonly renderBoundary = vi.fn((predictions: Prediction[], gridSize: number): void => {
    this.renderBoundaryCallCount++;
    this.lastRenderedPredictions = [...predictions];
    this.lastGridSize = gridSize;
  });

  /**
   * Reset all state and spies for clean test isolation.
   */
  reset(): void {
    this.renderDataCallCount = 0;
    this.renderBoundaryCallCount = 0;
    this.lastRenderedPoints = [];
    this.lastRenderedPredictions = [];
    this.lastGridSize = 0;
    this.renderData.mockClear();
    this.renderBoundary.mockClear();
  }
}

import { vi } from 'vitest';
import type { IVisualizerService, PointAddedCallback } from '../../../src/core/ports';
import type { Point, Prediction, VisualizationConfig } from '../../../src/core/domain';
import { DEFAULT_VISUALIZATION_CONFIG } from '../../../src/core/domain';

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
  /** Current visualization config */
  private config: VisualizationConfig = { ...DEFAULT_VISUALIZATION_CONFIG };

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

  readonly setConfig = vi.fn((config: Partial<VisualizationConfig>): void => {
    this.config = { ...this.config, ...config };
  });

  readonly getConfig = vi.fn((): VisualizationConfig => {
    return { ...this.config };
  });

  readonly dispose = vi.fn((): void => {
    // No-op for mock
  });

  // Draw mode state
  private drawModeEnabled = false;
  private drawModeLabel = 0;

  readonly enableDrawMode = vi.fn((label: number, _callback: PointAddedCallback): void => {
    this.drawModeEnabled = true;
    this.drawModeLabel = label;
  });

  readonly disableDrawMode = vi.fn((): void => {
    this.drawModeEnabled = false;
  });

  readonly isDrawModeEnabled = vi.fn((): boolean => {
    return this.drawModeEnabled;
  });

  /** Get the current draw mode label for testing */
  getDrawModeLabel(): number {
    return this.drawModeLabel;
  }

  /**
   * Reset all state and spies for clean test isolation.
   */
  reset(): void {
    this.renderDataCallCount = 0;
    this.renderBoundaryCallCount = 0;
    this.lastRenderedPoints = [];
    this.lastRenderedPredictions = [];
    this.lastGridSize = 0;
    this.config = { ...DEFAULT_VISUALIZATION_CONFIG };
    this.drawModeEnabled = false;
    this.drawModeLabel = 0;
    this.renderData.mockClear();
    this.renderBoundary.mockClear();
    this.setConfig.mockClear();
    this.getConfig.mockClear();
    this.dispose.mockClear();
    this.enableDrawMode.mockClear();
    this.disableDrawMode.mockClear();
    this.isDrawModeEnabled.mockClear();
  }
}

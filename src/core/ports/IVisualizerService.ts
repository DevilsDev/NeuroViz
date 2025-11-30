import type { Point, Prediction, VisualizationConfig } from '../domain';

/**
 * Port for visualisation operations.
 * Abstracts the rendering library (D3.js, Canvas, WebGL, etc.) from the core domain.
 *
 * @remarks
 * Implementations should handle their own DOM management and cleanup.
 */
export interface IVisualizerService {
  /**
   * Renders data points on the visualisation canvas.
   * Points should be visually distinguished by their label.
   *
   * @param points - Array of labelled points to display
   */
  renderData(points: Point[]): void;

  /**
   * Renders the decision boundary as a heatmap or contour.
   * Predictions are mapped to colours based on confidence.
   *
   * @param predictions - Grid of predictions from the neural network
   * @param gridSize - Number of points per axis (predictions.length should equal gridSize²)
   */
  renderBoundary(predictions: Prediction[], gridSize: number): void;

  /**
   * Updates visualization configuration.
   * Changes take effect on next render.
   *
   * @param config - Partial configuration to merge with current settings
   */
  setConfig(config: Partial<VisualizationConfig>): void;

  /**
   * Returns current visualization configuration.
   */
  getConfig(): VisualizationConfig;

  /**
   * Cleans up resources and removes DOM elements.
   */
  dispose(): void;
}

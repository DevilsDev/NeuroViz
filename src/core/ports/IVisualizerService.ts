import type { Point, Prediction, VisualizationConfig } from '../domain';

/**
 * Callback for when a point is added via click.
 */
export type PointAddedCallback = (point: Point) => void;

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
   * Enables drawing mode where clicks add points.
   *
   * @param label - The class label for new points (0 or 1)
   * @param callback - Called when a point is added
   */
  enableDrawMode(label: number, callback: PointAddedCallback): void;

  /**
   * Disables drawing mode.
   */
  disableDrawMode(): void;

  /**
   * Returns whether drawing mode is currently enabled.
   */
  isDrawModeEnabled(): boolean;

  /**
   * Clears all rendered content (data points and boundary).
   */
  clear(): void;

  /**
   * Highlights misclassified points with visual indicator.
   * @param predictions - Array of predictions corresponding to rendered points
   */
  highlightMisclassified(predictions: Prediction[]): void;

  /**
   * Clears misclassified highlighting.
   */
  clearMisclassifiedHighlight(): void;

  /**
   * Renders confidence circles around data points.
   * Circle radius represents uncertainty (1 - confidence).
   * @param predictions - Array of predictions corresponding to rendered points
   */
  renderConfidenceCircles(predictions: Prediction[]): void;

  /**
   * Removes confidence circles from the chart.
   */
  clearConfidenceCircles(): void;

  /**
   * Exports the chart as PNG with metadata overlay.
   * @param filename - Name of the downloaded file (without extension)
   * @param metadata - Key-value pairs to display on the image
   */
  exportAsPNGWithMetadata(filename: string, metadata: Record<string, string>): void;

  /**
   * Cleans up resources and removes DOM elements.
   */
  dispose(): void;

  /**
   * Enables or disables the Voronoi diagram overlay.
   * @param enabled - Whether to show the Voronoi overlay
   */
  setVoronoiOverlay(enabled: boolean): void;

  /**
   * Sets predictions for data points (used by Voronoi overlay).
   * @param predictions - Predictions for each data point
   */
  setPointPredictions(predictions: Prediction[]): void;
}

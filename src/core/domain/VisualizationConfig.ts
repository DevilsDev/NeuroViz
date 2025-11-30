/**
 * Available colour schemes for decision boundary visualization.
 */
export type ColourScheme = 'default' | 'viridis' | 'plasma' | 'cool' | 'warm';

/**
 * Configuration for visualization appearance.
 */
export interface VisualizationConfig {
  /** Decision boundary opacity (0-1). Default: 0.7 */
  readonly boundaryOpacity: number;

  /** Data point radius in pixels. Default: 5 */
  readonly pointRadius: number;

  /** Colour scheme for decision boundary. Default: 'default' */
  readonly colourScheme: ColourScheme;

  /** Whether zoom/pan is enabled. Default: true */
  readonly zoomEnabled: boolean;

  /** Whether tooltips are shown on hover. Default: true */
  readonly tooltipsEnabled: boolean;
}

/**
 * Default visualization configuration.
 */
export const DEFAULT_VISUALIZATION_CONFIG: VisualizationConfig = {
  boundaryOpacity: 0.7,
  pointRadius: 5,
  colourScheme: 'default',
  zoomEnabled: true,
  tooltipsEnabled: true,
};

/**
 * Colour palette definitions for each scheme.
 * Each palette maps confidence [0, 1] to a colour.
 */
export const COLOUR_PALETTES: Record<ColourScheme, { low: string; high: string }> = {
  default: { low: '#3b82f6', high: '#f97316' }, // Blue to Orange
  viridis: { low: '#440154', high: '#fde725' }, // Purple to Yellow
  plasma: { low: '#0d0887', high: '#f0f921' }, // Dark Blue to Yellow
  cool: { low: '#6366f1', high: '#06b6d4' }, // Indigo to Cyan
  warm: { low: '#dc2626', high: '#facc15' }, // Red to Yellow
};

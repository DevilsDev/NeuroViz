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

  /** Number of contour lines for binary classification. Default: 10 */
  readonly contourCount: number;
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
  contourCount: 10,
};

/**
 * Colour palette definitions for each scheme.
 * Each palette maps confidence [0, 1] to a colour.
 * Updated to match wireframe design (Cyan/Magenta)
 */
export const COLOUR_PALETTES: Record<ColourScheme, { low: string; high: string }> = {
  default: { low: '#00D9FF', high: '#f97316' }, // Cyan to Orange (wireframe)
  viridis: { low: '#440154', high: '#fde725' }, // Purple to Yellow
  plasma: { low: '#0d0887', high: '#f0f921' }, // Dark Blue to Yellow
  cool: { low: '#00D9FF', high: '#06b6d4' }, // Cyan gradient
  warm: { low: '#FF00AA', high: '#facc15' }, // Magenta to Yellow
};

/**
 * Multi-class colour palette (up to 10 classes).
 * Distinct, colourblind-friendly colours updated for wireframe theme.
 */
export const MULTI_CLASS_COLOURS: readonly string[] = [
  '#00D9FF', // Cyan (class 0) - Primary accent
  '#f97316', // Orange (class 1) - High contrast
  '#10B981', // Green (class 2) - Success
  '#FF00AA', // Magenta (class 3) - Secondary accent
  '#EF4444', // Red (class 4) - Danger
  '#06b6d4', // Teal (class 5)
  '#F59E0B', // Amber (class 6) - Warning
  '#ec4899', // Pink (class 7)
  '#64748b', // Slate (class 8)
  '#8B5CF6', // Purple (class 9)
];

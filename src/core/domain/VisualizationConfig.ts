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
  zoomEnabled: false,
  tooltipsEnabled: true,
  contourCount: 10,
};

/**
 * Colour palette definitions for each scheme.
 * Each palette maps confidence [0, 1] to a colour.
 * Updated to match wireframe design (Cyan/Magenta)
 */
export const COLOUR_PALETTES: Record<ColourScheme, { low: string; high: string }> = {
  // Light tints so data points (MULTI_CLASS_COLOURS) stay readable on top
  default: { low: '#93C5FD', high: '#FDBA74' }, // Blue tint (class 0) to amber tint (class 1)
  viridis: { low: '#440154', high: '#fde725' }, // Purple to Yellow
  plasma: { low: '#0d0887', high: '#f0f921' }, // Dark Blue to Yellow
  cool: { low: '#00D9FF', high: '#06b6d4' }, // Cyan gradient
  warm: { low: '#FF00AA', high: '#facc15' }, // Magenta to Yellow
};

/**
 * Multi-class colour palette (up to 10 classes).
 * Classes 0 and 1 (the binary case) differ in lightness as well as hue, so
 * they stay distinguishable with colour-vision deficiencies.
 */
export const MULTI_CLASS_COLOURS: readonly string[] = [
  '#1E40AF', // Blue (class 0) — dark
  '#F08A24', // Amber (class 1) — light
  '#0F766E', // Teal (class 2)
  '#9333EA', // Purple (class 3)
  '#BE123C', // Rose (class 4)
  '#65A30D', // Lime (class 5)
  '#0891B2', // Cyan (class 6)
  '#DB2777', // Pink (class 7)
  '#57534E', // Stone (class 8)
  '#CA8A04', // Yellow (class 9)
];

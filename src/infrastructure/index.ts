/**
 * Infrastructure adapters barrel export.
 * Each adapter implements a port from src/core/ports.
 *
 * Rendering Strategy:
 * - D3.js (SVG): Primary 2D rendering — decision boundaries, data points, charts,
 *   network diagrams, confusion matrices. Used for all standard visualizations.
 * - Three.js (WebGL): Optional 3D decision boundary view, toggled via UI checkbox.
 *   Lazy-loaded by VisualizationController only when the user enables it.
 *
 * The experimental WebGLRenderer (GPU-accelerated 2D) was moved to src/experimental/
 * as it duplicates D3's role and was never integrated.
 */

export { TFNeuralNet } from './tensorflow';
export { D3Chart } from './d3';
export { MockDataRepository } from './api';

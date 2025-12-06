import './style.css';
import { ApplicationBuilder } from './core/application/ApplicationBuilder';

/**
 * Main entry point for the NeuroViz application
 *
 * This file has been refactored to use the ApplicationBuilder pattern,
 * which improves:
 * - Testability: Can create test configurations easily
 * - Maintainability: Clear separation of concerns
 * - Extensibility: Easy to swap implementations
 * - Clarity: Reduced complexity from 324 lines to ~20 lines
 */

// Build and initialize the application
const app = new ApplicationBuilder({
  vizContainerId: 'viz-container',
  lossChartContainerId: 'loss-chart-container',
  networkDiagramId: 'network-diagram',
  confusionMatrixContainerId: 'confusion-matrix-container',
  weightHistogramId: 'weight-histogram',
}).build();

// Initialize the application (sets up event listeners and state synchronization)
app.initialize();

// Expose app globally for debugging and E2E testing
declare global {
  interface Window {
    app: typeof app;
  }
}

window.app = app;

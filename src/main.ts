import './style.css';
import { ApplicationBuilder } from './core/application/ApplicationBuilder';
import { clearElementCache } from './utils/UIFactory';
import { logger } from './infrastructure/logging/Logger';

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

// Clear any cached DOM elements from previous loads
clearElementCache();

logger.info('Starting application initialization', { component: 'NeuroViz' });

// Build and initialize the application
const app = new ApplicationBuilder({
  vizContainerId: 'viz-container',
  lossChartContainerId: 'loss-chart-container',
  networkDiagramId: 'network-diagram',
  confusionMatrixContainerId: 'confusion-matrix-container',
  weightHistogramId: 'weight-histogram',
}).build();

logger.info('Application built successfully', { component: 'NeuroViz' });

// Initialize the application (sets up event listeners and state synchronization)
app.initialize();

logger.info('Application initialized and ready', { component: 'NeuroViz' });

// Expose app globally for debugging and E2E testing
declare global {
  interface Window {
    app: typeof app;
  }
}

window.app = app;

// ===== HOT MODULE REPLACEMENT (HMR) =====
// Properly dispose application resources during HMR to prevent memory leaks
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.warn('[HMR] Disposing application resources...');
    app.dispose();
  });
}

/**
 * Application Configuration
 *
 * Central location for all configuration values.
 * Prevents hardcoded magic numbers and allows easy environment-based configuration.
 */

export const APP_CONFIG = {
  /**
   * Visualization configuration
   */
  visualization: {
    width: 500,
    height: 500,
    gridSize: 50,
    renderInterval: 10, // Render decision boundary every N epochs
  },

  /**
   * API configuration
   */
  api: {
    // Simulated network latency in development, 0 in production
    latencyMs: import.meta.env.DEV ? 500 : 0,
  },

  /**
   * Input validation limits
   */
  validation: {
    maxLayers: 10,
    maxLayerSize: 1024,
    minLearningRate: 0.0001,
    maxLearningRate: 1.0,
  },

  /**
   * UI configuration
   */
  ui: {
    toastDuration: 5000, // Toast notification display duration in ms
    toastAnimationDuration: 300, // Toast fade in/out animation duration
  },

  /**
   * Build configuration
   */
  build: {
    basePath: import.meta.env.VITE_BASE_PATH || '/',
  },
} as const;

/**
 * Environment-specific checks
 */
export const ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isCI: import.meta.env.VITE_CI === 'true',
} as const;

/**
 * UIFactory - Centralized DOM element queries for controller initialization
 *
 * This factory provides type-safe access to DOM elements required by various controllers.
 * It uses safe element access utilities to handle missing elements gracefully.
 * 
 * Performance Optimization: Elements are cached on first access to avoid duplicate
 * getElementById calls across different getters (Training, Export, Session, etc.).
 */

import type {
  DatasetElements,
  TrainingElements,
  VisualizationElements,
  ExportElements,
  SessionElements,
} from '../presentation/controllers';

// ===== DOM ELEMENT CACHE =====
// Caches elements to avoid duplicate getElementById calls across getters
const elementCache = new Map<string, HTMLElement | null>();

/**
 * Get a cached DOM element by ID. Returns null if element doesn't exist.
 * Elements are cached on first access for performance.
 */
function getCached<T extends HTMLElement>(id: string): T | null {
  if (!elementCache.has(id)) {
    elementCache.set(id, document.getElementById(id));
  }
  return elementCache.get(id) as T | null;
}

/**
 * Get a cached DOM element by ID, with a fallback element if not found.
 */
function getCachedOrCreate<T extends HTMLElement>(id: string, tagName: keyof HTMLElementTagNameMap): T {
  const element = getCached<T>(id);
  return element || (document.createElement(tagName) as unknown as T);
}

/**
 * Clear the element cache. Call this when DOM structure changes significantly
 * (e.g., during hot module replacement or after major DOM updates).
 */
export function clearElementCache(): void {
  elementCache.clear();
}


/**
 * Get all DOM elements required by the DatasetController
 */
/**
 * Get all DOM elements required by the DatasetController
 */
export function getDatasetElements(): DatasetElements {
  return {
    datasetSelect: getCachedOrCreate<HTMLSelectElement>('dataset-select', 'select'),
    btnLoadData: getCachedOrCreate<HTMLButtonElement>('btn-load-data', 'button'),
    loadingOverlay: getCachedOrCreate<HTMLDivElement>('loading-overlay', 'div'),
    drawControls: getCachedOrCreate<HTMLDivElement>('draw-controls', 'div'),
    btnClearCustom: getCachedOrCreate<HTMLButtonElement>('btn-clear-custom', 'button'),
    datasetOptions: getCachedOrCreate<HTMLDivElement>('dataset-options', 'div'),
    inputSamples: getCachedOrCreate<HTMLInputElement>('input-samples', 'input'),
    samplesValue: getCachedOrCreate<HTMLSpanElement>('samples-value', 'span'),
    inputNoise: getCachedOrCreate<HTMLInputElement>('input-noise', 'input'),
    noiseValue: getCachedOrCreate<HTMLSpanElement>('noise-value', 'span'),
    inputBalance: getCachedOrCreate<HTMLInputElement>('input-balance', 'input'),
    balanceValue: getCachedOrCreate<HTMLSpanElement>('balance-value', 'span'),
    inputPreprocessing: getCachedOrCreate<HTMLSelectElement>('input-preprocessing', 'select'),
    inputNumClasses: getCachedOrCreate<HTMLSelectElement>('input-num-classes', 'select'),
    drawClassButtons: getCachedOrCreate<HTMLDivElement>('draw-class-buttons', 'div'),
    inputCsvUpload: getCachedOrCreate<HTMLInputElement>('input-csv-upload', 'input'),
    btnDownloadDataset: getCachedOrCreate<HTMLButtonElement>('btn-download-dataset', 'button'),
  };
}

/**
 * Get all DOM elements required by the TrainingController
 * Uses cached lookups for elements also used by other controllers
 */
export function getTrainingElements(): TrainingElements {
  return {
    inputLr: getCachedOrCreate<HTMLInputElement>('input-lr', 'input'),
    inputLayers: getCachedOrCreate<HTMLInputElement>('input-layers', 'input'),
    inputOptimizer: getCachedOrCreate<HTMLSelectElement>('input-optimizer', 'select'),
    inputActivation: getCachedOrCreate<HTMLSelectElement>('input-activation', 'select'),
    inputL1: getCachedOrCreate<HTMLInputElement>('input-l1', 'input'),
    inputL2: getCachedOrCreate<HTMLInputElement>('input-l2', 'input'),
    inputNumClasses: getCachedOrCreate<HTMLSelectElement>('input-num-classes', 'select'),
    inputDropout: getCachedOrCreate<HTMLSelectElement>('input-dropout', 'select'),
    inputBatchNorm: getCachedOrCreate<HTMLInputElement>('input-batch-norm', 'input'),
    inputLossFunction: getCachedOrCreate<HTMLSelectElement>('input-loss-function', 'select'),
    btnInit: getCachedOrCreate<HTMLButtonElement>('btn-init', 'button'),

    inputBatchSize: getCachedOrCreate<HTMLInputElement>('input-batch-size', 'input'),
    inputMaxEpochs: getCachedOrCreate<HTMLInputElement>('input-max-epochs', 'input'),
    inputFps: getCachedOrCreate<HTMLInputElement>('input-fps', 'input'),
    fpsValue: getCachedOrCreate<HTMLSpanElement>('fps-value', 'span'),
    inputLrSchedule: getCachedOrCreate<HTMLSelectElement>('input-lr-schedule', 'select'),
    inputValSplit: getCachedOrCreate<HTMLSelectElement>('input-val-split', 'select'),
    inputTargetFps: getCachedOrCreate<HTMLSelectElement>('input-perf-mode', 'select'),

    btnStart: getCachedOrCreate<HTMLButtonElement>('btn-start', 'button'),
    btnPause: getCachedOrCreate<HTMLButtonElement>('btn-pause', 'button'),
    btnStep: getCachedOrCreate<HTMLButtonElement>('btn-step', 'button'),
    btnReset: getCachedOrCreate<HTMLButtonElement>('btn-reset', 'button'),

    epochValue: getCachedOrCreate<HTMLElement>('status-epoch', 'div'),
    lossValue: getCachedOrCreate<HTMLElement>('status-loss', 'div'),
    accuracyValue: getCachedOrCreate<HTMLElement>('status-accuracy', 'div'),
    valLossValue: getCachedOrCreate<HTMLElement>('status-val-loss', 'span'),
  };
}


/**
 * Get all DOM elements required by the VisualizationController
 */
export function getVisualizationElements(): VisualizationElements {
  return {
    inputVoronoi: getCachedOrCreate<HTMLInputElement>('input-voronoi', 'input'),
    gradientFlowChart: getCachedOrCreate<HTMLDivElement>('gradient-flow-chart', 'div'),
    input3dView: getCachedOrCreate<HTMLInputElement>('input-3d-view', 'input'),
    threeContainer: getCachedOrCreate<HTMLDivElement>('three-container', 'div'),
    inputShowGradients: getCachedOrCreate<HTMLInputElement>('input-show-gradients', 'input'),
    gradientFlowContainer: getCachedOrCreate<HTMLDivElement>('gradient-flow-container', 'div'),
  };
}

/**
 * Get all DOM elements required by the ExportController
 * Uses cached lookups for elements also used by other controllers
 */
export function getExportElements(): ExportElements {
  return {
    btnExportHistorySticky: getCachedOrCreate<HTMLButtonElement>('btn-export-history-sticky', 'button'),
    btnExportModelSticky: getCachedOrCreate<HTMLButtonElement>('btn-export-model-sticky', 'button'),
  };
}


/**
 * Get all DOM elements required by the SessionController
 * Uses cached lookups for elements also used by other controllers
 */
export function getSessionElements(): SessionElements {
  return {
    btnSaveSession: getCachedOrCreate<HTMLButtonElement>('btn-save-session', 'button'),
    btnLoadSession: getCachedOrCreate<HTMLButtonElement>('btn-load-session', 'button'),
    btnShareUrl: getCachedOrCreate<HTMLButtonElement>('btn-share-url', 'button'),
    btnLoadConfig: getCachedOrCreate<HTMLButtonElement>('btn-load-config', 'button'),
    presetSelect: getCachedOrCreate<HTMLSelectElement>('preset-select', 'select'),
    btnApplyPreset: getCachedOrCreate<HTMLButtonElement>('btn-apply-preset', 'button'),
    iconSun: getCachedOrCreate<HTMLElement>('icon-sun', 'div'),
    iconMoon: getCachedOrCreate<HTMLElement>('icon-moon', 'div'),
    btnThemeToggle: getCachedOrCreate<HTMLButtonElement>('btn-theme-toggle', 'button'),
    datasetSelect: getCachedOrCreate<HTMLSelectElement>('dataset-select', 'select'),
    inputSamples: getCachedOrCreate<HTMLInputElement>('input-samples', 'input'),
    samplesValue: getCachedOrCreate<HTMLSpanElement>('samples-value', 'span'),
    inputNoise: getCachedOrCreate<HTMLInputElement>('input-noise', 'input'),
    noiseValue: getCachedOrCreate<HTMLSpanElement>('noise-value', 'span'),
    inputNumClasses: getCachedOrCreate<HTMLSelectElement>('input-num-classes', 'select'),
    inputLr: getCachedOrCreate<HTMLInputElement>('input-lr', 'input'),
    inputLayers: getCachedOrCreate<HTMLInputElement>('input-layers', 'input'),
    inputOptimizer: getCachedOrCreate<HTMLSelectElement>('input-optimizer', 'select'),
    inputActivation: getCachedOrCreate<HTMLSelectElement>('input-activation', 'select'),
    inputL2: getCachedOrCreate<HTMLInputElement>('input-l2', 'input'),
    inputBatchSize: getCachedOrCreate<HTMLInputElement>('input-batch-size', 'input'),
    inputMaxEpochs: getCachedOrCreate<HTMLInputElement>('input-max-epochs', 'input'),
    inputFps: getCachedOrCreate<HTMLInputElement>('input-fps', 'input'),
    fpsValue: getCachedOrCreate<HTMLSpanElement>('fps-value', 'span'),
    inputValSplit: getCachedOrCreate<HTMLSelectElement>('input-val-split', 'select'),
  };
}


// ===== HOT MODULE REPLACEMENT (HMR) =====
// Clear element cache during HMR to prevent stale references to dummy elements
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    clearElementCache();
    console.warn('[HMR] Element cache cleared');
  });
}

/**
 * UIFactory - Centralized DOM element queries for controller initialization
 *
 * This factory provides type-safe access to DOM elements required by various controllers.
 * It uses safe element access utilities to handle missing elements gracefully.
 * 
 * Performance Optimization: Elements are cached on first access to avoid duplicate
 * getElementById calls across different getters (Training, Export, Session, etc.).
 */

import { safeGetElement, getRequiredElement } from './dom';
import type {
  DatasetElements,
  TrainingElements,
  VisualizationElements,
  ExportElements,
  SessionElements,
  ComparisonElements,
  ResearchElements,
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
    btnInit: getCachedOrCreate<HTMLButtonElement>('btn-init', 'button'),
    btnStart: getCachedOrCreate<HTMLButtonElement>('btn-start', 'button'),
    btnStep: getCachedOrCreate<HTMLButtonElement>('btn-step', 'button'),
    btnReset: getCachedOrCreate<HTMLButtonElement>('btn-reset', 'button'),
    // Cached elements (shared with Export/Session)
    inputLayers: getCachedOrCreate<HTMLInputElement>('input-layers', 'input'),
    inputLayerActivations: getCachedOrCreate<HTMLInputElement>('input-layer-activations', 'input'),
    inputLr: getCachedOrCreate<HTMLInputElement>('input-lr', 'input'),
    inputOptimizer: getCachedOrCreate<HTMLSelectElement>('input-optimizer', 'select'),
    inputMomentum: getCachedOrCreate<HTMLInputElement>('input-momentum', 'input'),
    inputActivation: getCachedOrCreate<HTMLSelectElement>('input-activation', 'select'),
    inputL1: getCachedOrCreate<HTMLInputElement>('input-l1', 'input'),
    inputL2: getCachedOrCreate<HTMLInputElement>('input-l2', 'input'),
    inputNumClasses: getCachedOrCreate<HTMLSelectElement>('input-num-classes', 'select'),
    inputDropout: getCachedOrCreate<HTMLSelectElement>('input-dropout', 'select'),
    inputClipNorm: getCachedOrCreate<HTMLSelectElement>('input-clip-norm', 'select'),
    inputBatchNorm: getCachedOrCreate<HTMLInputElement>('input-batch-norm', 'input'),
    inputLossFunction: getCachedOrCreate<HTMLSelectElement>('input-loss-function', 'select'),
    inputBatchSize: getCachedOrCreate<HTMLInputElement>('input-batch-size', 'input'),
    inputMaxEpochs: getCachedOrCreate<HTMLInputElement>('input-max-epochs', 'input'),
    epochValue: getCachedOrCreate<HTMLElement>('status-epoch', 'span'),
    lossValue: getCachedOrCreate<HTMLElement>('status-loss', 'span'),
    accuracyValue: getCachedOrCreate<HTMLElement>('status-accuracy', 'span'),
    valLossValue: getCachedOrCreate<HTMLElement>('status-val-loss', 'span'),
    valAccuracyValue: getCachedOrCreate<HTMLElement>('status-val-accuracy', 'span'),
    stateDisplay: getCachedOrCreate<HTMLElement>('status-state', 'span'),
    suggestionsPanel: getCachedOrCreate<HTMLDivElement>('suggestions-panel', 'div'),
    suggestionsList: getCachedOrCreate<HTMLDivElement>('suggestions-list', 'div'),
    momentumValue: getCachedOrCreate<HTMLSpanElement>('momentum-value', 'span'),
    momentumControl: getCachedOrCreate<HTMLDivElement>('momentum-control', 'div'),
    inputFps: getCachedOrCreate<HTMLInputElement>('input-fps', 'input'),
    fpsValue: getCachedOrCreate<HTMLSpanElement>('fps-value', 'span'),
    inputLrSchedule: getCachedOrCreate<HTMLSelectElement>('input-lr-schedule', 'select'),
    inputWarmup: getCachedOrCreate<HTMLInputElement>('input-warmup', 'input'),
    inputCycleLength: getCachedOrCreate<HTMLInputElement>('input-cycle-length', 'input'),
    inputMinLr: getCachedOrCreate<HTMLInputElement>('input-min-lr', 'input'),
    inputEarlyStop: getCachedOrCreate<HTMLInputElement>('input-early-stop', 'input'),
    cyclicLrControls: getCachedOrCreate<HTMLDivElement>('cyclic-lr-controls', 'div'),
    inputValSplit: getCachedOrCreate<HTMLSelectElement>('input-val-split', 'select'),
    inputTargetFps: getCachedOrCreate<HTMLSelectElement>('input-perf-mode', 'select'),
    fabStart: getCachedOrCreate<HTMLButtonElement>('fab-start', 'button'),
    fabPause: getCachedOrCreate<HTMLButtonElement>('fab-pause', 'button'),
    btnPause: getCachedOrCreate<HTMLButtonElement>('btn-pause', 'button'),

    // Floating Metrics Bar
    floatingMetricsBar: getCachedOrCreate<HTMLDivElement>('floating-metrics-bar', 'div'),
    floatEpoch: getCachedOrCreate<HTMLElement>('float-epoch', 'span'),
    floatLoss: getCachedOrCreate<HTMLElement>('float-loss', 'span'),
    floatAccuracy: getCachedOrCreate<HTMLElement>('float-accuracy', 'span'),
    floatLr: getCachedOrCreate<HTMLElement>('float-lr', 'span'),
    floatLossTrend: getCachedOrCreate<HTMLElement>('float-loss-trend', 'span'),
    floatAccuracyTrend: getCachedOrCreate<HTMLElement>('float-accuracy-trend', 'span'),

    // Visualization panel for training animations
    vizPanel: getCachedOrCreate<HTMLElement>('viz-panel', 'div'),
  };
}


/**
 * Get all DOM elements required by the VisualizationController
 */
export function getVisualizationElements(): VisualizationElements {
  return {
    inputColourScheme: getCachedOrCreate<HTMLSelectElement>('input-colour-scheme', 'select'),
    inputPointSize: getCachedOrCreate<HTMLInputElement>('input-point-size', 'input'),
    inputOpacity: getCachedOrCreate<HTMLInputElement>('input-opacity', 'input'),
    opacityValue: getCachedOrCreate<HTMLSpanElement>('opacity-value', 'span'),
    inputContours: getCachedOrCreate<HTMLInputElement>('input-contours', 'input'),
    contourValue: getCachedOrCreate<HTMLSpanElement>('contour-value', 'span'),
    inputZoom: getCachedOrCreate<HTMLInputElement>('input-zoom', 'input'),
    inputTooltips: getCachedOrCreate<HTMLInputElement>('input-tooltips', 'input'),
    inputHighlightErrors: getCachedOrCreate<HTMLInputElement>('input-highlight-errors', 'input'),
    inputConfidenceCircles: getCachedOrCreate<HTMLInputElement>('input-confidence-circles', 'input'),
    inputNotifications: getCachedOrCreate<HTMLInputElement>('input-notifications', 'input'),
    inputRecordEvolution: getCachedOrCreate<HTMLInputElement>('input-record-evolution', 'input'),
    inputShowGrid: getCachedOrCreate<HTMLInputElement>('input-show-grid', 'input'),
    inputShowDiscretized: getCachedOrCreate<HTMLInputElement>('input-show-discretized', 'input'),
    inputVoronoi: getCachedOrCreate<HTMLInputElement>('input-voronoi', 'input'),
    inputMisclassified: getCachedOrCreate<HTMLInputElement>('input-misclassified', 'input'),
    inputConfidence: getCachedOrCreate<HTMLInputElement>('input-confidence', 'input'),
    gradientFlowChart: getCachedOrCreate<HTMLDivElement>('gradient-flow-chart', 'div'),
    confusionMatrix: getCachedOrCreate<HTMLDivElement>('confusion-matrix', 'div'),
    weightHistogram: getCachedOrCreate<HTMLDivElement>('weight-histogram', 'div'),
    rocCurve: getCachedOrCreate<HTMLDivElement>('roc-curve', 'div'),
    input3dView: getCachedOrCreate<HTMLInputElement>('input-3d-view', 'input'),
    threeContainer: getCachedOrCreate<HTMLDivElement>('three-container', 'div'),
    btn3dReset: getCachedOrCreate<HTMLButtonElement>('btn-3d-reset', 'button'),
    btn3dTop: getCachedOrCreate<HTMLButtonElement>('btn-3d-top', 'button'),
    btn3dSide: getCachedOrCreate<HTMLButtonElement>('btn-3d-side', 'button'),
    inputShowGradients: getCachedOrCreate<HTMLInputElement>('input-show-gradients', 'input'),
    gradientFlowContainer: getCachedOrCreate<HTMLDivElement>('gradient-flow-container', 'div'),
    inputShowActivations: getCachedOrCreate<HTMLInputElement>('input-show-activations', 'input'),
    activationHeatmap: getCachedOrCreate<HTMLDivElement>('activation-heatmap', 'div'),
    activationHint: getCachedOrCreate<HTMLParagraphElement>('activation-hint', 'p'),
  };
}

/**
 * Get all DOM elements required by the ExportController
 * Uses cached lookups for elements also used by other controllers
 */
export function getExportElements(): ExportElements {
  return {
    btnExportJson: getCachedOrCreate<HTMLButtonElement>('btn-export-json', 'button'),
    btnExportCsv: getCachedOrCreate<HTMLButtonElement>('btn-export-csv', 'button'),
    btnExportPng: getCachedOrCreate<HTMLButtonElement>('btn-export-png', 'button'),
    btnExportSvg: getCachedOrCreate<HTMLButtonElement>('btn-export-svg', 'button'),
    btnScreenshot: getCachedOrCreate<HTMLButtonElement>('btn-screenshot', 'button'),
    btnExportModel: getCachedOrCreate<HTMLButtonElement>('btn-export-model', 'button'),
    btnExportPython: getCachedOrCreate<HTMLButtonElement>('btn-export-python', 'button'),
    btnExportOnnx: getCachedOrCreate<HTMLButtonElement>('btn-export-onnx', 'button'),
    inputLoadModel: getCachedOrCreate<HTMLInputElement>('input-load-model', 'input'),
    inputLoadWeights: getCachedOrCreate<HTMLInputElement>('input-load-weights', 'input'),

    // Sticky footer export buttons
    btnExportHistorySticky: getCachedOrCreate<HTMLButtonElement>('btn-export-history-sticky', 'button'),
    btnExportModelSticky: getCachedOrCreate<HTMLButtonElement>('btn-export-model-sticky', 'button'),

    // Cached elements (shared with Training/Session)
    inputLayers: getCachedOrCreate<HTMLInputElement>('input-layers', 'input'),
    inputLayerActivations: getCachedOrCreate<HTMLInputElement>('input-layer-activations', 'input'),
    inputLr: getCachedOrCreate<HTMLInputElement>('input-lr', 'input'),
    inputOptimizer: getCachedOrCreate<HTMLSelectElement>('input-optimizer', 'select'),
    inputMomentum: getCachedOrCreate<HTMLInputElement>('input-momentum', 'input'),
    inputActivation: getCachedOrCreate<HTMLSelectElement>('input-activation', 'select'),
    inputL1: getCachedOrCreate<HTMLInputElement>('input-l1', 'input'),
    inputL2: getCachedOrCreate<HTMLInputElement>('input-l2', 'input'),
    inputNumClasses: getCachedOrCreate<HTMLSelectElement>('input-num-classes', 'select'),
    inputDropout: getCachedOrCreate<HTMLSelectElement>('input-dropout', 'select'),
    inputClipNorm: getCachedOrCreate<HTMLSelectElement>('input-clip-norm', 'select'),
    inputBatchNorm: getCachedOrCreate<HTMLInputElement>('input-batch-norm', 'input'),
    inputLrSchedule: getCachedOrCreate<HTMLSelectElement>('input-lr-schedule', 'select'),
    inputWarmup: getCachedOrCreate<HTMLInputElement>('input-warmup', 'input'),
    inputCycleLength: getCachedOrCreate<HTMLInputElement>('input-cycle-length', 'input'),
    inputMinLr: getCachedOrCreate<HTMLInputElement>('input-min-lr', 'input'),
    inputSamples: getCachedOrCreate<HTMLInputElement>('input-samples', 'input'),
    inputNoise: getCachedOrCreate<HTMLInputElement>('input-noise', 'input'),
    datasetSelect: getCachedOrCreate<HTMLSelectElement>('dataset-select', 'select'),
    inputBatchSize: getCachedOrCreate<HTMLInputElement>('input-batch-size', 'input'),
    inputMaxEpochs: getCachedOrCreate<HTMLInputElement>('input-max-epochs', 'input'),
    inputValSplit: getCachedOrCreate<HTMLSelectElement>('input-val-split', 'select'),
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
    btnClearSession: getCachedOrCreate<HTMLButtonElement>('btn-clear-session', 'button'),
    inputBookmarkName: getCachedOrCreate<HTMLInputElement>('input-bookmark-name', 'input'),
    btnSaveBookmark: getCachedOrCreate<HTMLButtonElement>('btn-save-bookmark', 'button'),
    bookmarkOptions: getCachedOrCreate<HTMLDivElement>('bookmark-options', 'div'),
    btnDeleteBookmark: getCachedOrCreate<HTMLButtonElement>('btn-delete-bookmark', 'button'),
    presetSelect: getCachedOrCreate<HTMLSelectElement>('preset-select', 'select'),
    btnApplyPreset: getCachedOrCreate<HTMLButtonElement>('btn-apply-preset', 'button'),
    iconSun: getCachedOrCreate<HTMLElement>('icon-sun', 'span'),
    iconMoon: getCachedOrCreate<HTMLElement>('icon-moon', 'span'),
    btnThemeToggle: getCachedOrCreate<HTMLButtonElement>('btn-theme-toggle', 'button'),
    // Cached elements (shared with Training/Export)
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
    inputColourScheme: getCachedOrCreate<HTMLSelectElement>('input-colour-scheme', 'select'),
    inputPointSize: getCachedOrCreate<HTMLInputElement>('input-point-size', 'input'),
    inputOpacity: getCachedOrCreate<HTMLInputElement>('input-opacity', 'input'),
    opacityValue: getCachedOrCreate<HTMLSpanElement>('opacity-value', 'span'),
    inputZoom: getCachedOrCreate<HTMLInputElement>('input-zoom', 'input'),
    inputTooltips: getCachedOrCreate<HTMLInputElement>('input-tooltips', 'input'),
    inputBalance: getCachedOrCreate<HTMLInputElement>('input-balance', 'input'),
    balanceValue: getCachedOrCreate<HTMLSpanElement>('balance-value', 'span'),
    inputMomentum: getCachedOrCreate<HTMLInputElement>('input-momentum', 'input'),
    momentumValue: getCachedOrCreate<HTMLSpanElement>('momentum-value', 'span'),
    inputL1: getCachedOrCreate<HTMLInputElement>('input-l1', 'input'),
    inputDropout: getCachedOrCreate<HTMLSelectElement>('input-dropout', 'select'),
    inputClipNorm: getCachedOrCreate<HTMLSelectElement>('input-clip-norm', 'select'),
    inputBatchNorm: getCachedOrCreate<HTMLInputElement>('input-batch-norm', 'input'),
    inputLrSchedule: getCachedOrCreate<HTMLSelectElement>('input-lr-schedule', 'select'),
    inputWarmup: getCachedOrCreate<HTMLInputElement>('input-warmup', 'input'),
    inputCycleLength: getCachedOrCreate<HTMLInputElement>('input-cycle-length', 'input'),
    inputMinLr: getCachedOrCreate<HTMLInputElement>('input-min-lr', 'input'),
    momentumControl: getCachedOrCreate<HTMLDivElement>('momentum-control', 'div'),
  };
}


/**
 * Get all DOM elements required by the ComparisonController
 */
export function getComparisonElements(): ComparisonElements {
  return {
    comparisonPanel: getCachedOrCreate<HTMLDivElement>('comparison-metrics', 'div'),
    baselineAccuracy: getCachedOrCreate<HTMLSpanElement>('baseline-accuracy', 'span'),
    baselineLoss: getCachedOrCreate<HTMLSpanElement>('baseline-loss', 'span'),
    baselineConfig: getCachedOrCreate<HTMLSpanElement>('baseline-config', 'span'),
    currentAccuracy: getCachedOrCreate<HTMLSpanElement>('current-accuracy', 'span'),
    currentLoss: getCachedOrCreate<HTMLSpanElement>('current-loss', 'span'),
    comparisonDiff: getCachedOrCreate<HTMLSpanElement>('comparison-diff', 'span'),
    btnSaveBaseline: getCachedOrCreate<HTMLButtonElement>('btn-save-baseline', 'button'),
    btnClearBaseline: getCachedOrCreate<HTMLButtonElement>('btn-clear-baseline', 'button'),
    comparisonMetrics: getCachedOrCreate<HTMLDivElement>('comparison-metrics', 'div'),
    baselineMetrics: getCachedOrCreate<HTMLDivElement>('baseline-metrics', 'div'),
    inputLayers: getCachedOrCreate<HTMLInputElement>('input-layers', 'input'),
    inputOptimizer: getCachedOrCreate<HTMLSelectElement>('input-optimizer', 'select'),
    inputLr: getCachedOrCreate<HTMLInputElement>('input-lr', 'input'),
    inputActivation: getCachedOrCreate<HTMLSelectElement>('input-activation', 'select'),
    inputNumClasses: getCachedOrCreate<HTMLSelectElement>('input-num-classes', 'select'),
    inputValSplit: getCachedOrCreate<HTMLInputElement>('input-val-split', 'input'),
    abComparisonPanel: getCachedOrCreate<HTMLDivElement>('ab-comparison-panel', 'div'),
    abEpochA: getCachedOrCreate<HTMLSpanElement>('ab-epoch-a', 'span'),
    abAccuracyA: getCachedOrCreate<HTMLSpanElement>('ab-accuracy-a', 'span'),
    abLossA: getCachedOrCreate<HTMLSpanElement>('ab-loss-a', 'span'),
    abEpochB: getCachedOrCreate<HTMLSpanElement>('ab-epoch-b', 'span'),
    abAccuracyB: getCachedOrCreate<HTMLSpanElement>('ab-accuracy-b', 'span'),
    abLossB: getCachedOrCreate<HTMLSpanElement>('ab-loss-b', 'span'),
    abWinner: getCachedOrCreate<HTMLDivElement>('ab-winner', 'div'),
    abLrA: getCachedOrCreate<HTMLInputElement>('ab-lr-a', 'input'),
    abActivationA: getCachedOrCreate<HTMLSelectElement>('ab-activation-a', 'select'),
    abOptimizerA: getCachedOrCreate<HTMLSelectElement>('ab-optimizer-a', 'select'),
    abLrB: getCachedOrCreate<HTMLInputElement>('ab-lr-b', 'input'),
    abActivationB: getCachedOrCreate<HTMLSelectElement>('ab-activation-b', 'select'),
    abOptimizerB: getCachedOrCreate<HTMLSelectElement>('ab-optimizer-b', 'select'),
    abEpochs: getCachedOrCreate<HTMLInputElement>('ab-epochs', 'input'),
    btnStartAbTest: getCachedOrCreate<HTMLButtonElement>('btn-start-ab', 'button'),
    btnStopAbTest: getCachedOrCreate<HTMLButtonElement>('btn-stop-ab', 'button'),
    ensemblePanel: getCachedOrCreate<HTMLDivElement>('ensemble-panel', 'div'),
    ensembleMemberCount: getCachedOrCreate<HTMLSpanElement>('ensemble-member-count', 'span'),
    ensembleEpoch: getCachedOrCreate<HTMLSpanElement>('ensemble-epoch', 'span'),
    ensembleMembers: getCachedOrCreate<HTMLDivElement>('ensemble-members', 'div'),
    btnAddEnsembleMember: getCachedOrCreate<HTMLButtonElement>('btn-add-ensemble-member', 'button'),
    btnTrainEnsemble: getCachedOrCreate<HTMLButtonElement>('btn-train-ensemble', 'button'),
    btnResetEnsemble: getCachedOrCreate<HTMLButtonElement>('btn-stop-ensemble', 'button'),
  };
}

/**
 * Get all DOM elements required by the ResearchController
 */
export function getResearchElements(): ResearchElements {
  return {
    btnLrFinder: getCachedOrCreate<HTMLButtonElement>('btn-lr-finder', 'button'),
    btnStopLrFinder: getCachedOrCreate<HTMLButtonElement>('btn-stop-lr-finder', 'button'),
    lrFinderContainer: getCachedOrCreate<HTMLDivElement>('lr-finder-container', 'div'),
    lrFinderResult: getCachedOrCreate<HTMLDivElement>('lr-finder-result', 'div'),
    lrFinderPanel: getCachedOrCreate<HTMLDivElement>('lr-finder-panel', 'div'),
    inputLr: getCachedOrCreate<HTMLInputElement>('input-lr', 'input'),
  };
}

// ===== HOT MODULE REPLACEMENT (HMR) =====
// Clear element cache during HMR to prevent stale references to dummy elements
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    clearElementCache();
    console.log('[HMR] Element cache cleared');
  });
}

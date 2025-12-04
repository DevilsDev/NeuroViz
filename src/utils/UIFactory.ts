/**
 * UIFactory - Centralized DOM element queries for controller initialization
 *
 * This factory provides type-safe access to DOM elements required by various controllers.
 * It uses safe element access utilities to handle missing elements gracefully.
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

/**
 * Get all DOM elements required by the DatasetController
 */
export function getDatasetElements(): DatasetElements {
  return {
    datasetSelect: getRequiredElement<HTMLSelectElement>('dataset-select', 'HTMLSelectElement'),
    btnLoadData: getRequiredElement<HTMLButtonElement>('btn-load-data', 'HTMLButtonElement'),
    loadingOverlay: safeGetElement<HTMLDivElement>('loading-overlay') || document.createElement('div'),
    drawControls: safeGetElement<HTMLDivElement>('draw-controls') || document.createElement('div'),
    btnClearCustom: safeGetElement<HTMLButtonElement>('btn-clear-custom') || document.createElement('button'),
    datasetOptions: safeGetElement<HTMLDivElement>('dataset-options') || document.createElement('div'),
    inputSamples: getRequiredElement<HTMLInputElement>('input-samples', 'HTMLInputElement'),
    samplesValue: getRequiredElement<HTMLSpanElement>('samples-value', 'HTMLSpanElement'),
    inputNoise: getRequiredElement<HTMLInputElement>('input-noise', 'HTMLInputElement'),
    noiseValue: getRequiredElement<HTMLSpanElement>('noise-value', 'HTMLSpanElement'),
    inputBalance: safeGetElement<HTMLInputElement>('input-balance') || document.createElement('input'),
    balanceValue: safeGetElement<HTMLSpanElement>('balance-value') || document.createElement('span'),
    inputPreprocessing: safeGetElement<HTMLSelectElement>('input-preprocessing') || document.createElement('select'),
    inputNumClasses: getRequiredElement<HTMLSelectElement>('input-num-classes', 'HTMLSelectElement'),
    drawClassButtons: safeGetElement<HTMLDivElement>('draw-class-buttons') || document.createElement('div'),
    inputCsvUpload: safeGetElement<HTMLInputElement>('input-csv-upload') || document.createElement('input'),
    btnDownloadDataset: safeGetElement<HTMLButtonElement>('btn-download-dataset') || document.createElement('button'),
  };
}

/**
 * Get all DOM elements required by the TrainingController
 */
export function getTrainingElements(): TrainingElements {
  return {
    btnInit: document.getElementById('btn-init') as HTMLButtonElement,
    btnStart: document.getElementById('btn-start') as HTMLButtonElement,
    btnStep: document.getElementById('btn-step') as HTMLButtonElement,
    btnReset: document.getElementById('btn-reset') as HTMLButtonElement,
    inputLayers: document.getElementById('input-layers') as HTMLInputElement,
    inputLayerActivations: document.getElementById('input-layer-activations') as HTMLInputElement,
    inputLr: document.getElementById('input-lr') as HTMLInputElement,
    inputOptimizer: document.getElementById('input-optimizer') as HTMLSelectElement,
    inputMomentum: document.getElementById('input-momentum') as HTMLInputElement,
    inputActivation: document.getElementById('input-activation') as HTMLSelectElement,
    inputL1: document.getElementById('input-l1') as HTMLInputElement,
    inputL2: document.getElementById('input-l2') as HTMLInputElement,
    inputNumClasses: document.getElementById('input-num-classes') as HTMLSelectElement,
    inputDropout: document.getElementById('input-dropout') as HTMLSelectElement,
    inputClipNorm: document.getElementById('input-clip-norm') as HTMLSelectElement,
    inputBatchNorm: document.getElementById('input-batch-norm') as HTMLInputElement,
    inputBatchSize: document.getElementById('input-batch-size') as HTMLInputElement,
    inputMaxEpochs: document.getElementById('input-max-epochs') as HTMLInputElement,
    epochValue: document.getElementById('status-epoch') as HTMLElement,
    lossValue: document.getElementById('status-loss') as HTMLElement,
    accuracyValue: document.getElementById('status-accuracy') as HTMLElement,
    valLossValue: document.getElementById('status-val-loss') as HTMLElement,
    valAccuracyValue: document.getElementById('status-val-accuracy') as HTMLElement,
    stateDisplay: document.getElementById('status-state') as HTMLElement,
    suggestionsPanel: document.getElementById('suggestions-panel') as HTMLDivElement,
    suggestionsList: document.getElementById('suggestions-list') as HTMLDivElement,
    momentumValue: document.getElementById('momentum-value') as HTMLSpanElement,
    momentumControl: document.getElementById('momentum-control') as HTMLDivElement,
    inputFps: document.getElementById('input-fps') as HTMLInputElement,
    fpsValue: document.getElementById('fps-value') as HTMLSpanElement,
    inputLrSchedule: document.getElementById('input-lr-schedule') as HTMLSelectElement,
    inputWarmup: document.getElementById('input-warmup') as HTMLInputElement,
    inputCycleLength: document.getElementById('input-cycle-length') as HTMLInputElement,
    inputMinLr: document.getElementById('input-min-lr') as HTMLInputElement,
    inputEarlyStop: document.getElementById('input-early-stop') as HTMLInputElement,
    cyclicLrControls: document.getElementById('cyclic-lr-controls') as HTMLDivElement,
    inputValSplit: document.getElementById('input-val-split') as HTMLSelectElement,
    inputTargetFps: document.getElementById('input-perf-mode') as HTMLSelectElement,
    btnStartSticky: document.getElementById('btn-start-sticky') as HTMLButtonElement,
    btnPauseSticky: document.getElementById('btn-pause-sticky') as HTMLButtonElement,
    btnStepSticky: document.getElementById('btn-step-sticky') as HTMLButtonElement,
    btnResetSticky: document.getElementById('btn-reset-sticky') as HTMLButtonElement,
    fabStart: document.getElementById('fab-start') as HTMLButtonElement,
    fabPause: document.getElementById('fab-pause') as HTMLButtonElement,
    btnPause: document.getElementById('btn-pause') as HTMLButtonElement,
  };
}

/**
 * Get all DOM elements required by the VisualizationController
 */
export function getVisualizationElements(): VisualizationElements {
  return {
    inputColourScheme: document.getElementById('input-colour-scheme') as HTMLSelectElement,
    inputPointSize: document.getElementById('input-point-size') as HTMLInputElement,
    inputOpacity: document.getElementById('input-opacity') as HTMLInputElement,
    opacityValue: document.getElementById('opacity-value') as HTMLSpanElement,
    inputContours: document.getElementById('input-contours') as HTMLInputElement,
    contourValue: document.getElementById('contour-value') as HTMLSpanElement,
    inputZoom: document.getElementById('input-zoom') as HTMLInputElement,
    inputTooltips: document.getElementById('input-tooltips') as HTMLInputElement,
    inputHighlightErrors: document.getElementById('input-highlight-errors') as HTMLInputElement,
    inputConfidenceCircles: document.getElementById('input-confidence-circles') as HTMLInputElement,
    inputNotifications: document.getElementById('input-notifications') as HTMLInputElement,
    inputRecordEvolution: document.getElementById('input-record-evolution') as HTMLInputElement,
    inputShowGrid: document.getElementById('input-show-grid') as HTMLInputElement,
    inputShowDiscretized: document.getElementById('input-show-discretized') as HTMLInputElement,
    inputVoronoi: document.getElementById('input-voronoi') as HTMLInputElement,
    inputMisclassified: document.getElementById('input-misclassified') as HTMLInputElement,
    inputConfidence: document.getElementById('input-confidence') as HTMLInputElement,
    gradientFlowChart: document.getElementById('gradient-flow-chart') as HTMLDivElement,
    confusionMatrix: document.getElementById('confusion-matrix') as HTMLDivElement,
    weightHistogram: document.getElementById('weight-histogram') as HTMLDivElement,
    rocCurve: document.getElementById('roc-curve') as HTMLDivElement,
    input3dView: document.getElementById('input-3d-view') as HTMLInputElement,
    threeContainer: document.getElementById('three-container') as HTMLDivElement,
    btn3dReset: document.getElementById('btn-3d-reset') as HTMLButtonElement,
    btn3dTop: document.getElementById('btn-3d-top') as HTMLButtonElement,
    btn3dSide: document.getElementById('btn-3d-side') as HTMLButtonElement,
    inputShowGradients: document.getElementById('input-show-gradients') as HTMLInputElement,
    gradientFlowContainer: document.getElementById('gradient-flow-container') as HTMLDivElement,
    inputShowActivations: document.getElementById('input-show-activations') as HTMLInputElement,
    activationHeatmap: document.getElementById('activation-heatmap') as HTMLDivElement,
    activationHint: document.getElementById('activation-hint') as HTMLParagraphElement,
  };
}

/**
 * Get all DOM elements required by the ExportController
 */
export function getExportElements(): ExportElements {
  return {
    btnExportJson: document.getElementById('btn-export-json') as HTMLButtonElement,
    btnExportCsv: document.getElementById('btn-export-csv') as HTMLButtonElement,
    btnExportPng: document.getElementById('btn-export-png') as HTMLButtonElement,
    btnExportSvg: document.getElementById('btn-export-svg') as HTMLButtonElement,
    btnScreenshot: document.getElementById('btn-screenshot') as HTMLButtonElement,
    btnExportModel: document.getElementById('btn-export-model') as HTMLButtonElement,
    btnExportPython: document.getElementById('btn-export-python') as HTMLButtonElement,
    btnExportOnnx: document.getElementById('btn-export-onnx') as HTMLButtonElement,
    inputLoadModel: document.getElementById('input-load-model') as HTMLInputElement,
    inputLoadWeights: document.getElementById('input-load-weights') as HTMLInputElement,
    inputLayers: document.getElementById('input-layers') as HTMLInputElement,
    inputLayerActivations: document.getElementById('input-layer-activations') as HTMLInputElement,
    inputLr: document.getElementById('input-lr') as HTMLInputElement,
    inputOptimizer: document.getElementById('input-optimizer') as HTMLSelectElement,
    inputMomentum: document.getElementById('input-momentum') as HTMLInputElement,
    inputActivation: document.getElementById('input-activation') as HTMLSelectElement,
    inputL1: document.getElementById('input-l1') as HTMLInputElement,
    inputL2: document.getElementById('input-l2') as HTMLInputElement,
    inputNumClasses: document.getElementById('input-num-classes') as HTMLSelectElement,
    inputDropout: document.getElementById('input-dropout') as HTMLSelectElement,
    inputClipNorm: document.getElementById('input-clip-norm') as HTMLSelectElement,
    inputBatchNorm: document.getElementById('input-batch-norm') as HTMLInputElement,
    inputLrSchedule: document.getElementById('input-lr-schedule') as HTMLSelectElement,
    inputWarmup: document.getElementById('input-warmup') as HTMLInputElement,
    inputCycleLength: document.getElementById('input-cycle-length') as HTMLInputElement,
    inputMinLr: document.getElementById('input-min-lr') as HTMLInputElement,
    inputSamples: document.getElementById('input-samples') as HTMLInputElement,
    inputNoise: document.getElementById('input-noise') as HTMLInputElement,
    datasetSelect: document.getElementById('dataset-select') as HTMLSelectElement,
    inputBatchSize: document.getElementById('input-batch-size') as HTMLInputElement,
    inputMaxEpochs: document.getElementById('input-max-epochs') as HTMLInputElement,
    inputValSplit: document.getElementById('input-val-split') as HTMLSelectElement,
  };
}

/**
 * Get all DOM elements required by the SessionController
 */
export function getSessionElements(): SessionElements {
  return {
    btnSaveSession: document.getElementById('btn-save-session') as HTMLButtonElement,
    btnLoadSession: document.getElementById('btn-load-session') as HTMLButtonElement,
    btnShareUrl: document.getElementById('btn-share-url') as HTMLButtonElement,
    btnLoadConfig: document.getElementById('btn-load-config') as HTMLButtonElement,
    btnClearSession: document.getElementById('btn-clear-session') as HTMLButtonElement,
    inputBookmarkName: document.getElementById('input-bookmark-name') as HTMLInputElement,
    btnSaveBookmark: document.getElementById('btn-save-bookmark') as HTMLButtonElement,
    bookmarkOptions: document.getElementById('bookmark-options') as HTMLDivElement,
    btnDeleteBookmark: document.getElementById('btn-delete-bookmark') as HTMLButtonElement,
    presetSelect: document.getElementById('preset-select') as HTMLSelectElement,
    iconSun: document.getElementById('icon-sun') as HTMLElement,
    iconMoon: document.getElementById('icon-moon') as HTMLElement,
    btnThemeToggle: document.getElementById('btn-theme-toggle') as HTMLButtonElement,
    datasetSelect: document.getElementById('dataset-select') as HTMLSelectElement,
    inputSamples: document.getElementById('input-samples') as HTMLInputElement,
    samplesValue: document.getElementById('samples-value') as HTMLSpanElement,
    inputNoise: document.getElementById('input-noise') as HTMLInputElement,
    noiseValue: document.getElementById('noise-value') as HTMLSpanElement,
    inputNumClasses: document.getElementById('input-num-classes') as HTMLSelectElement,
    inputLr: document.getElementById('input-lr') as HTMLInputElement,
    inputLayers: document.getElementById('input-layers') as HTMLInputElement,
    inputOptimizer: document.getElementById('input-optimizer') as HTMLSelectElement,
    inputActivation: document.getElementById('input-activation') as HTMLSelectElement,
    inputL2: document.getElementById('input-l2') as HTMLInputElement,
    inputBatchSize: document.getElementById('input-batch-size') as HTMLInputElement,
    inputMaxEpochs: document.getElementById('input-max-epochs') as HTMLInputElement,
    inputFps: document.getElementById('input-target-fps') as HTMLInputElement,
    fpsValue: document.getElementById('fps-value') as HTMLSpanElement,
    inputValSplit: document.getElementById('input-val-split') as HTMLSelectElement,
    inputColourScheme: document.getElementById('input-colour-scheme') as HTMLSelectElement,
    inputPointSize: document.getElementById('input-point-radius') as HTMLInputElement,
    inputOpacity: document.getElementById('input-boundary-opacity') as HTMLInputElement,
    opacityValue: document.getElementById('boundary-opacity-value') as HTMLSpanElement,
    inputZoom: document.getElementById('input-zoom') as HTMLInputElement,
    inputTooltips: document.getElementById('input-tooltips') as HTMLInputElement,
    inputBalance: document.getElementById('input-balance') as HTMLInputElement,
    balanceValue: document.getElementById('balance-value') as HTMLSpanElement,
    inputMomentum: document.getElementById('input-momentum') as HTMLInputElement,
    momentumValue: document.getElementById('momentum-value') as HTMLSpanElement,
    inputL1: document.getElementById('input-l1') as HTMLInputElement,
    inputDropout: document.getElementById('input-dropout') as HTMLSelectElement,
    inputClipNorm: document.getElementById('input-clip-norm') as HTMLSelectElement,
    inputBatchNorm: document.getElementById('input-batch-norm') as HTMLInputElement,
    inputLrSchedule: document.getElementById('input-lr-schedule') as HTMLSelectElement,
    inputWarmup: document.getElementById('input-warmup') as HTMLInputElement,
    inputCycleLength: document.getElementById('input-cycle-length') as HTMLInputElement,
    inputMinLr: document.getElementById('input-min-lr') as HTMLInputElement,
    momentumControl: document.getElementById('momentum-control') as HTMLDivElement,
  };
}

/**
 * Get all DOM elements required by the ComparisonController
 */
export function getComparisonElements(): ComparisonElements {
  return {
    comparisonPanel: document.getElementById('comparison-metrics') as HTMLDivElement,
    baselineAccuracy: document.getElementById('baseline-accuracy') as HTMLSpanElement,
    baselineLoss: document.getElementById('baseline-loss') as HTMLSpanElement,
    baselineConfig: document.getElementById('baseline-config') as HTMLSpanElement,
    currentAccuracy: document.getElementById('current-accuracy') as HTMLSpanElement,
    currentLoss: document.getElementById('current-loss') as HTMLSpanElement,
    comparisonDiff: document.getElementById('comparison-diff') as HTMLSpanElement,
    btnSaveBaseline: document.getElementById('btn-save-baseline') as HTMLButtonElement,
    btnClearBaseline: document.getElementById('btn-clear-baseline') as HTMLButtonElement,
    comparisonMetrics: document.getElementById('comparison-metrics') as HTMLDivElement,
    baselineMetrics: document.getElementById('baseline-metrics') as HTMLDivElement,
    inputLayers: document.getElementById('input-layers') as HTMLInputElement,
    inputOptimizer: document.getElementById('input-optimizer') as HTMLSelectElement,
    inputLr: document.getElementById('input-lr') as HTMLInputElement,
    inputActivation: document.getElementById('input-activation') as HTMLSelectElement,
    inputNumClasses: document.getElementById('input-num-classes') as HTMLSelectElement,
    inputValSplit: document.getElementById('input-val-split') as HTMLInputElement,
    abComparisonPanel: document.getElementById('ab-comparison-panel') as HTMLDivElement,
    abEpochA: document.getElementById('ab-epoch-a') as HTMLSpanElement,
    abAccuracyA: document.getElementById('ab-accuracy-a') as HTMLSpanElement,
    abLossA: document.getElementById('ab-loss-a') as HTMLSpanElement,
    abEpochB: document.getElementById('ab-epoch-b') as HTMLSpanElement,
    abAccuracyB: document.getElementById('ab-accuracy-b') as HTMLSpanElement,
    abLossB: document.getElementById('ab-loss-b') as HTMLSpanElement,
    abWinner: document.getElementById('ab-winner') as HTMLDivElement,
    abLrA: document.getElementById('ab-lr-a') as HTMLInputElement,
    abActivationA: document.getElementById('ab-activation-a') as HTMLSelectElement,
    abOptimizerA: document.getElementById('ab-optimizer-a') as HTMLSelectElement,
    abLrB: document.getElementById('ab-lr-b') as HTMLInputElement,
    abActivationB: document.getElementById('ab-activation-b') as HTMLSelectElement,
    abOptimizerB: document.getElementById('ab-optimizer-b') as HTMLSelectElement,
    abEpochs: document.getElementById('ab-epochs') as HTMLInputElement,
    btnStartAbTest: document.getElementById('btn-start-ab') as HTMLButtonElement,
    btnStopAbTest: document.getElementById('btn-stop-ab') as HTMLButtonElement,
    ensemblePanel: document.getElementById('ensemble-panel') as HTMLDivElement,
    ensembleMemberCount: document.getElementById('ensemble-member-count') as HTMLSpanElement,
    ensembleEpoch: document.getElementById('ensemble-epoch') as HTMLSpanElement,
    ensembleMembers: document.getElementById('ensemble-members') as HTMLDivElement,
    btnAddEnsembleMember: document.getElementById('btn-add-ensemble-member') as HTMLButtonElement,
    btnTrainEnsemble: document.getElementById('btn-train-ensemble') as HTMLButtonElement,
    btnResetEnsemble: document.getElementById('btn-stop-ensemble') as HTMLButtonElement,
  };
}

/**
 * Get all DOM elements required by the ResearchController
 */
export function getResearchElements(): ResearchElements {
  return {
    btnLrFinder: document.getElementById('btn-lr-finder') as HTMLButtonElement,
    btnStopLrFinder: document.getElementById('btn-stop-lr-finder') as HTMLButtonElement,
    lrFinderContainer: document.getElementById('lr-finder-container') as HTMLDivElement,
    lrFinderResult: document.getElementById('lr-finder-result') as HTMLDivElement,
    lrFinderPanel: document.getElementById('lr-finder-panel') as HTMLDivElement,
    inputLr: document.getElementById('input-lr') as HTMLInputElement,
  };
}
import './style.css';
import { TrainingSession } from './core/application/TrainingSession';
import { TFNeuralNet } from './infrastructure/tensorflow/TFNeuralNet';
import { D3Chart } from './infrastructure/d3/D3Chart';
import { D3LossChart } from './infrastructure/d3/D3LossChart';
import { D3NetworkDiagram } from './infrastructure/d3/D3NetworkDiagram';
import { MockDataRepository } from './infrastructure/api/MockDataRepository';
import { LocalStorageService } from './infrastructure/storage/LocalStorageService';
import { ErrorBoundary } from './infrastructure/errorHandling/ErrorBoundary';
import { WorkerManager } from './workers/WorkerManager';
import { initELI5Tooltips } from './presentation/ELI5Tooltips';
import { dismissSuggestions } from './presentation/SuggestedFixes';
import { DatasetController, DatasetElements } from './presentation/controllers/DatasetController';
import { TrainingController, TrainingElements } from './presentation/controllers/TrainingController';
import { VisualizationController, VisualizationElements } from './presentation/controllers/VisualizationController';
import { ExportController, ExportElements } from './presentation/controllers/ExportController';
import { SessionController, SessionElements } from './presentation/controllers/SessionController';
import { ComparisonController, ComparisonElements } from './presentation/controllers/ComparisonController';
import { ResearchController, ResearchElements } from './presentation/controllers/ResearchController';
import { setupSidebarTabs } from '@presentation/Sidebar';
import { setupTouchGestures } from '@presentation/TouchGestures';
import { setupBottomSheet } from '@presentation/BottomSheet';
import { setupOnboardingWizard } from './presentation/Onboarding';
import { TrainingState } from './core/application/ITrainingSession';
import { ColourScheme } from './core/domain';

// Initialize Error Boundary
const errorBoundary = new ErrorBoundary();
errorBoundary.init();

// Initialize Worker Manager
const _workerManager = new WorkerManager();

// Initialize Services
const dataRepo = new MockDataRepository();
const neuralNet = new TFNeuralNet();
const visualizer = new D3Chart('viz-container');
const lossChart = new D3LossChart('loss-chart-container');
const networkDiagram = new D3NetworkDiagram(document.getElementById('network-diagram') as HTMLElement);
const storage = new LocalStorageService();
const session = new TrainingSession(neuralNet, visualizer, dataRepo);

// Initialize Controllers
const datasetElements: DatasetElements = {
  datasetSelect: document.getElementById('dataset-select') as HTMLSelectElement,
  btnLoadData: document.getElementById('btn-load-data') as HTMLButtonElement,
  loadingOverlay: document.getElementById('loading-overlay') as HTMLDivElement,
  drawControls: document.getElementById('draw-controls') as HTMLDivElement,
  btnClearCustom: document.getElementById('btn-clear-custom') as HTMLButtonElement,
  datasetOptions: document.getElementById('dataset-options') as HTMLDivElement,
  inputSamples: document.getElementById('input-samples') as HTMLInputElement,
  samplesValue: document.getElementById('samples-value') as HTMLSpanElement,
  inputNoise: document.getElementById('input-noise') as HTMLInputElement,
  noiseValue: document.getElementById('noise-value') as HTMLSpanElement,
  inputBalance: document.getElementById('input-balance') as HTMLInputElement,
  balanceValue: document.getElementById('balance-value') as HTMLSpanElement,
  inputPreprocessing: document.getElementById('input-preprocessing') as HTMLSelectElement,
  inputNumClasses: document.getElementById('input-num-classes') as HTMLSelectElement,
  drawClassButtons: document.getElementById('draw-class-buttons') as HTMLDivElement,
  inputCsvUpload: document.getElementById('input-csv-upload') as HTMLInputElement,
  btnDownloadDataset: document.getElementById('btn-download-dataset') as HTMLButtonElement,
};

const datasetController = new DatasetController(session, visualizer, datasetElements);

const trainingElements: TrainingElements = {
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
  // inputLrSchedule, inputWarmup, etc. removed from here as they are in the new block
  inputBatchSize: document.getElementById('input-batch-size') as HTMLInputElement,
  inputMaxEpochs: document.getElementById('input-max-epochs') as HTMLInputElement,
  // inputValSplit, inputTargetFps removed from here
  epochValue: document.getElementById('status-epoch') as HTMLElement,
  lossValue: document.getElementById('status-loss') as HTMLElement,
  accuracyValue: document.getElementById('status-accuracy') as HTMLElement,
  valLossValue: document.getElementById('status-val-loss') as HTMLElement,
  valAccuracyValue: document.getElementById('status-val-accuracy') as HTMLElement,
  suggestionsPanel: document.getElementById('suggestions-panel') as HTMLDivElement,
  suggestionsList: document.getElementById('suggestions-list') as HTMLDivElement,

  // New elements
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

const trainingController = new TrainingController(
  session,
  trainingElements,
  {
    onNetworkUpdate: () => {
      const structure = neuralNet.getStructure();
      if (structure) {
        networkDiagram.render(structure.layers, structure.activations, neuralNet.getWeightMatrices());
      }
    },
    onClearVisualization: () => {
      lossChart.clear();
      networkDiagram.clear();
    },
    onDismissSuggestions: () => dismissSuggestions('suggestions-panel'),
  }
);

const visualizationElements: VisualizationElements = {
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

  // Optional elements
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

const visualizationController = new VisualizationController(
  session,
  neuralNet,
  visualizer,
  visualizationElements
);

const exportElements: ExportElements = {
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

  // Inputs needed for export config generation
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

const _exportController = new ExportController(
  session,
  neuralNet,
  visualizer,
  exportElements,
  {
    onModelLoaded: () => {
      // Refresh UI after loading model
      const structure = neuralNet.getStructure();
      if (structure) {
        networkDiagram.render(structure.layers, structure.activations, neuralNet.getWeightMatrices());
      }
      visualizer.renderData(session.getData());
    }
  }
);

const sessionElements: SessionElements = {
  btnSaveSession: document.getElementById('btn-save-session') as HTMLButtonElement,
  btnLoadSession: document.getElementById('btn-load-session') as HTMLButtonElement,
  btnShareUrl: document.getElementById('btn-share-url') as HTMLButtonElement,
  btnLoadConfig: document.getElementById('btn-load-config') as HTMLButtonElement,
  btnClearSession: document.getElementById('btn-clear-session') as HTMLButtonElement,

  // Bookmarks
  inputBookmarkName: document.getElementById('input-bookmark-name') as HTMLInputElement,
  btnSaveBookmark: document.getElementById('btn-save-bookmark') as HTMLButtonElement,
  bookmarkOptions: document.getElementById('bookmark-options') as HTMLDivElement,
  btnDeleteBookmark: document.getElementById('btn-delete-bookmark') as HTMLButtonElement,
  presetSelect: document.getElementById('preset-select') as HTMLSelectElement,

  // Theme
  iconSun: document.getElementById('icon-sun') as HTMLElement,
  iconMoon: document.getElementById('icon-moon') as HTMLElement,
  btnThemeToggle: document.getElementById('btn-theme-toggle') as HTMLButtonElement,

  // Inputs to save/restore
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

const _sessionController = new SessionController(
  session,
  visualizer,
  storage,
  sessionElements,
  {
    onConfigLoaded: () => {
      // Refresh UI
      // Most inputs are updated directly by SessionController
      // But we might need to trigger some change events or update visualizations
      void datasetController.handleLoadData().catch((error) => {
        console.error('Failed to load data after config loaded:', error);
      });
    },
    onThemeChanged: (theme) => {
      visualizer.setTheme(theme as ColourScheme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
);

const comparisonElements: ComparisonElements = { // Baseline Comparison
  comparisonPanel: document.getElementById('comparison-metrics') as HTMLDivElement, // Reusing metrics div as panel for now, or need to add wrapper
  baselineAccuracy: document.getElementById('baseline-accuracy') as HTMLSpanElement, // Not found in index.html, need to check
  baselineLoss: document.getElementById('baseline-loss') as HTMLSpanElement, // Not found
  baselineConfig: document.getElementById('baseline-config') as HTMLSpanElement, // Not found
  currentAccuracy: document.getElementById('current-accuracy') as HTMLSpanElement, // Not found
  currentLoss: document.getElementById('current-loss') as HTMLSpanElement, // Not found
  comparisonDiff: document.getElementById('comparison-diff') as HTMLSpanElement, // Not found
  btnSaveBaseline: document.getElementById('btn-save-baseline') as HTMLButtonElement, // Not found
  btnClearBaseline: document.getElementById('btn-clear-baseline') as HTMLButtonElement, // Not found
  comparisonMetrics: document.getElementById('comparison-metrics') as HTMLDivElement, // Exists (implied)
  baselineMetrics: document.getElementById('baseline-metrics') as HTMLDivElement, // Exists (implied)

  // Inputs for config summary
  inputLayers: document.getElementById('input-layers') as HTMLInputElement,
  inputOptimizer: document.getElementById('input-optimizer') as HTMLSelectElement,
  inputLr: document.getElementById('input-lr') as HTMLInputElement,
  inputActivation: document.getElementById('input-activation') as HTMLSelectElement,
  inputNumClasses: document.getElementById('input-num-classes') as HTMLSelectElement,
  inputValSplit: document.getElementById('input-val-split') as HTMLInputElement,

  // A/B Testing
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

  btnStartAbTest: document.getElementById('btn-start-ab') as HTMLButtonElement, // Fixed ID
  btnStopAbTest: document.getElementById('btn-stop-ab') as HTMLButtonElement, // Fixed ID

  // Ensemble
  ensemblePanel: document.getElementById('ensemble-panel') as HTMLDivElement,
  ensembleMemberCount: document.getElementById('ensemble-member-count') as HTMLSpanElement,
  ensembleEpoch: document.getElementById('ensemble-epoch') as HTMLSpanElement,
  ensembleMembers: document.getElementById('ensemble-members') as HTMLDivElement,

  btnAddEnsembleMember: document.getElementById('btn-add-ensemble-member') as HTMLButtonElement,
  btnTrainEnsemble: document.getElementById('btn-train-ensemble') as HTMLButtonElement,
  btnResetEnsemble: document.getElementById('btn-stop-ensemble') as HTMLButtonElement, // Mapped to stop for now, or need reset button
};

const comparisonController = new ComparisonController(
  session,
  comparisonElements
);

const researchElements: ResearchElements = {
  btnLrFinder: document.getElementById('btn-lr-finder') as HTMLButtonElement,
  btnStopLrFinder: document.getElementById('btn-stop-lr-finder') as HTMLButtonElement,
  lrFinderContainer: document.getElementById('lr-finder-container') as HTMLDivElement,
  lrFinderResult: document.getElementById('lr-finder-result') as HTMLDivElement,
  lrFinderPanel: document.getElementById('lr-finder-panel') as HTMLDivElement,
  inputLr: document.getElementById('input-lr') as HTMLInputElement,
};

const _researchController = new ResearchController(
  session,
  researchElements
);

// Global Event Listeners
session.onStateChange((state: TrainingState) => {
  trainingController.updateUI(state);
  lossChart.update(state.history);
  comparisonController.updateComparisonDisplay();
  visualizationController.updateGradientFlow();

  // Update network diagram weights occasionally
  if (state.currentEpoch % 5 === 0 && state.isRunning) {
    const structure = neuralNet.getStructure();
    if (structure) {
      networkDiagram.render(structure.layers, structure.activations, neuralNet.getWeightMatrices());
    }
  }
});

// Initialize UI
setupSidebarTabs();
setupTouchGestures();
setupBottomSheet();
setupOnboardingWizard();
initELI5Tooltips();

// Load initial data
window.addEventListener('load', () => {
  // Trigger initial dataset load
  void datasetController.handleLoadData().catch((error) => {
    console.error('Failed to load initial dataset:', error);
  });

  // Show app
  const appContainer = document.querySelector('.app-container');
  if (appContainer) {
    appContainer.classList.add('loaded');
  }
});

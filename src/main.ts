/**
 * Composition Root - Dependency Injection Entry Point
 *
 * This is the ONLY place where infrastructure adapters are instantiated
 * and wired together. No other module should import from both
 * infrastructure/tensorflow and infrastructure/d3.
 */

// Import styles for Vite to process through PostCSS/Tailwind
import './presentation/styles.css';

import type { Hyperparameters, OptimizerType, ActivationType, ColourScheme, Point, LRScheduleType } from './core/domain';
import { MULTI_CLASS_COLOURS } from './core/domain';
import type { TrainingState } from './core/application';
import { TrainingSession } from './core/application';

// Infrastructure adapters - only imported here at the composition root
import { TFNeuralNet } from './infrastructure/tensorflow';
import { D3Chart, D3LossChart, D3ConfusionMatrix, calculateConfusionMatrix, calculateClassMetrics, calculateMacroMetrics } from './infrastructure/d3';
import { MockDataRepository } from './infrastructure/api';

// Configuration
import { APP_CONFIG } from './config/app.config';

// UI utilities
import { toast } from './presentation/toast';

// =============================================================================
// DOM Element References
// =============================================================================

const elements = {
  // Preset controls
  presetSelect: document.getElementById('preset-select') as HTMLSelectElement,
  btnApplyPreset: document.getElementById('btn-apply-preset') as HTMLButtonElement,
  btnSaveBookmark: document.getElementById('btn-save-bookmark') as HTMLButtonElement,
  btnDeleteBookmark: document.getElementById('btn-delete-bookmark') as HTMLButtonElement,
  bookmarkOptions: document.getElementById('bookmark-options') as HTMLOptGroupElement,

  // Dataset controls
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

  // Visualization controls
  inputColourScheme: document.getElementById('input-colour-scheme') as HTMLSelectElement,
  inputPointSize: document.getElementById('input-point-size') as HTMLSelectElement,
  inputOpacity: document.getElementById('input-opacity') as HTMLInputElement,
  opacityValue: document.getElementById('opacity-value') as HTMLSpanElement,
  inputContours: document.getElementById('input-contours') as HTMLInputElement,
  contourValue: document.getElementById('contour-value') as HTMLSpanElement,
  inputZoom: document.getElementById('input-zoom') as HTMLInputElement,
  inputTooltips: document.getElementById('input-tooltips') as HTMLInputElement,
  inputHighlightErrors: document.getElementById('input-highlight-errors') as HTMLInputElement,
  inputConfidenceCircles: document.getElementById('input-confidence-circles') as HTMLInputElement,

  // Hyperparameter inputs
  inputLr: document.getElementById('input-lr') as HTMLInputElement,
  inputLayers: document.getElementById('input-layers') as HTMLInputElement,
  inputLayerActivations: document.getElementById('input-layer-activations') as HTMLInputElement,
  inputOptimizer: document.getElementById('input-optimizer') as HTMLSelectElement,
  inputActivation: document.getElementById('input-activation') as HTMLSelectElement,
  inputNumClasses: document.getElementById('input-num-classes') as HTMLSelectElement,
  inputL2: document.getElementById('input-l2') as HTMLInputElement,
  inputDropout: document.getElementById('input-dropout') as HTMLSelectElement,
  btnInit: document.getElementById('btn-init') as HTMLButtonElement,
  drawClassButtons: document.getElementById('draw-class-buttons') as HTMLDivElement,

  // Training config inputs
  inputBatchSize: document.getElementById('input-batch-size') as HTMLInputElement,
  inputMaxEpochs: document.getElementById('input-max-epochs') as HTMLInputElement,
  inputFps: document.getElementById('input-fps') as HTMLInputElement,
  fpsValue: document.getElementById('fps-value') as HTMLSpanElement,
  inputLrSchedule: document.getElementById('input-lr-schedule') as HTMLSelectElement,
  inputEarlyStop: document.getElementById('input-early-stop') as HTMLInputElement,

  // Training controls
  btnStart: document.getElementById('btn-start') as HTMLButtonElement,
  btnPause: document.getElementById('btn-pause') as HTMLButtonElement,
  btnStep: document.getElementById('btn-step') as HTMLButtonElement,
  btnReset: document.getElementById('btn-reset') as HTMLButtonElement,

  // Status display
  statusEpoch: document.getElementById('status-epoch') as HTMLSpanElement,
  statusLoss: document.getElementById('status-loss') as HTMLSpanElement,
  statusValLoss: document.getElementById('status-val-loss') as HTMLSpanElement,
  statusAccuracy: document.getElementById('status-accuracy') as HTMLSpanElement,
  statusValAccuracy: document.getElementById('status-val-accuracy') as HTMLSpanElement,
  statusState: document.getElementById('status-state') as HTMLSpanElement,

  // Validation split
  inputValSplit: document.getElementById('input-val-split') as HTMLSelectElement,

  // Classification metrics
  metricPrecision: document.getElementById('metric-precision') as HTMLSpanElement,
  metricRecall: document.getElementById('metric-recall') as HTMLSpanElement,
  metricF1: document.getElementById('metric-f1') as HTMLSpanElement,

  // Export buttons
  btnExportJson: document.getElementById('btn-export-json') as HTMLButtonElement,
  btnExportCsv: document.getElementById('btn-export-csv') as HTMLButtonElement,
  btnExportPng: document.getElementById('btn-export-png') as HTMLButtonElement,
  btnExportSvg: document.getElementById('btn-export-svg') as HTMLButtonElement,
  btnExportModel: document.getElementById('btn-export-model') as HTMLButtonElement,

  // Dataset import/export
  inputCsvUpload: document.getElementById('input-csv-upload') as HTMLInputElement,
  btnDownloadDataset: document.getElementById('btn-download-dataset') as HTMLButtonElement,

  // Session management
  btnSaveSession: document.getElementById('btn-save-session') as HTMLButtonElement,
  btnLoadSession: document.getElementById('btn-load-session') as HTMLButtonElement,
  btnClearSession: document.getElementById('btn-clear-session') as HTMLButtonElement,

  // Theme toggle
  btnThemeToggle: document.getElementById('btn-theme-toggle') as HTMLButtonElement,
  iconSun: document.getElementById('icon-sun') as HTMLElement,
  iconMoon: document.getElementById('icon-moon') as HTMLElement,

  // Fullscreen toggle
  btnFullscreen: document.getElementById('btn-fullscreen') as HTMLButtonElement,
  iconExpand: document.getElementById('icon-expand') as HTMLElement,
  iconCompress: document.getElementById('icon-compress') as HTMLElement,
  appContainer: document.querySelector('.app-container') as HTMLDivElement,
};

// =============================================================================
// Dependency Injection - Adapter Instantiation
// =============================================================================

// Adapters are instantiated here and injected into the application layer.
// This enables swapping implementations (e.g., MockDataRepository → AxiosDataRepository)
// without changing any other code.

const visualizerService = new D3Chart(
  'viz-container',
  APP_CONFIG.visualization.width,
  APP_CONFIG.visualization.height
);
const neuralNetService = new TFNeuralNet();
const dataRepository = new MockDataRepository(APP_CONFIG.api.latencyMs);

// Loss chart for training history visualization
const lossChart = new D3LossChart('loss-chart-container', 380, 180);

// Confusion matrix visualization
const confusionMatrix = new D3ConfusionMatrix('confusion-matrix-container');

// Application layer receives adapters via constructor injection
const session = new TrainingSession(neuralNetService, visualizerService, dataRepository, {
  renderInterval: APP_CONFIG.visualization.renderInterval,
  gridSize: APP_CONFIG.visualization.gridSize,
});

// =============================================================================
// UI State Management
// =============================================================================

function updateUI(state: TrainingState): void {
  // Update status display
  elements.statusEpoch.textContent = state.currentEpoch.toString();
  elements.statusLoss.textContent =
    state.currentLoss !== null ? state.currentLoss.toFixed(4) : '—';
  elements.statusValLoss.textContent =
    state.currentValLoss !== null ? state.currentValLoss.toFixed(4) : '—';
  elements.statusAccuracy.textContent =
    state.currentAccuracy !== null ? `${(state.currentAccuracy * 100).toFixed(1)}%` : '—';
  elements.statusValAccuracy.textContent =
    state.currentValAccuracy !== null ? `${(state.currentValAccuracy * 100).toFixed(1)}%` : '—';

  // Update state indicator
  const stateText = getStateText(state);
  elements.statusState.textContent = stateText;
  elements.statusState.className = `status-value ${getStateClass(state)}`;

  // Update button states
  const canTrain = state.isInitialised && state.datasetLoaded;
  const hasHistory = state.history.records.length > 0;

  elements.btnStart.disabled = !canTrain || (state.isRunning && !state.isPaused);
  elements.btnPause.disabled = !state.isRunning || state.isPaused;
  elements.btnStep.disabled = !canTrain || state.isRunning;
  elements.btnReset.disabled = !canTrain;

  // Update export buttons
  elements.btnExportJson.disabled = !hasHistory;
  elements.btnExportCsv.disabled = !hasHistory;
  elements.btnExportPng.disabled = !state.datasetLoaded;
  elements.btnExportSvg.disabled = !state.datasetLoaded;
  elements.btnExportModel.disabled = !state.isInitialised;
  elements.btnDownloadDataset.disabled = !state.datasetLoaded;

  // Update loss chart
  lossChart.update(state.history);

  // Update confusion matrix and metrics periodically
  if (state.currentEpoch > 0 && state.currentEpoch % 10 === 0) {
    void updateClassificationMetrics();
  }
}

function getStateText(state: TrainingState): string {
  if (!state.isInitialised) return 'Not Initialised';
  if (!state.datasetLoaded) return 'No Data';
  if (state.isRunning && !state.isPaused) return 'Training';
  if (state.isPaused) return 'Paused';
  return 'Ready';
}

function getStateClass(state: TrainingState): string {
  if (state.isRunning && !state.isPaused) return 'status-running';
  if (state.isPaused) return 'status-paused';
  return 'status-idle';
}

function showLoading(show: boolean): void {
  elements.loadingOverlay.classList.toggle('hidden', !show);
}

/**
 * Updates the confusion matrix and classification metrics.
 */
async function updateClassificationMetrics(): Promise<void> {
  const state = session.getState();
  if (!state.isInitialised || !state.datasetLoaded) {
    return;
  }

  try {
    // Get current data and predictions
    const data = session.getData();
    if (data.length === 0) return;

    // Get predictions for all data points
    const predictions = await neuralNetService.predict(data);
    
    // Extract predicted and actual classes
    const predictedClasses = predictions.map(p => p.predictedClass);
    const actualClasses = data.map(p => p.label);
    
    // Determine number of classes
    const numClasses = Math.max(...actualClasses, ...predictedClasses) + 1;
    
    // Calculate confusion matrix
    const cmData = calculateConfusionMatrix(predictedClasses, actualClasses, numClasses);
    
    // Render confusion matrix
    confusionMatrix.render(cmData);
    
    // Calculate and display metrics
    const classMetrics = calculateClassMetrics(cmData.matrix);
    const macroMetrics = calculateMacroMetrics(classMetrics);
    
    elements.metricPrecision.textContent = `${(macroMetrics.precision * 100).toFixed(1)}%`;
    elements.metricRecall.textContent = `${(macroMetrics.recall * 100).toFixed(1)}%`;
    elements.metricF1.textContent = `${(macroMetrics.f1 * 100).toFixed(1)}%`;

    // Highlight misclassified points if enabled
    if (elements.inputHighlightErrors.checked) {
      visualizerService.highlightMisclassified(predictions);
    }
  } catch (error) {
    console.error('Failed to update classification metrics:', error);
  }
}

/**
 * Handles the highlight errors toggle.
 */
async function handleHighlightErrorsToggle(): Promise<void> {
  if (elements.inputHighlightErrors.checked) {
    // Get predictions and highlight
    const state = session.getState();
    if (!state.isInitialised || !state.datasetLoaded) return;
    
    const data = session.getData();
    if (data.length === 0) return;
    
    try {
      const predictions = await neuralNetService.predict(data);
      visualizerService.highlightMisclassified(predictions);
    } catch (error) {
      console.error('Failed to highlight misclassified:', error);
    }
  } else {
    visualizerService.clearMisclassifiedHighlight();
  }
}

/**
 * Handles the confidence circles toggle.
 */
async function handleConfidenceCirclesToggle(): Promise<void> {
  if (elements.inputConfidenceCircles.checked) {
    const state = session.getState();
    if (!state.isInitialised || !state.datasetLoaded) return;
    
    const data = session.getData();
    if (data.length === 0) return;
    
    try {
      const predictions = await neuralNetService.predict(data);
      visualizerService.renderConfidenceCircles(predictions);
    } catch (error) {
      console.error('Failed to render confidence circles:', error);
    }
  } else {
    visualizerService.clearConfidenceCircles();
  }
}

/**
 * Handles clicking on a data point to show prediction details.
 */
async function handlePointClick(point: Point): Promise<void> {
  const state = session.getState();
  if (!state.isInitialised) {
    toast.info(`Point: (${point.x.toFixed(3)}, ${point.y.toFixed(3)}) - Class ${point.label}`);
    return;
  }

  try {
    // Get prediction for this single point
    const predictions = await neuralNetService.predict([point]);
    const pred = predictions[0];
    
    if (!pred) {
      toast.info(`Point: (${point.x.toFixed(3)}, ${point.y.toFixed(3)}) - Class ${point.label}`);
      return;
    }

    const isCorrect = pred.predictedClass === point.label;
    const status = isCorrect ? '✓ Correct' : '✗ Wrong';
    const confidence = (pred.confidence * 100).toFixed(1);

    toast.info(
      `${status} | Actual: ${point.label}, Predicted: ${pred.predictedClass} (${confidence}% confidence)`
    );
  } catch (error) {
    console.error('Failed to get prediction:', error);
    toast.info(`Point: (${point.x.toFixed(3)}, ${point.y.toFixed(3)}) - Class ${point.label}`);
  }
}

function parseLayersInput(input: string): number[] {
  const layers = input
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0);

  if (layers.length === 0) {
    throw new Error('At least one valid layer size is required');
  }

  if (layers.length > APP_CONFIG.validation.maxLayers) {
    throw new Error(
      `Maximum ${APP_CONFIG.validation.maxLayers} layers allowed (you entered ${layers.length})`
    );
  }

  const oversizedLayer = layers.find((size) => size > APP_CONFIG.validation.maxLayerSize);
  if (oversizedLayer !== undefined) {
    throw new Error(
      `Layer size cannot exceed ${APP_CONFIG.validation.maxLayerSize} neurons (found ${oversizedLayer})`
    );
  }

  return layers;
}

/**
 * Parses per-layer activation input string.
 * Returns empty array if input is empty or invalid.
 */
function parseLayerActivations(input: string): ActivationType[] {
  if (!input.trim()) return [];
  
  const validActivations: ActivationType[] = ['relu', 'sigmoid', 'tanh', 'elu'];
  
  return input
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ActivationType => validActivations.includes(s as ActivationType));
}

// =============================================================================
// Visualization Handlers
// =============================================================================

function handleColourSchemeChange(): void {
  const scheme = elements.inputColourScheme.value as ColourScheme;
  visualizerService.setConfig({ colourScheme: scheme });
}

function handlePointSizeChange(): void {
  const size = parseInt(elements.inputPointSize.value, 10) || 5;
  visualizerService.setConfig({ pointRadius: size });
}

function handleOpacityChange(): void {
  const opacity = parseInt(elements.inputOpacity.value, 10) / 100;
  elements.opacityValue.textContent = elements.inputOpacity.value;
  visualizerService.setConfig({ boundaryOpacity: opacity });
}

function handleContourChange(): void {
  const count = parseInt(elements.inputContours.value, 10);
  elements.contourValue.textContent = elements.inputContours.value;
  visualizerService.setConfig({ contourCount: count });
}

function handleZoomToggle(): void {
  visualizerService.setConfig({ zoomEnabled: elements.inputZoom.checked });
}

function handleTooltipsToggle(): void {
  visualizerService.setConfig({ tooltipsEnabled: elements.inputTooltips.checked });
}

// =============================================================================
// Custom Dataset / Draw Mode
// =============================================================================

/** Custom dataset points when in draw mode */
let customDataPoints: Point[] = [];
let currentDrawLabel = 0;

function handleDatasetSelectChange(): void {
  const isCustom = elements.datasetSelect.value === 'custom';
  
  if (isCustom) {
    elements.drawControls.classList.remove('hidden');
    elements.datasetOptions.classList.add('hidden');
    elements.btnLoadData.textContent = 'Start Drawing';
  } else {
    elements.drawControls.classList.add('hidden');
    elements.datasetOptions.classList.remove('hidden');
    elements.btnLoadData.innerHTML = `
      <svg aria-hidden="true" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
      Fetch Data
    `;
    visualizerService.disableDrawMode();
  }
}

function handleSamplesChange(): void {
  elements.samplesValue.textContent = elements.inputSamples.value;
}

function handleNoiseChange(): void {
  const noisePercent = parseInt(elements.inputNoise.value, 10);
  elements.noiseValue.textContent = (noisePercent / 100).toFixed(2);
}

function handleBalanceChange(): void {
  const balancePercent = parseInt(elements.inputBalance.value, 10);
  elements.balanceValue.textContent = `${balancePercent}%`;
}

function handleDrawClassSelect(label: number): void {
  currentDrawLabel = label;
  
  // Update button states
  const buttons = elements.drawClassButtons.querySelectorAll('.btn-draw');
  buttons.forEach((btn, index) => {
    btn.classList.toggle('active', index === label);
  });
  
  // Update draw mode with new label
  if (visualizerService.isDrawModeEnabled()) {
    visualizerService.enableDrawMode(label, handlePointAdded);
  }
}

/**
 * Generates draw class buttons based on current numClasses setting.
 */
function updateDrawClassButtons(): void {
  const numClasses = parseInt(elements.inputNumClasses.value, 10) || 2;
  
  // Clear existing buttons
  elements.drawClassButtons.innerHTML = '';
  
  // Create buttons for each class
  for (let i = 0; i < numClasses; i++) {
    const colour = MULTI_CLASS_COLOURS[i % MULTI_CLASS_COLOURS.length];
    const button = document.createElement('button');
    button.className = `btn-draw${i === 0 ? ' active' : ''}`;
    button.dataset.class = String(i);
    button.innerHTML = `
      <span class="w-3 h-3 rounded-full inline-block" style="background-color: ${colour}"></span>
      Class ${i}
    `;
    button.addEventListener('click', () => handleDrawClassSelect(i));
    elements.drawClassButtons.appendChild(button);
  }
  
  // Reset to class 0
  currentDrawLabel = 0;
}

function handlePointAdded(point: Point): void {
  customDataPoints.push(point);
  visualizerService.renderData(customDataPoints);
  
  // Update session with custom data
  session.setCustomData(customDataPoints);
}

function handleClearCustomData(): void {
  customDataPoints = [];
  visualizerService.renderData([]);
  session.setCustomData([]);
  toast.info('Custom data cleared');
}

function enableDrawMode(): void {
  visualizerService.enableDrawMode(currentDrawLabel, handlePointAdded);
  toast.info('Draw mode enabled - click on chart to add points');
}

// =============================================================================
// Event Handlers
// =============================================================================

async function handleLoadData(): Promise<void> {
  const datasetType = elements.datasetSelect.value;

  // Handle custom dataset differently
  if (datasetType === 'custom') {
    customDataPoints = [];
    visualizerService.renderData([]);
    enableDrawMode();
    return;
  }

  showLoading(true);
  elements.btnLoadData.disabled = true;

  // Real-world datasets have fixed parameters
  const isRealWorld = datasetType === 'iris' || datasetType === 'wine';
  
  // Get dataset options from sliders (ignored for real-world datasets)
  const samples = parseInt(elements.inputSamples.value, 10) || 200;
  const noise = (parseInt(elements.inputNoise.value, 10) || 10) / 100;
  const numClasses = parseInt(elements.inputNumClasses.value, 10) || 2;
  const classBalance = (parseInt(elements.inputBalance.value, 10) || 50) / 100;

  try {
    await session.loadData(datasetType, { samples, noise, numClasses, classBalance });
    
    if (isRealWorld) {
      const datasetInfo = datasetType === 'iris' 
        ? 'Iris (150 samples, 3 classes)' 
        : 'Wine (178 samples, 3 classes)';
      toast.success(`${datasetInfo} loaded`);
      // Update numClasses to 3 for real-world datasets
      elements.inputNumClasses.value = '3';
      updateDrawClassButtons();
    } else {
      toast.success(`Dataset "${datasetType}" loaded (${samples} samples, ${numClasses} classes)`);
    }
  } catch (error) {
    console.error('Failed to load dataset:', error);
    toast.error(
      `Failed to load dataset: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    showLoading(false);
    elements.btnLoadData.disabled = false;
  }
}

async function handleInitialise(): Promise<void> {
  const learningRate = parseFloat(elements.inputLr.value);

  if (isNaN(learningRate) || learningRate <= 0) {
    toast.warning('Please enter a valid learning rate (positive number).');
    return;
  }

  let layers: number[];
  try {
    layers = parseLayersInput(elements.inputLayers.value);
  } catch (error) {
    toast.warning(error instanceof Error ? error.message : 'Invalid layer configuration');
    return;
  }

  const optimizer = elements.inputOptimizer.value as OptimizerType;
  const activation = elements.inputActivation.value as ActivationType;
  const l2Regularization = parseFloat(elements.inputL2.value) || 0;
  const numClasses = parseInt(elements.inputNumClasses.value, 10) || 2;
  const dropoutRate = parseFloat(elements.inputDropout.value) || 0;

  // Parse per-layer activations (optional)
  const layerActivations = parseLayerActivations(elements.inputLayerActivations.value);

  const config: Hyperparameters = {
    learningRate,
    layers,
    optimizer,
    activation,
    layerActivations: layerActivations.length > 0 ? layerActivations : undefined,
    l2Regularization,
    numClasses,
    dropoutRate,
  };

  elements.btnInit.disabled = true;
  elements.btnInit.textContent = 'Initialising...';

  try {
    await session.setHyperparameters(config);

    // Apply training config
    applyTrainingConfig();

    toast.success(`Network initialized with ${optimizer.toUpperCase()} optimizer!`);
  } catch (error) {
    console.error('Failed to initialise network:', error);
    toast.error(
      `Failed to initialise network: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    elements.btnInit.disabled = false;
    elements.btnInit.textContent = 'Initialise Network';
  }
}

/**
 * Applies training configuration from UI inputs to the session.
 */
function applyTrainingConfig(): void {
  const batchSize = parseInt(elements.inputBatchSize.value, 10) || 0;
  const maxEpochs = parseInt(elements.inputMaxEpochs.value, 10) || 0;
  const targetFps = parseInt(elements.inputFps.value, 10) || 60;
  const lrScheduleType = elements.inputLrSchedule.value as LRScheduleType;
  const earlyStoppingPatience = parseInt(elements.inputEarlyStop.value, 10) || 0;

  session.setTrainingConfig({
    batchSize,
    maxEpochs,
    targetFps,
    lrSchedule: {
      type: lrScheduleType,
      decayRate: 0.95,
      decaySteps: 10,
    },
    earlyStoppingPatience,
  });
}

/**
 * Handles FPS slider changes.
 */
function handleFpsChange(): void {
  const fps = parseInt(elements.inputFps.value, 10) || 60;
  elements.fpsValue.textContent = fps.toString();
  session.setTrainingConfig({ targetFps: fps });
}

/**
 * Handles batch size changes.
 */
function handleBatchSizeChange(): void {
  const batchSize = parseInt(elements.inputBatchSize.value, 10) || 0;
  session.setTrainingConfig({ batchSize });
}

/**
 * Handles max epochs changes.
 */
function handleMaxEpochsChange(): void {
  const maxEpochs = parseInt(elements.inputMaxEpochs.value, 10) || 0;
  session.setTrainingConfig({ maxEpochs });
}

/**
 * Handles validation split changes.
 */
function handleValSplitChange(): void {
  const validationSplit = parseFloat(elements.inputValSplit.value) || 0;
  session.setTrainingConfig({ validationSplit });
}

function handleStart(): void {
  try {
    session.start();
  } catch (error) {
    console.error('Failed to start training:', error);
    toast.error(`Failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function handlePause(): void {
  session.pause();
}

async function handleStep(): Promise<void> {
  // Guard against rapid clicks while processing
  if (elements.btnStep.disabled) {
    return;
  }

  elements.btnStep.disabled = true;

  try {
    await session.step();
    // Wait a frame for state notification to complete
    await new Promise((resolve) => requestAnimationFrame(resolve));
  } catch (error) {
    console.error('Step failed:', error);
    toast.error(`Step failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Re-enable only if state is valid for stepping
    const state = session.getState();
    elements.btnStep.disabled = !state.isInitialised || !state.datasetLoaded || state.isRunning;
  }
}

function handleReset(): void {
  session.reset();
  lossChart.clear();
}

/**
 * Exports training history and triggers download.
 */
function handleExportJson(): void {
  const data = session.exportHistory('json');
  downloadFile(data, 'training-history.json', 'application/json');
  toast.success('Training history exported as JSON');
}

function handleExportCsv(): void {
  const data = session.exportHistory('csv');
  downloadFile(data, 'training-history.csv', 'text/csv');
  toast.success('Training history exported as CSV');
}

function handleExportPng(): void {
  visualizerService.exportAsPNG('neuroviz-boundary');
  toast.success('Decision boundary exported as PNG');
}

function handleExportSvg(): void {
  visualizerService.exportAsSVG('neuroviz-boundary');
  toast.success('Decision boundary exported as SVG');
}

/**
 * Exports the trained model as TensorFlow.js format (model.json + weights.bin).
 * Downloads as a ZIP file containing both files.
 */
async function handleExportModel(): Promise<void> {
  const state = session.getState();
  if (!state.isInitialised) {
    toast.warning('Please initialise a model first');
    return;
  }

  try {
    const { modelJson, weightsBlob } = await neuralNetService.exportModel();
    
    // Download model.json
    const modelUrl = URL.createObjectURL(modelJson);
    const modelLink = document.createElement('a');
    modelLink.href = modelUrl;
    modelLink.download = 'model.json';
    modelLink.click();
    URL.revokeObjectURL(modelUrl);
    
    // Download weights.bin
    const weightsUrl = URL.createObjectURL(weightsBlob);
    const weightsLink = document.createElement('a');
    weightsLink.href = weightsUrl;
    weightsLink.download = 'weights.bin';
    weightsLink.click();
    URL.revokeObjectURL(weightsUrl);
    
    toast.success('Model exported (model.json + weights.bin)');
  } catch (error) {
    console.error('Failed to export model:', error);
    toast.error('Failed to export model');
  }
}

// =============================================================================
// CSV Upload & Dataset Download
// =============================================================================

/**
 * Handles CSV file upload.
 * Expected format: x,y,label (with optional header row)
 */
function handleCsvUpload(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      const points = parseCsvData(text);
      
      if (points.length === 0) {
        toast.error('No valid data points found in CSV');
        return;
      }

      // Set as custom data
      customDataPoints = points;
      session.setCustomData(points);
      visualizerService.renderData(points);
      
      // Update num classes based on data
      const maxLabel = Math.max(...points.map(p => p.label));
      elements.inputNumClasses.value = String(maxLabel + 1);
      updateDrawClassButtons();

      toast.success(`Loaded ${points.length} points from CSV`);
    } catch (error) {
      console.error('Failed to parse CSV:', error);
      toast.error('Failed to parse CSV file');
    }
  };
  reader.readAsText(file);
  
  // Reset input so same file can be uploaded again
  input.value = '';
}

/**
 * Parses CSV text into Point array.
 * Supports formats: x,y,label or label,x,y
 */
function parseCsvData(text: string): Point[] {
  const lines = text.trim().split('\n');
  const points: Point[] = [];
  
  // Skip header if present
  const startIndex = lines[0]?.match(/^[a-zA-Z]/) ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 3) continue;
    
    // Try x,y,label format first
    let x = parseFloat(parts[0] ?? '');
    let y = parseFloat(parts[1] ?? '');
    let label = parseInt(parts[2] ?? '', 10);
    
    // If label is NaN, try label,x,y format
    if (isNaN(label)) {
      label = parseInt(parts[0] ?? '', 10);
      x = parseFloat(parts[1] ?? '');
      y = parseFloat(parts[2] ?? '');
    }
    
    if (!isNaN(x) && !isNaN(y) && !isNaN(label)) {
      points.push({ x, y, label });
    }
  }
  
  return points;
}

/**
 * Downloads the current dataset as CSV.
 */
function handleDownloadDataset(): void {
  const data = session.getData();
  if (data.length === 0) {
    toast.warning('No data to download');
    return;
  }

  const header = 'x,y,label\n';
  const rows = data.map(p => `${p.x},${p.y},${p.label}`).join('\n');
  const csv = header + rows;
  
  downloadFile(csv, 'neuroviz-dataset.csv', 'text/csv');
  toast.success(`Downloaded ${data.length} data points`);
}

// =============================================================================
// Theme Toggle
// =============================================================================

const THEME_KEY = 'neuroviz-theme';

/**
 * Gets the current theme from localStorage or system preference.
 */
function getStoredTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  // Fall back to system preference
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * Applies the specified theme to the document.
 * Uses Tailwind's dark mode class on html element.
 */
function applyTheme(theme: 'light' | 'dark'): void {
  const html = document.documentElement;
  
  if (theme === 'dark') {
    html.classList.add('dark');
    document.body.removeAttribute('data-theme');
    elements.iconSun.classList.remove('hidden');
    elements.iconMoon.classList.add('hidden');
  } else {
    html.classList.remove('dark');
    document.body.setAttribute('data-theme', 'light');
    elements.iconSun.classList.add('hidden');
    elements.iconMoon.classList.remove('hidden');
  }
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * Toggles between light and dark themes.
 */
function handleThemeToggle(): void {
  const isDark = document.documentElement.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  toast.info(`Switched to ${newTheme} theme`);
}

// =============================================================================
// Session Persistence
// =============================================================================

const SESSION_KEY = 'neuroviz-session';
const BOOKMARKS_KEY = 'neuroviz-bookmarks';

interface BookmarkConfig {
  id: string;
  name: string;
  createdAt: number;
  config: {
    datasetType: string;
    samples: number;
    noise: number;
    numClasses: number;
    classBalance: number;
    learningRate: number;
    layers: string;
    optimizer: string;
    activation: string;
    l2Regularization: number;
    batchSize: number;
    maxEpochs: number;
    targetFps: number;
    validationSplit: number;
  };
}

interface SessionData {
  version: number;
  timestamp: number;
  config: {
    datasetType: string;
    samples: number;
    noise: number;
    numClasses: number;
    learningRate: number;
    layers: string;
    optimizer: string;
    activation: string;
    l2Regularization: number;
    batchSize: number;
    maxEpochs: number;
    targetFps: number;
    validationSplit: number;
    colourScheme: string;
    pointSize: string;
    opacity: number;
    zoomEnabled: boolean;
    tooltipsEnabled: boolean;
  };
  data: Point[];
  history: {
    records: Array<{
      epoch: number;
      loss: number;
      accuracy: number;
      valLoss: number | null;
      valAccuracy: number | null;
      timestamp: number;
    }>;
  };
}

/**
 * Collects current UI configuration values.
 */
function collectSessionConfig(): SessionData['config'] {
  return {
    datasetType: elements.datasetSelect.value,
    samples: parseInt(elements.inputSamples.value, 10) || 200,
    noise: parseInt(elements.inputNoise.value, 10) || 10,
    numClasses: parseInt(elements.inputNumClasses.value, 10) || 2,
    learningRate: parseFloat(elements.inputLr.value) || 0.03,
    layers: elements.inputLayers.value,
    optimizer: elements.inputOptimizer.value,
    activation: elements.inputActivation.value,
    l2Regularization: parseFloat(elements.inputL2.value) || 0,
    batchSize: parseInt(elements.inputBatchSize.value, 10) || 32,
    maxEpochs: parseInt(elements.inputMaxEpochs.value, 10) || 0,
    targetFps: parseInt(elements.inputFps.value, 10) || 30,
    validationSplit: parseFloat(elements.inputValSplit.value) || 0.2,
    colourScheme: elements.inputColourScheme.value,
    pointSize: elements.inputPointSize.value,
    opacity: parseInt(elements.inputOpacity.value, 10) || 70,
    zoomEnabled: elements.inputZoom.checked,
    tooltipsEnabled: elements.inputTooltips.checked,
  };
}

/**
 * Applies saved configuration to UI elements.
 */
function applySessionConfig(config: SessionData['config']): void {
  elements.datasetSelect.value = config.datasetType;
  elements.inputSamples.value = String(config.samples);
  elements.samplesValue.textContent = String(config.samples);
  elements.inputNoise.value = String(config.noise);
  elements.noiseValue.textContent = String(config.noise);
  elements.inputNumClasses.value = String(config.numClasses);
  elements.inputLr.value = String(config.learningRate);
  elements.inputLayers.value = config.layers;
  elements.inputOptimizer.value = config.optimizer;
  elements.inputActivation.value = config.activation;
  elements.inputL2.value = String(config.l2Regularization);
  elements.inputBatchSize.value = String(config.batchSize);
  elements.inputMaxEpochs.value = String(config.maxEpochs);
  elements.inputFps.value = String(config.targetFps);
  elements.fpsValue.textContent = String(config.targetFps);
  elements.inputValSplit.value = String(config.validationSplit);
  elements.inputColourScheme.value = config.colourScheme;
  elements.inputPointSize.value = config.pointSize;
  elements.inputOpacity.value = String(config.opacity);
  elements.opacityValue.textContent = String(config.opacity);
  elements.inputZoom.checked = config.zoomEnabled;
  elements.inputTooltips.checked = config.tooltipsEnabled;

  // Update class buttons for multi-class
  updateDrawClassButtons();
}

/**
 * Saves the current session to localStorage.
 */
function saveSession(): void {
  const state = session.getState();
  const data = session.getData();
  
  const sessionData: SessionData = {
    version: 1,
    timestamp: Date.now(),
    config: collectSessionConfig(),
    data,
    history: {
      records: state.history.records.map(r => ({
        epoch: r.epoch,
        loss: r.loss,
        accuracy: r.accuracy,
        valLoss: r.valLoss,
        valAccuracy: r.valAccuracy,
        timestamp: r.timestamp,
      })),
    },
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    toast.success('Session saved');
  } catch (error) {
    console.error('Failed to save session:', error);
    toast.error('Failed to save session (storage full?)');
  }
}

/**
 * Loads a saved session from localStorage.
 */
async function loadSession(): Promise<boolean> {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) {
    return false;
  }

  try {
    const sessionData: SessionData = JSON.parse(stored);
    
    // Version check for future compatibility
    if (sessionData.version !== 1) {
      console.warn('Session version mismatch, skipping restore');
      return false;
    }

    // Apply UI configuration
    applySessionConfig(sessionData.config);

    // Restore dataset if available
    if (sessionData.data && sessionData.data.length > 0) {
      session.setCustomData(sessionData.data);
      visualizerService.renderData(sessionData.data);
      
      // Apply visualization settings via UI handlers
      handleColourSchemeChange();
      handlePointSizeChange();
      handleOpacityChange();
      handleZoomToggle();
      handleTooltipsToggle();
    }

    const age = Date.now() - sessionData.timestamp;
    const ageMinutes = Math.floor(age / 60000);
    const ageText = ageMinutes < 60 
      ? `${ageMinutes} min ago` 
      : `${Math.floor(ageMinutes / 60)} hours ago`;
    
    toast.info(`Session restored (saved ${ageText})`);
    return true;
  } catch (error) {
    console.error('Failed to load session:', error);
    return false;
  }
}

/**
 * Clears the saved session from localStorage and resets the application state.
 */
function clearSession(): void {
  // Clear localStorage
  localStorage.removeItem(SESSION_KEY);

  // Reset training session and clear visualisations
  session.clearAll();
  lossChart.clear();
  confusionMatrix.clear();

  // Clear custom data
  customDataPoints = [];

  // Reset UI inputs to defaults
  elements.datasetSelect.value = 'circle';
  elements.inputSamples.value = '200';
  elements.samplesValue.textContent = '200';
  elements.inputNoise.value = '10';
  elements.noiseValue.textContent = '10';
  elements.inputBalance.value = '50';
  elements.balanceValue.textContent = '50%';
  elements.inputNumClasses.value = '2';
  elements.inputLr.value = '0.03';
  elements.inputLayers.value = '4,4';
  elements.inputLayerActivations.value = '';
  elements.inputOptimizer.value = 'adam';
  elements.inputActivation.value = 'relu';
  elements.inputL2.value = '0';
  elements.inputDropout.value = '0';
  elements.inputBatchSize.value = '32';
  elements.inputMaxEpochs.value = '500';
  elements.inputValSplit.value = '20';
  elements.inputFps.value = '30';
  elements.fpsValue.textContent = '30';

  // Reset metrics display
  elements.metricPrecision.textContent = '-';
  elements.metricRecall.textContent = '-';
  elements.metricF1.textContent = '-';

  // Reset visualization checkboxes
  elements.inputHighlightErrors.checked = false;
  elements.inputConfidenceCircles.checked = false;

  // Update draw class buttons
  updateDrawClassButtons();

  toast.info('Session cleared - all settings reset to defaults');
}

// =============================================================================
// Bookmark Management
// =============================================================================

/**
 * Loads bookmarks from localStorage.
 */
function loadBookmarks(): BookmarkConfig[] {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as BookmarkConfig[];
  } catch {
    return [];
  }
}

/**
 * Saves bookmarks to localStorage.
 */
function saveBookmarks(bookmarks: BookmarkConfig[]): void {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

/**
 * Renders bookmark options in the dropdown.
 */
function renderBookmarkOptions(): void {
  const bookmarks = loadBookmarks();
  elements.bookmarkOptions.innerHTML = '';
  
  if (bookmarks.length === 0) {
    const placeholder = document.createElement('option');
    placeholder.disabled = true;
    placeholder.textContent = '(No saved bookmarks)';
    elements.bookmarkOptions.appendChild(placeholder);
    return;
  }
  
  for (const bookmark of bookmarks) {
    const option = document.createElement('option');
    option.value = `bookmark:${bookmark.id}`;
    option.textContent = `📌 ${bookmark.name}`;
    elements.bookmarkOptions.appendChild(option);
  }
}

/**
 * Collects current configuration for bookmark.
 */
function collectBookmarkConfig(): BookmarkConfig['config'] {
  return {
    datasetType: elements.datasetSelect.value,
    samples: parseInt(elements.inputSamples.value, 10) || 200,
    noise: parseInt(elements.inputNoise.value, 10) || 10,
    numClasses: parseInt(elements.inputNumClasses.value, 10) || 2,
    classBalance: parseInt(elements.inputBalance.value, 10) || 50,
    learningRate: parseFloat(elements.inputLr.value) || 0.03,
    layers: elements.inputLayers.value || '4,4',
    optimizer: elements.inputOptimizer.value || 'adam',
    activation: elements.inputActivation.value || 'relu',
    l2Regularization: parseFloat(elements.inputL2.value) || 0,
    batchSize: parseInt(elements.inputBatchSize.value, 10) || 32,
    maxEpochs: parseInt(elements.inputMaxEpochs.value, 10) || 500,
    targetFps: parseInt(elements.inputFps.value, 10) || 30,
    validationSplit: parseInt(elements.inputValSplit.value, 10) || 20,
  };
}

/**
 * Saves current configuration as a bookmark.
 */
function handleSaveBookmark(): void {
  const name = prompt('Enter a name for this bookmark:');
  if (!name || name.trim() === '') {
    return;
  }
  
  const bookmarks = loadBookmarks();
  const newBookmark: BookmarkConfig = {
    id: `bm-${Date.now()}`,
    name: name.trim(),
    createdAt: Date.now(),
    config: collectBookmarkConfig(),
  };
  
  bookmarks.push(newBookmark);
  saveBookmarks(bookmarks);
  renderBookmarkOptions();
  
  toast.success(`Bookmark "${name}" saved`);
}

/**
 * Deletes the currently selected bookmark.
 */
function handleDeleteBookmark(): void {
  const selectedValue = elements.presetSelect.value;
  if (!selectedValue.startsWith('bookmark:')) {
    toast.warning('Please select a bookmark to delete');
    return;
  }
  
  const bookmarkId = selectedValue.replace('bookmark:', '');
  const bookmarks = loadBookmarks();
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  
  if (!bookmark) {
    toast.error('Bookmark not found');
    return;
  }
  
  if (!confirm(`Delete bookmark "${bookmark.name}"?`)) {
    return;
  }
  
  const filtered = bookmarks.filter(b => b.id !== bookmarkId);
  saveBookmarks(filtered);
  renderBookmarkOptions();
  elements.presetSelect.value = '';
  elements.btnDeleteBookmark.disabled = true;
  
  toast.info(`Bookmark "${bookmark.name}" deleted`);
}

/**
 * Applies a bookmark configuration.
 */
function applyBookmarkConfig(bookmark: BookmarkConfig): void {
  const { config } = bookmark;
  
  // Apply dataset settings
  elements.datasetSelect.value = config.datasetType;
  elements.inputSamples.value = String(config.samples);
  elements.samplesValue.textContent = String(config.samples);
  elements.inputNoise.value = String(config.noise);
  elements.noiseValue.textContent = (config.noise / 100).toFixed(2);
  elements.inputNumClasses.value = String(config.numClasses);
  elements.inputBalance.value = String(config.classBalance);
  elements.balanceValue.textContent = `${config.classBalance}%`;
  
  // Apply hyperparameters
  elements.inputLr.value = String(config.learningRate);
  elements.inputLayers.value = config.layers;
  elements.inputOptimizer.value = config.optimizer;
  elements.inputActivation.value = config.activation;
  elements.inputL2.value = String(config.l2Regularization);
  
  // Apply training config
  elements.inputBatchSize.value = String(config.batchSize);
  elements.inputMaxEpochs.value = String(config.maxEpochs);
  elements.inputFps.value = String(config.targetFps);
  elements.fpsValue.textContent = String(config.targetFps);
  elements.inputValSplit.value = String(config.validationSplit);
  
  // Update draw class buttons
  updateDrawClassButtons();
}

/**
 * Auto-saves session periodically and on page unload.
 */
function setupAutoSave(): void {
  // Save on page unload
  window.addEventListener('beforeunload', () => {
    const state = session.getState();
    if (state.datasetLoaded) {
      // Synchronous save for beforeunload
      const data = session.getData();
      const sessionData: SessionData = {
        version: 1,
        timestamp: Date.now(),
        config: collectSessionConfig(),
        data,
        history: {
          records: state.history.records.map(r => ({
            epoch: r.epoch,
            loss: r.loss,
            accuracy: r.accuracy,
            valLoss: r.valLoss,
            valAccuracy: r.valAccuracy,
            timestamp: r.timestamp,
          })),
        },
      };
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      } catch {
        // Ignore errors on unload
      }
    }
  });
}

// =============================================================================
// Preset Configurations
// =============================================================================

interface PresetConfig {
  name: string;
  description: string;
  dataset: string;
  samples: number;
  noise: number;
  numClasses: number;
  layers: string;
  learningRate: number;
  optimizer: string;
  activation: string;
  l2Regularization: number;
  batchSize: number;
  maxEpochs: number;
  targetFps: number;
}

const PRESETS: Record<string, PresetConfig> = {
  'quick-demo': {
    name: 'Quick Demo',
    description: 'Simple circle dataset with a small network for fast training',
    dataset: 'circle',
    samples: 200,
    noise: 10,
    numClasses: 2,
    layers: '4, 2',
    learningRate: 0.03,
    optimizer: 'adam',
    activation: 'relu',
    l2Regularization: 0,
    batchSize: 32,
    maxEpochs: 100,
    targetFps: 30,
  },
  'xor-challenge': {
    name: 'XOR Challenge',
    description: 'Classic XOR problem - requires hidden layers to solve',
    dataset: 'xor',
    samples: 200,
    noise: 5,
    numClasses: 2,
    layers: '8, 4',
    learningRate: 0.05,
    optimizer: 'adam',
    activation: 'relu',
    l2Regularization: 0,
    batchSize: 32,
    maxEpochs: 200,
    targetFps: 30,
  },
  'spiral-deep': {
    name: 'Deep Spiral',
    description: 'Complex 3-arm spiral requiring a deeper network',
    dataset: 'spiral',
    samples: 300,
    noise: 5,
    numClasses: 3,
    layers: '16, 8, 4',
    learningRate: 0.01,
    optimizer: 'adam',
    activation: 'relu',
    l2Regularization: 0.001,
    batchSize: 32,
    maxEpochs: 500,
    targetFps: 60,
  },
  'multiclass': {
    name: 'Multi-class Clusters',
    description: '4 distinct clusters for multi-class classification',
    dataset: 'clusters',
    samples: 400,
    noise: 15,
    numClasses: 4,
    layers: '8, 8, 4',
    learningRate: 0.02,
    optimizer: 'adam',
    activation: 'relu',
    l2Regularization: 0,
    batchSize: 32,
    maxEpochs: 200,
    targetFps: 30,
  },
  'overfit-demo': {
    name: 'Overfitting Demo',
    description: 'Small dataset with large network to demonstrate overfitting',
    dataset: 'circle',
    samples: 50,
    noise: 20,
    numClasses: 2,
    layers: '32, 16, 8, 4',
    learningRate: 0.01,
    optimizer: 'adam',
    activation: 'relu',
    l2Regularization: 0,
    batchSize: 0,
    maxEpochs: 500,
    targetFps: 30,
  },
};

/**
 * Handles preset selection change.
 */
function handlePresetChange(): void {
  const presetId = elements.presetSelect.value;
  elements.btnApplyPreset.disabled = !presetId;
  
  // Enable delete button only for bookmarks
  elements.btnDeleteBookmark.disabled = !presetId.startsWith('bookmark:');
}

/**
 * Applies a preset configuration and starts training.
 */
async function applyPreset(): Promise<void> {
  const presetId = elements.presetSelect.value;
  if (!presetId) {
    toast.warning('Please select a preset first');
    return;
  }

  // Handle bookmark presets
  if (presetId.startsWith('bookmark:')) {
    const bookmarkId = presetId.replace('bookmark:', '');
    const bookmarks = loadBookmarks();
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    
    if (!bookmark) {
      toast.error('Bookmark not found');
      return;
    }
    
    applyBookmarkConfig(bookmark);
    toast.info(`Applying bookmark "${bookmark.name}"...`);
    
    try {
      await handleLoadData();
      await handleInitialise();
      handleStart();
      toast.success(`🚀 "${bookmark.name}" is now training!`);
    } catch (error) {
      console.error('Failed to apply bookmark:', error);
      toast.error(`Failed to apply bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return;
  }

  // Handle built-in presets
  if (!PRESETS[presetId]) {
    toast.warning('Please select a preset first');
    return;
  }

  const preset = PRESETS[presetId];
  
  // Apply configuration to UI
  elements.datasetSelect.value = preset.dataset;
  elements.inputSamples.value = String(preset.samples);
  elements.samplesValue.textContent = String(preset.samples);
  elements.inputNoise.value = String(preset.noise);
  elements.noiseValue.textContent = String(preset.noise);
  elements.inputNumClasses.value = String(preset.numClasses);
  elements.inputLr.value = String(preset.learningRate);
  elements.inputLayers.value = preset.layers;
  elements.inputOptimizer.value = preset.optimizer;
  elements.inputActivation.value = preset.activation;
  elements.inputL2.value = String(preset.l2Regularization);
  elements.inputBatchSize.value = String(preset.batchSize);
  elements.inputMaxEpochs.value = String(preset.maxEpochs);
  elements.inputFps.value = String(preset.targetFps);
  elements.fpsValue.textContent = String(preset.targetFps);

  // Update class buttons
  updateDrawClassButtons();

  toast.info(`Applying "${preset.name}" preset...`);

  try {
    // Load dataset
    await handleLoadData();

    // Initialise network
    await handleInitialise();

    // Start training
    handleStart();

    toast.success(`🚀 "${preset.name}" is now training!`);
  } catch (error) {
    console.error('Failed to apply preset:', error);
    toast.error(`Failed to apply preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Reset preset selector
  elements.presetSelect.value = '';
  elements.btnApplyPreset.disabled = true;
}

// =============================================================================
// Fullscreen Mode
// =============================================================================

/**
 * Updates fullscreen button icons based on current state.
 */
function updateFullscreenIcons(): void {
  const isFullscreen = document.fullscreenElement !== null;
  if (isFullscreen) {
    elements.iconExpand.classList.add('hidden');
    elements.iconCompress.classList.remove('hidden');
  } else {
    elements.iconExpand.classList.remove('hidden');
    elements.iconCompress.classList.add('hidden');
  }
}

/**
 * Toggles fullscreen mode for the application.
 */
async function handleFullscreenToggle(): Promise<void> {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      toast.info('Exited fullscreen');
    } else {
      await elements.appContainer.requestFullscreen();
      toast.info('Entered fullscreen — press F or Escape to exit');
    }
    updateFullscreenIcons();
  } catch (error) {
    toast.error('Fullscreen not supported in this browser');
    console.error('Fullscreen error:', error);
  }
}

// =============================================================================
// Keyboard Shortcuts
// =============================================================================

/**
 * Handles keyboard shortcuts for training controls.
 * - Space: Start/Pause training
 * - S: Single step
 * - R: Reset training
 * - Escape: Stop/Reset training
 * - F: Toggle fullscreen
 */
function handleKeyboardShortcut(event: KeyboardEvent): void {
  // Ignore if user is typing in an input field
  const target = event.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
    return;
  }

  const state = session.getState();

  switch (event.code) {
    case 'KeyF':
      if (!event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        void handleFullscreenToggle();
      }
      break;

    case 'Space':
      event.preventDefault();
      // Check if actively running (not paused) - then pause
      if (state.isRunning && !state.isPaused) {
        handlePause();
        toast.info('⏸ Training paused — press Space to resume');
        // Visual feedback on pause button
        elements.btnPause.classList.add('ring-2', 'ring-accent-400');
        setTimeout(() => elements.btnPause.classList.remove('ring-2', 'ring-accent-400'), 300);
      } 
      // If paused or not running, start/resume
      else if (state.isInitialised && state.datasetLoaded) {
        handleStart();
        toast.info('▶ Training resumed');
        // Visual feedback on start button
        elements.btnStart.classList.add('ring-2', 'ring-accent-400');
        setTimeout(() => elements.btnStart.classList.remove('ring-2', 'ring-accent-400'), 300);
      }
      break;

    case 'KeyS':
      if (!event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        // Can step if initialised, has data, and not actively running (paused or idle is fine)
        const canStep = state.isInitialised && state.datasetLoaded && (!state.isRunning || state.isPaused);
        if (canStep) {
          void handleStep();
          toast.info('⏭ Single step executed');
          // Visual pulse on step button to confirm action
          elements.btnStep.classList.add('ring-2', 'ring-accent-400', 'scale-95');
          setTimeout(() => elements.btnStep.classList.remove('ring-2', 'ring-accent-400', 'scale-95'), 150);
        } else if (!state.isInitialised) {
          toast.warning('Initialise network first before stepping');
        } else if (!state.datasetLoaded) {
          toast.warning('Load a dataset first before stepping');
        } else if (state.isRunning && !state.isPaused) {
          toast.warning('Pause training first to use single step');
        }
      }
      break;

    case 'KeyR':
      if (!event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        handleReset();
        toast.info('Training reset (R)');
      }
      break;

    case 'Escape':
      event.preventDefault();
      if (state.isRunning) {
        handlePause();
      }
      handleReset();
      toast.info('Training stopped (Escape)');
      break;
  }
}

/**
 * Triggers a file download in the browser.
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =============================================================================
// Initialisation
// =============================================================================

function init(): void {
  // Subscribe to state changes
  session.onStateChange(updateUI);

  // Bind event listeners - Presets
  elements.presetSelect.addEventListener('change', handlePresetChange);
  elements.btnApplyPreset.addEventListener('click', () => void applyPreset());
  elements.btnSaveBookmark.addEventListener('click', handleSaveBookmark);
  elements.btnDeleteBookmark.addEventListener('click', handleDeleteBookmark);

  // Initialize bookmarks dropdown
  renderBookmarkOptions();

  // Bind event listeners - Dataset
  elements.btnLoadData.addEventListener('click', () => void handleLoadData());
  elements.datasetSelect.addEventListener('change', handleDatasetSelectChange);
  elements.btnClearCustom.addEventListener('click', handleClearCustomData);
  elements.inputSamples.addEventListener('input', handleSamplesChange);
  elements.inputNoise.addEventListener('input', handleNoiseChange);
  elements.inputBalance.addEventListener('input', handleBalanceChange);
  elements.inputNumClasses.addEventListener('change', updateDrawClassButtons);

  // Initialize draw class buttons
  updateDrawClassButtons();

  // Set up point click handler for prediction details
  visualizerService.onPointClick(handlePointClick);

  // Bind event listeners - Visualization (live updates)
  elements.inputColourScheme.addEventListener('change', handleColourSchemeChange);
  elements.inputPointSize.addEventListener('change', handlePointSizeChange);
  elements.inputOpacity.addEventListener('input', handleOpacityChange);
  elements.inputContours.addEventListener('input', handleContourChange);
  elements.inputZoom.addEventListener('change', handleZoomToggle);
  elements.inputTooltips.addEventListener('change', handleTooltipsToggle);
  elements.inputHighlightErrors.addEventListener('change', () => void handleHighlightErrorsToggle());
  elements.inputConfidenceCircles.addEventListener('change', () => void handleConfidenceCirclesToggle());

  // Bind event listeners - Hyperparameters
  elements.btnInit.addEventListener('click', () => void handleInitialise());

  // Bind event listeners - Training config (live updates)
  elements.inputFps.addEventListener('input', handleFpsChange);
  elements.inputBatchSize.addEventListener('change', handleBatchSizeChange);
  elements.inputMaxEpochs.addEventListener('change', handleMaxEpochsChange);
  elements.inputValSplit.addEventListener('change', handleValSplitChange);

  // Bind event listeners - Training controls
  elements.btnStart.addEventListener('click', handleStart);
  elements.btnPause.addEventListener('click', handlePause);
  elements.btnStep.addEventListener('click', () => void handleStep());
  elements.btnReset.addEventListener('click', handleReset);

  // Bind event listeners - Export
  elements.btnExportJson.addEventListener('click', handleExportJson);
  elements.btnExportCsv.addEventListener('click', handleExportCsv);
  elements.btnExportPng.addEventListener('click', handleExportPng);
  elements.btnExportSvg.addEventListener('click', handleExportSvg);
  elements.btnExportModel.addEventListener('click', () => void handleExportModel());

  // Bind event listeners - Dataset import/export
  elements.inputCsvUpload.addEventListener('change', handleCsvUpload);
  elements.btnDownloadDataset.addEventListener('click', handleDownloadDataset);

  // Bind event listeners - Session management
  elements.btnSaveSession.addEventListener('click', saveSession);
  elements.btnLoadSession.addEventListener('click', () => void loadSession());
  elements.btnClearSession.addEventListener('click', clearSession);

  // Bind keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcut);

  // Bind theme toggle
  elements.btnThemeToggle.addEventListener('click', handleThemeToggle);

  // Bind fullscreen toggle
  elements.btnFullscreen.addEventListener('click', () => void handleFullscreenToggle());
  document.addEventListener('fullscreenchange', updateFullscreenIcons);

  // Apply stored theme
  applyTheme(getStoredTheme());

  // Setup auto-save on page unload
  setupAutoSave();

  // Try to restore previous session
  void loadSession();

  // Initial UI state
  updateUI(session.getState());
}

// Start the application
init();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  session.dispose();
  neuralNetService.dispose();
  visualizerService.dispose();
  lossChart.dispose();
});

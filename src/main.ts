/**
 * Composition Root - Dependency Injection Entry Point
 *
 * This is the ONLY place where infrastructure adapters are instantiated
 * and wired together. No other module should import from both
 * infrastructure/tensorflow and infrastructure/d3.
 */

// Import styles for Vite to process through PostCSS/Tailwind
import './presentation/styles.css';

import type { Hyperparameters, OptimizerType, ActivationType, ColourScheme, Point } from './core/domain';
import { MULTI_CLASS_COLOURS } from './core/domain';
import type { TrainingState } from './core/application';
import { TrainingSession } from './core/application';

// Infrastructure adapters - only imported here at the composition root
import { TFNeuralNet } from './infrastructure/tensorflow';
import { D3Chart, D3LossChart } from './infrastructure/d3';
import { MockDataRepository } from './infrastructure/api';

// Configuration
import { APP_CONFIG } from './config/app.config';

// UI utilities
import { toast } from './presentation/toast';

// =============================================================================
// DOM Element References
// =============================================================================

const elements = {
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

  // Visualization controls
  inputColourScheme: document.getElementById('input-colour-scheme') as HTMLSelectElement,
  inputPointSize: document.getElementById('input-point-size') as HTMLSelectElement,
  inputOpacity: document.getElementById('input-opacity') as HTMLInputElement,
  opacityValue: document.getElementById('opacity-value') as HTMLSpanElement,
  inputZoom: document.getElementById('input-zoom') as HTMLInputElement,
  inputTooltips: document.getElementById('input-tooltips') as HTMLInputElement,

  // Hyperparameter inputs
  inputLr: document.getElementById('input-lr') as HTMLInputElement,
  inputLayers: document.getElementById('input-layers') as HTMLInputElement,
  inputOptimizer: document.getElementById('input-optimizer') as HTMLSelectElement,
  inputActivation: document.getElementById('input-activation') as HTMLSelectElement,
  inputNumClasses: document.getElementById('input-num-classes') as HTMLSelectElement,
  inputL2: document.getElementById('input-l2') as HTMLInputElement,
  btnInit: document.getElementById('btn-init') as HTMLButtonElement,
  drawClassButtons: document.getElementById('draw-class-buttons') as HTMLDivElement,

  // Training config inputs
  inputBatchSize: document.getElementById('input-batch-size') as HTMLInputElement,
  inputMaxEpochs: document.getElementById('input-max-epochs') as HTMLInputElement,
  inputFps: document.getElementById('input-fps') as HTMLInputElement,
  fpsValue: document.getElementById('fps-value') as HTMLSpanElement,

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

  // Export buttons
  btnExportJson: document.getElementById('btn-export-json') as HTMLButtonElement,
  btnExportCsv: document.getElementById('btn-export-csv') as HTMLButtonElement,

  // Theme toggle
  btnThemeToggle: document.getElementById('btn-theme-toggle') as HTMLButtonElement,
  iconSun: document.getElementById('icon-sun') as HTMLElement,
  iconMoon: document.getElementById('icon-moon') as HTMLElement,
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

  // Update loss chart
  lossChart.update(state.history);
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

  // Get dataset options from sliders
  const samples = parseInt(elements.inputSamples.value, 10) || 200;
  const noise = (parseInt(elements.inputNoise.value, 10) || 10) / 100;
  const numClasses = parseInt(elements.inputNumClasses.value, 10) || 2;

  try {
    await session.loadData(datasetType, { samples, noise, numClasses });
    toast.success(`Dataset "${datasetType}" loaded (${samples} samples, ${numClasses} classes)`);
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

  const config: Hyperparameters = {
    learningRate,
    layers,
    optimizer,
    activation,
    l2Regularization,
    numClasses,
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

  session.setTrainingConfig({
    batchSize,
    maxEpochs,
    targetFps,
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
// Keyboard Shortcuts
// =============================================================================

/**
 * Handles keyboard shortcuts for training controls.
 * - Space: Start/Pause training
 * - S: Single step
 * - R: Reset training
 * - Escape: Stop/Reset training
 */
function handleKeyboardShortcut(event: KeyboardEvent): void {
  // Ignore if user is typing in an input field
  const target = event.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
    return;
  }

  const state = session.getState();

  switch (event.code) {
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

  // Bind event listeners - Dataset
  elements.btnLoadData.addEventListener('click', () => void handleLoadData());
  elements.datasetSelect.addEventListener('change', handleDatasetSelectChange);
  elements.btnClearCustom.addEventListener('click', handleClearCustomData);
  elements.inputSamples.addEventListener('input', handleSamplesChange);
  elements.inputNoise.addEventListener('input', handleNoiseChange);
  elements.inputNumClasses.addEventListener('change', updateDrawClassButtons);

  // Initialize draw class buttons
  updateDrawClassButtons();

  // Bind event listeners - Visualization (live updates)
  elements.inputColourScheme.addEventListener('change', handleColourSchemeChange);
  elements.inputPointSize.addEventListener('change', handlePointSizeChange);
  elements.inputOpacity.addEventListener('input', handleOpacityChange);
  elements.inputZoom.addEventListener('change', handleZoomToggle);
  elements.inputTooltips.addEventListener('change', handleTooltipsToggle);

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

  // Bind keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcut);

  // Bind theme toggle
  elements.btnThemeToggle.addEventListener('click', handleThemeToggle);

  // Apply stored theme
  applyTheme(getStoredTheme());

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

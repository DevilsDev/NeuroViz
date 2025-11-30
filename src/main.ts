/**
 * Composition Root - Dependency Injection Entry Point
 *
 * This is the ONLY place where infrastructure adapters are instantiated
 * and wired together. No other module should import from both
 * infrastructure/tensorflow and infrastructure/d3.
 */

// Import styles for Vite to process through PostCSS/Tailwind
import './presentation/styles.css';

import type { Hyperparameters, OptimizerType, ActivationType } from './core/domain';
import type { TrainingState } from './core/application';
import { TrainingSession } from './core/application';

// Infrastructure adapters - only imported here at the composition root
import { TFNeuralNet } from './infrastructure/tensorflow';
import { D3Chart } from './infrastructure/d3';
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

  // Hyperparameter inputs
  inputLr: document.getElementById('input-lr') as HTMLInputElement,
  inputLayers: document.getElementById('input-layers') as HTMLInputElement,
  inputOptimizer: document.getElementById('input-optimizer') as HTMLSelectElement,
  inputActivation: document.getElementById('input-activation') as HTMLSelectElement,
  inputL2: document.getElementById('input-l2') as HTMLInputElement,
  btnInit: document.getElementById('btn-init') as HTMLButtonElement,

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
  statusState: document.getElementById('status-state') as HTMLSpanElement,
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

  // Update state indicator
  const stateText = getStateText(state);
  elements.statusState.textContent = stateText;
  elements.statusState.className = `status-value ${getStateClass(state)}`;

  // Update button states
  const canTrain = state.isInitialised && state.datasetLoaded;

  elements.btnStart.disabled = !canTrain || (state.isRunning && !state.isPaused);
  elements.btnPause.disabled = !state.isRunning || state.isPaused;
  elements.btnStep.disabled = !canTrain || state.isRunning;
  elements.btnReset.disabled = !canTrain;
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
// Event Handlers
// =============================================================================

async function handleLoadData(): Promise<void> {
  const datasetType = elements.datasetSelect.value;

  showLoading(true);
  elements.btnLoadData.disabled = true;

  try {
    await session.loadData(datasetType);
    toast.success(`Dataset "${datasetType}" loaded successfully!`);
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

  const config: Hyperparameters = {
    learningRate,
    layers,
    optimizer,
    activation,
    l2Regularization,
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
}

// =============================================================================
// Initialisation
// =============================================================================

function init(): void {
  // Subscribe to state changes
  session.onStateChange(updateUI);

  // Bind event listeners - Dataset
  elements.btnLoadData.addEventListener('click', () => void handleLoadData());

  // Bind event listeners - Hyperparameters
  elements.btnInit.addEventListener('click', () => void handleInitialise());

  // Bind event listeners - Training config (live updates)
  elements.inputFps.addEventListener('input', handleFpsChange);
  elements.inputBatchSize.addEventListener('change', handleBatchSizeChange);
  elements.inputMaxEpochs.addEventListener('change', handleMaxEpochsChange);

  // Bind event listeners - Training controls
  elements.btnStart.addEventListener('click', handleStart);
  elements.btnPause.addEventListener('click', handlePause);
  elements.btnStep.addEventListener('click', () => void handleStep());
  elements.btnReset.addEventListener('click', handleReset);

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
});

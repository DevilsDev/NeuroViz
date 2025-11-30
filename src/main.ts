/**
 * Composition Root - Dependency Injection Entry Point
 *
 * This is the ONLY place where infrastructure adapters are instantiated
 * and wired together. No other module should import from both
 * infrastructure/tensorflow and infrastructure/d3.
 */

import type { Hyperparameters } from './core/domain';
import type { TrainingState } from './core/application';
import { TrainingSession } from './core/application';

// Infrastructure adapters - only imported here at the composition root
import { TFNeuralNet } from './infrastructure/tensorflow';
import { D3Chart } from './infrastructure/d3';
import { MockDataRepository } from './infrastructure/api';

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
  btnInit: document.getElementById('btn-init') as HTMLButtonElement,

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

const visualizerService = new D3Chart('viz-container', 500, 500);
const neuralNetService = new TFNeuralNet();
const dataRepository = new MockDataRepository(500); // 500ms simulated latency

// Application layer receives adapters via constructor injection
const session = new TrainingSession(neuralNetService, visualizerService, dataRepository, {
  renderInterval: 10,
  gridSize: 50,
  stepDelayMs: 50,
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
  return input
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0);
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
  } catch (error) {
    console.error('Failed to load dataset:', error);
    alert(`Failed to load dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    showLoading(false);
    elements.btnLoadData.disabled = false;
  }
}

async function handleInitialise(): Promise<void> {
  const learningRate = parseFloat(elements.inputLr.value);
  const layers = parseLayersInput(elements.inputLayers.value);

  if (isNaN(learningRate) || learningRate <= 0) {
    alert('Please enter a valid learning rate (positive number).');
    return;
  }

  if (layers.length === 0) {
    alert('Please enter at least one hidden layer size (e.g., "8, 4").');
    return;
  }

  const config: Hyperparameters = { learningRate, layers };

  elements.btnInit.disabled = true;
  elements.btnInit.textContent = 'Initialising...';

  try {
    await session.setHyperparameters(config);
  } catch (error) {
    console.error('Failed to initialise network:', error);
    alert(
      `Failed to initialise network: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    elements.btnInit.disabled = false;
    elements.btnInit.textContent = 'Initialise Network';
  }
}

function handleStart(): void {
  try {
    session.start();
  } catch (error) {
    console.error('Failed to start training:', error);
    alert(`Failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function handlePause(): void {
  session.pause();
}

async function handleStep(): Promise<void> {
  elements.btnStep.disabled = true;

  try {
    await session.step();
  } catch (error) {
    console.error('Step failed:', error);
  } finally {
    elements.btnStep.disabled = false;
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

  // Bind event listeners
  elements.btnLoadData.addEventListener('click', handleLoadData);
  elements.btnInit.addEventListener('click', handleInitialise);
  elements.btnStart.addEventListener('click', handleStart);
  elements.btnPause.addEventListener('click', handlePause);
  elements.btnStep.addEventListener('click', handleStep);
  elements.btnReset.addEventListener('click', handleReset);

  // Initial UI state
  updateUI(session.getState());

  console.log('NeuroViz initialised. Composition root wired successfully.');
}

// Start the application
init();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  session.dispose();
  neuralNetService.dispose();
});

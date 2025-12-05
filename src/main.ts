import './style.css';
import * as tf from '@tensorflow/tfjs';
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
import {
  DatasetController,
  TrainingController,
  VisualizationController,
  ExportController,
  SessionController,
  ComparisonController,
  ResearchController,
} from './presentation/controllers';
import { safeGetElement } from './utils/dom';
import {
  getDatasetElements,
  getTrainingElements,
  getVisualizationElements,
  getExportElements,
  getSessionElements,
  getComparisonElements,
  getResearchElements,
} from './utils/UIFactory';
import { setupSidebarTabs } from '@presentation/Sidebar';
import { setupTouchGestures } from '@presentation/TouchGestures';
import { setupBottomSheet } from '@presentation/BottomSheet';
import { setupOnboardingWizard } from './presentation/Onboarding';
import { TrainingState } from './core/application/ITrainingSession';

// Expose TensorFlow.js globally for E2E tests
// Tests check for window.tf to verify TensorFlow is loaded
(window as typeof window & { tf: typeof tf }).tf = tf;

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
const networkDiagram = new D3NetworkDiagram(safeGetElement<HTMLElement>('network-diagram') || document.createElement('div'));
const storage = new LocalStorageService();
const session = new TrainingSession(neuralNet, visualizer, dataRepo);

// Initialize Controllers
const datasetController = new DatasetController(session, visualizer, getDatasetElements());

const trainingController = new TrainingController(
  session,
  getTrainingElements(),
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

const visualizationController = new VisualizationController(
  session,
  neuralNet,
  visualizer,
  getVisualizationElements()
);

const _exportController = new ExportController(
  session,
  neuralNet,
  visualizer,
  getExportElements(),
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

const _sessionController = new SessionController(
  session,
  visualizer,
  storage,
  getSessionElements(),
  {
    onConfigLoaded: () => {
      // Refresh UI
      void datasetController.handleLoadData().catch((error) => {
        console.error('Failed to load data after config loaded:', error);
      });
    },
    onThemeChanged: (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
);

const comparisonController = new ComparisonController(session, getComparisonElements());

const _researchController = new ResearchController(session, getResearchElements());

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

// Cleanup on page unload to prevent memory leaks
window.addEventListener('beforeunload', () => {
  // Dispose controllers (those with dispose methods)
  if ('dispose' in datasetController && typeof datasetController.dispose === 'function') {
    datasetController.dispose();
  }

  // Dispose visualizer (includes ResizeObserver cleanup)
  if ('dispose' in visualizer && typeof visualizer.dispose === 'function') {
    visualizer.dispose();
  }

  // Clear D3 visualizations
  if ('clear' in lossChart && typeof lossChart.clear === 'function') {
    lossChart.clear();
  }
  if ('clear' in networkDiagram && typeof networkDiagram.clear === 'function') {
    networkDiagram.clear();
  }

  // Note: Add dispose() methods to remaining controllers following the pattern in DatasetController:
  // Each controller should:
  // 1. Store event handler references in a Map
  // 2. Remove all event listeners in dispose()
  // 3. Clear any timers or subscriptions
  // 4. Clean up any other resources (tooltips, observers, etc.)
});

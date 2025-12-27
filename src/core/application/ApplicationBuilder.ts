import * as tf from '@tensorflow/tfjs';
import { Application, Services, Controllers } from './Application';
import { TrainingSession } from './TrainingSession';
import { TFNeuralNet } from '../../infrastructure/tensorflow/TFNeuralNet';
import { D3Chart } from '../../infrastructure/d3/D3Chart';
import { D3LossChart } from '../../infrastructure/d3/D3LossChart';
import { D3LearningRateChart } from '../../infrastructure/d3/D3LearningRateChart';
import { D3NetworkDiagram } from '../../infrastructure/d3/D3NetworkDiagram';
import { D3ConfusionMatrix } from '../../infrastructure/d3/D3ConfusionMatrix';
import { D3WeightHistogram } from '../../infrastructure/d3/D3WeightHistogram';
import { D3ActivationHistogram } from '../../infrastructure/d3/D3ActivationHistogram';
import { MockDataRepository } from '../../infrastructure/api/MockDataRepository';
import { LocalStorageService } from '../../infrastructure/storage/LocalStorageService';
import { ErrorBoundary } from '../../infrastructure/errorHandling/ErrorBoundary';
import { WorkerManager } from '../../workers/WorkerManager';
import { dismissSuggestions } from '../../presentation/SuggestedFixes';
import {
  DatasetController,
  TrainingController,
  VisualizationController,
  ExportController,
  SessionController,
  ComparisonController,
  ResearchController,
} from '../../presentation/controllers';
import {
  getDatasetElements,
  getTrainingElements,
  getVisualizationElements,
  getExportElements,
  getSessionElements,
  getComparisonElements,
  getResearchElements,
} from '../../utils/UIFactory';
import { safeGetElement } from '../../utils/dom';
import { KeyboardShortcuts } from '../../utils/KeyboardShortcuts';
import { DatasetGallery } from '../../utils/DatasetGallery';
import { setupTouchGestures } from '../../presentation/TouchGestures';
import { setupBottomSheet } from '../../presentation/BottomSheet';
import { setupOnboardingWizard } from '../../presentation/Onboarding';
import { initELI5Tooltips } from '../../presentation/ELI5Tooltips';

/**
 * Configuration for building the application
 */
export interface ApplicationConfig {
  vizContainerId?: string;
  lossChartContainerId?: string;
  lrChartContainerId?: string;
  networkDiagramId?: string;
  confusionMatrixContainerId?: string;
  weightHistogramId?: string;
  activationHistogramId?: string;
}

/**
 * Builder class for constructing the application with all dependencies
 */
export class ApplicationBuilder {
  private config: ApplicationConfig;

  constructor(config: ApplicationConfig = {}) {
    this.config = {
      vizContainerId: config.vizContainerId ?? 'viz-container',
      lossChartContainerId: config.lossChartContainerId ?? 'loss-chart-container',
      lrChartContainerId: config.lrChartContainerId ?? 'lr-chart-container',
      networkDiagramId: config.networkDiagramId ?? 'network-diagram',
      confusionMatrixContainerId: config.confusionMatrixContainerId ?? 'confusion-matrix-container',
      weightHistogramId: config.weightHistogramId ?? 'weight-histogram',
      activationHistogramId: config.activationHistogramId ?? 'activation-histogram',
    };
  }

  /**
   * Builds and returns the fully initialized application
   */
  build(): Application {
    // Initialize infrastructure services
    this.initializeInfrastructure();

    // Build core services
    const services = this.buildServices();

    // Build controllers
    const controllers = this.buildControllers(services);


    // Initialize UI components
    const uiComponents = this.initializeUIComponents(services.session, controllers.training);
    services.keyboardShortcuts = uiComponents.keyboardShortcuts;
    services.datasetGallery = uiComponents.datasetGallery;

    return new Application(services, controllers);
  }



  /**
   * Initializes infrastructure-level services
   */
  private initializeInfrastructure(): void {
    // Expose TensorFlow.js globally for E2E tests
    (window as typeof window & { tf: typeof tf }).tf = tf;

    // Initialize Error Boundary
    const errorBoundary = new ErrorBoundary();
    errorBoundary.init();

    // Initialize Worker Manager
    new WorkerManager();
  }

  /**
   * Builds all core services
   */
  private buildServices(): Services {
    const dataRepo = new MockDataRepository();
    const neuralNet = new TFNeuralNet();
    const visualizer = new D3Chart(this.config.vizContainerId!);
    const lossChart = new D3LossChart(this.config.lossChartContainerId!);
    const lrChart = new D3LearningRateChart(this.config.lrChartContainerId!);
    const networkDiagram = new D3NetworkDiagram(
      safeGetElement<HTMLElement>(this.config.networkDiagramId!) || document.createElement('div')
    );
    const confusionMatrix = new D3ConfusionMatrix(this.config.confusionMatrixContainerId!);
    const weightHistogram = new D3WeightHistogram(
      safeGetElement<HTMLElement>(this.config.weightHistogramId!) || document.createElement('div')
    );
    const activationHistogram = new D3ActivationHistogram(
      safeGetElement<HTMLElement>(this.config.activationHistogramId!) || document.createElement('div')
    );
    const storage = new LocalStorageService();
    const session = new TrainingSession(neuralNet, visualizer, dataRepo);

    return {
      dataRepo,
      neuralNet,
      visualizer,
      session,
      lossChart,
      lrChart,
      networkDiagram,
      confusionMatrix,
      weightHistogram,
      activationHistogram,
      storage,
    };
  }

  /**
   * Builds all controllers with their dependencies
   */
  private buildControllers(services: Services): Controllers {
    const datasetController = new DatasetController(
      services.session,
      services.visualizer,
      getDatasetElements()
    );

    const trainingController = new TrainingController(
      services.session,
      getTrainingElements(),
      {
        onNetworkUpdate: () => {
          const structure = services.neuralNet.getStructure();
          if (structure) {
            services.networkDiagram.render(
              structure.layers,
              structure.activations,
              services.neuralNet.getWeightMatrices()
            );
          }
        },
        onClearVisualization: () => {
          services.lossChart.clear();
          services.networkDiagram.clear();
          services.confusionMatrix.clear();
          services.weightHistogram.clear();
          services.activationHistogram.clear();
          services.visualizer.clear();
          // Clear visualization controller state (set after controller creation)
          visualizationControllerRef?.clear();
          
          // Clear classification metrics display
          const precisionEl = document.getElementById('metric-precision');
          const recallEl = document.getElementById('metric-recall');
          const f1El = document.getElementById('metric-f1');
          if (precisionEl) precisionEl.textContent = '—';
          if (recallEl) recallEl.textContent = '—';
          if (f1El) f1El.textContent = '—';
        },
        onDismissSuggestions: () => dismissSuggestions('suggestions-panel'),
      }
    );

    // Create visualization controller and store reference for reset callback
    let visualizationControllerRef: VisualizationController | null = null;
    const visualizationController = new VisualizationController(
      services.session,
      services.neuralNet,
      services.visualizer,
      getVisualizationElements()
    );
    visualizationControllerRef = visualizationController;

    const exportController = new ExportController(
      services.session,
      services.neuralNet,
      services.visualizer,
      getExportElements(),
      {
        onModelLoaded: () => {
          // Refresh UI after loading model
          const structure = services.neuralNet.getStructure();
          if (structure) {
            services.networkDiagram.render(
              structure.layers,
              structure.activations,
              services.neuralNet.getWeightMatrices()
            );
          }
          services.visualizer.renderData(services.session.getData());
        }
      }
    );

    const sessionController = new SessionController(
      services.session,
      services.visualizer,
      services.storage,
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

    const comparisonController = new ComparisonController(services.session, getComparisonElements());

    const researchController = new ResearchController(services.session, getResearchElements());

    return {
      dataset: datasetController,
      training: trainingController,
      visualization: visualizationController,
      export: exportController,
      session: sessionController,
      comparison: comparisonController,
      research: researchController,
    };
  }

  /**
   * Initializes UI components (sidebar, gestures, shortcuts, etc.)
   */
  private initializeUIComponents(session: TrainingSession, trainingController: TrainingController): { keyboardShortcuts: KeyboardShortcuts, datasetGallery: DatasetGallery } {
    // Initialize sidebar tabs
    this.initializeSidebarTabs();

    // Initialize touch gestures and bottom sheet
    setupTouchGestures();
    setupBottomSheet();
    setupOnboardingWizard();
    initELI5Tooltips();

    // Initialize Dataset Gallery
    const datasetGallery = new DatasetGallery();

    // Initialize Keyboard Shortcuts
    const keyboardShortcuts = new KeyboardShortcuts({
      onStartPause: () => {
        const state = session.getState();
        if (state.isRunning && !state.isPaused) {
          trainingController.handlePause();
        } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
          trainingController.handleStart();
        }
      },
      onStep: () => {
        void trainingController.handleStep();
      },
      onReset: () => {
        trainingController.handleReset();
      },
      onPause: () => {
        trainingController.handlePause();
      },
      onToggleFullscreen: () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.error('Failed to enter fullscreen:', err);
          });
        } else {
          document.exitFullscreen().catch((_err) => {
          });
        }
      },
      onToggleHelp: () => {
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
          helpModal.classList.toggle('hidden');
        }
      },
      onUndo: () => {
        void session.undoConfig();
      },
      onRedo: () => {
        void session.redoConfig();
      },
    });

    return { keyboardShortcuts, datasetGallery };

  }


  /**
   * Initializes sidebar tab switching
   */
  private initializeSidebarTabs(): void {
    const sidebarTabs = document.querySelector('.sidebar-tabs');

    if (!sidebarTabs) {
      // Sidebar tabs are optional - the compact layout doesn't use them
      return;
    }

    sidebarTabs.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const tab = target.closest('.sidebar-tab') as HTMLElement | null;
      if (!tab) return;

      const targetId = tab.getAttribute('data-tab');
      if (!targetId) return;

      // Update active tab styling
      document.querySelectorAll('.sidebar-tab').forEach(t => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });

      // Show only the target panel
      document.querySelectorAll('.tab-content').forEach(panel => {
        panel.classList.toggle('active', panel.getAttribute('data-tab-content') === targetId);
      });
    });
  }
}

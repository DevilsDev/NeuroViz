import * as tf from '@tensorflow/tfjs';
import { Application } from './Application';
import type { Services, Controllers } from './Application';
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
  MetricsController,
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
 * Internal concrete-typed services used during builder assembly.
 * Controllers may depend on concrete types for framework-specific features.
 * The Application class only sees the port-typed Services interface.
 */
interface ConcreteServices {
  dataRepo: MockDataRepository;
  neuralNet: TFNeuralNet;
  visualizer: D3Chart;
  session: TrainingSession;
  lossChart: D3LossChart;
  lrChart: D3LearningRateChart;
  networkDiagram: D3NetworkDiagram;
  confusionMatrix: D3ConfusionMatrix;
  weightHistogram: D3WeightHistogram;
  activationHistogram: D3ActivationHistogram;
  storage: LocalStorageService;
  keyboardShortcuts?: KeyboardShortcuts;
  datasetGallery?: DatasetGallery;
}

/**
 * Builder class for constructing the application with all dependencies.
 * This is the composition root — it rightfully knows about concrete types.
 * The Application class only depends on port interfaces via the Services type.
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
    this.initializeInfrastructure();

    // Build with concrete types for controller wiring
    const concreteServices = this.buildConcreteServices();
    const controllers = this.buildControllers(concreteServices);

    const uiComponents = this.initializeUIComponents(concreteServices.session, controllers.training);
    concreteServices.keyboardShortcuts = uiComponents.keyboardShortcuts;
    concreteServices.datasetGallery = uiComponents.datasetGallery;

    // Upcast to port-typed Services for Application (concrete types implement all ports)
    return new Application(concreteServices as Services, controllers);
  }



  /**
   * Initializes infrastructure-level services
   */
  private initializeInfrastructure(): void {
    // Expose TensorFlow.js globally for E2E tests (dev/test only)
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      (window as typeof window & { tf: typeof tf }).tf = tf;
    }

    // Initialize Error Boundary
    const errorBoundary = new ErrorBoundary();
    errorBoundary.init();

    // Initialize Worker Manager
    new WorkerManager();
  }

  /**
   * Builds all core services
   */
  private buildConcreteServices(): ConcreteServices {
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
  private buildControllers(services: ConcreteServices): Controllers {
    const datasetController = new DatasetController(
      services.session,
      services.visualizer,
      getDatasetElements()
    );

    // Build MetricsController first so it can be used by clear callback
    const metricsController = new MetricsController(
      services.session,
      services.neuralNet,
      services.confusionMatrix,
      {
        precisionEl: document.getElementById('metric-precision'),
        recallEl: document.getElementById('metric-recall'),
        f1El: document.getElementById('metric-f1'),
        confusionMatrixEmpty: document.getElementById('confusion-matrix-empty'),
        speedCurrent: document.getElementById('speed-current'),
        speedComparisonContainer: document.getElementById('speed-comparison-container'),
        speedBaseline: document.getElementById('speed-baseline'),
        speedComparisonResult: document.getElementById('speed-comparison-result'),
        saveSpeedBaselineBtn: document.getElementById('btn-save-speed-baseline'),
        clearSpeedBaselineBtn: document.getElementById('btn-clear-speed-baseline'),
      }
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
          visualizationControllerRef?.clear();
          metricsController.clearClassificationMetrics();
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
      metrics: metricsController,
    };
  }

  /**
   * Initializes UI components (sidebar, gestures, shortcuts, etc.)
   */
  private initializeUIComponents(session: TrainingSession, trainingController: TrainingController): { keyboardShortcuts: KeyboardShortcuts, datasetGallery: DatasetGallery } {
    // Initialize sidebar tabs
    this.initializeSidebarTabs();

    // Initialize mode selector (Learn/Experiment/Advanced)
    this.initializeModeSelector();

    // Fix Learn dropdown positioning (uses fixed position to escape grid stacking)
    this.fixLearnDropdownPosition();

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

    // Initialize header button controls
    this.initializeHeaderButtons();

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

  /**
   * Initializes header button controls (fullscreen only - theme is handled by SessionController)
   */
  private initializeHeaderButtons(): void {
    // Fullscreen toggle
    const fullscreenBtn = document.getElementById('btn-fullscreen');
    const expandIcon = document.getElementById('icon-expand');
    const compressIcon = document.getElementById('icon-compress');

    if (fullscreenBtn && expandIcon && compressIcon) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.error('Failed to enter fullscreen:', err);
          });
        } else {
          document.exitFullscreen().catch((err) => {
            console.error('Failed to exit fullscreen:', err);
          });
        }
      });

      // Listen for fullscreen changes to update icon
      document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
          // In fullscreen - show compress icon
          expandIcon.classList.add('hidden');
          compressIcon.classList.remove('hidden');
        } else {
          // Not in fullscreen - show expand icon
          expandIcon.classList.remove('hidden');
          compressIcon.classList.add('hidden');
        }
      });
    }

    // Note: Theme toggle is handled by SessionController - no need to duplicate here
  }

  /**
   * Initializes the Learn/Experiment/Advanced mode selector.
   * Persists mode in localStorage and applies data-mode attribute to app container.
   */
  private initializeModeSelector(): void {
    const modeButtons = document.querySelectorAll('.mode-btn');
    const appContainer = document.querySelector('.app-container');
    if (!modeButtons.length || !appContainer) return;

    const STORAGE_KEY = 'neuroviz-ui-mode';
    const savedMode = localStorage.getItem(STORAGE_KEY) || 'learn';

    const applyMode = (mode: string): void => {
      appContainer.setAttribute('data-mode', mode);
      modeButtons.forEach(btn => {
        const isActive = btn.getAttribute('data-mode') === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
        // Roving tabindex: only active mode button is in tab order
        btn.setAttribute('tabindex', isActive ? '0' : '-1');
      });
      localStorage.setItem(STORAGE_KEY, mode);
    };

    // Apply saved mode on load
    applyMode(savedMode);

    const modes = ['learn', 'experiment', 'advanced'];

    // Bind click handlers
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (mode) applyMode(mode);
      });

      // Keyboard navigation: arrow keys cycle between modes
      btn.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        const currentMode = btn.getAttribute('data-mode') || '';
        const idx = modes.indexOf(currentMode);
        let nextIdx = -1;

        if (keyEvent.key === 'ArrowRight' || keyEvent.key === 'ArrowDown') {
          nextIdx = (idx + 1) % modes.length;
        } else if (keyEvent.key === 'ArrowLeft' || keyEvent.key === 'ArrowUp') {
          nextIdx = (idx - 1 + modes.length) % modes.length;
        }

        if (nextIdx >= 0) {
          keyEvent.preventDefault();
          const nextMode = modes[nextIdx];
          if (nextMode) {
            applyMode(nextMode);
            const nextBtn = document.querySelector(`.mode-btn[data-mode="${nextMode}"]`) as HTMLElement;
            nextBtn?.focus();
          }
        }
      });
    });
  }

  /**
   * Fixes Learn dropdown positioning.
   * CSS Grid stacking contexts prevent any z-index from painting the dropdown
   * above the sidebar. Solution: move the dropdown to document.body so it
   * escapes all stacking contexts, then position it fixed relative to the button.
   */
  private fixLearnDropdownPosition(): void {
    const btn = document.getElementById('btn-learn-menu');
    const dropdown = document.getElementById('learn-menu-dropdown');
    if (!btn || !dropdown) return;

    // Move dropdown to body to escape all grid stacking contexts
    document.body.appendChild(dropdown);

    const positionDropdown = (): void => {
      if (!dropdown.classList.contains('hidden')) {
        const rect = btn.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 4}px`;
        dropdown.style.right = `${window.innerWidth - rect.right}px`;
        dropdown.style.left = 'auto';
      }
    };

    // Reposition whenever visibility changes
    const observer = new MutationObserver(positionDropdown);
    observer.observe(dropdown, { attributes: true, attributeFilter: ['class'] });

    // Also reposition on window resize
    window.addEventListener('resize', positionDropdown);
  }
}

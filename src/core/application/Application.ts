import { TrainingSession } from './TrainingSession';
import type { IDatasetRepository } from '../ports/IDatasetRepository';
import type { TFNeuralNet } from '../../infrastructure/tensorflow/TFNeuralNet';
import type { D3Chart } from '../../infrastructure/d3/D3Chart';
import type { D3LossChart } from '../../infrastructure/d3/D3LossChart';
import type { D3LearningRateChart } from '../../infrastructure/d3/D3LearningRateChart';
import type { D3NetworkDiagram } from '../../infrastructure/d3/D3NetworkDiagram';
import type { D3ConfusionMatrix } from '../../infrastructure/d3/D3ConfusionMatrix';
import type { D3WeightHistogram } from '../../infrastructure/d3/D3WeightHistogram';
import type { D3ActivationHistogram, LayerActivationData } from '../../infrastructure/d3/D3ActivationHistogram';
import type { LocalStorageService } from '../../infrastructure/storage/LocalStorageService';
import { calculateSpeedMetrics, compareSpeed, formatSpeedMetrics, type SpeedBaseline } from '../domain/SpeedComparison';
// Removed unused import: calculateModelComplexity
import {
  DatasetController,
  TrainingController,
  VisualizationController,
  ExportController,
  SessionController,
  ComparisonController,
  ResearchController,
} from '../../presentation/controllers';
import { EducationController } from '../../presentation/controllers/EducationController';
import { KeyboardShortcuts } from '../../utils/KeyboardShortcuts';
import { DatasetGallery } from '../../utils/DatasetGallery';
import { AdvancedFeaturesService } from '../../infrastructure/ml/AdvancedFeaturesService';



/**
 * Disposable interface for services that need cleanup.
 */
export interface Disposable {
  dispose(): void;
}

/**
 * Core services used by the application.
 * Uses concrete types to match controller expectations.
 * Controllers depend on port interfaces internally where appropriate.
 */
export interface Services {
  dataRepo: IDatasetRepository;
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
 * Controllers that orchestrate UI interactions
 */
export interface Controllers {
  dataset: DatasetController;
  training: TrainingController;
  visualization: VisualizationController;
  export: ExportController;
  session: SessionController;
  comparison: ComparisonController;
  research: ResearchController;
}

/**
 * Main application class that encapsulates all services and controllers
 */
export class Application {
  private speedBaseline: SpeedBaseline | null = null;
  private educationController: EducationController | null = null;
  private advancedFeatures: AdvancedFeaturesService | null = null;

  constructor(
    public readonly services: Services,
    public readonly controllers: Controllers
  ) { }

  /**
   * Initializes the application
   */
  initialize(): void {
    // Setup global event listeners and state synchronization
    this.setupStateSync();
    this.setupUIInitialization();
    this.setupCleanup();
  }

  /**
   * Sets up state synchronization between session and UI
   */
  private setupStateSync(): void {
    this.services.session.onStateChange((state): void => {
      this.controllers.training.updateUI(state);
      this.services.lossChart.update(state.history);
      this.services.lrChart.render(state.history);
      this.controllers.comparison.updateComparisonDisplay();

      // Guard against disposed model - skip neural net operations if model is not ready
      if (!this.services.neuralNet.isReady()) {
        return;
      }

      this.controllers.visualization.updateGradientFlow();

      // Update speed metrics
      this.updateSpeedMetrics(state.history);

      // Update 3D view periodically during training (every 5 epochs to avoid performance issues)
      if (state.currentEpoch % 5 === 0 && state.isRunning) {
        void this.controllers.visualization.update3dView();
      }

      // Update network diagram and weight histogram periodically
      if (state.currentEpoch % 5 === 0 && state.isRunning && this.services.neuralNet.isReady()) {
        const structure = this.services.neuralNet.getStructure();
        if (structure) {
          this.services.networkDiagram.render(
            structure.layers,
            structure.activations,
            this.services.neuralNet.getWeightMatrices()
          );

          // Update weight histogram with flattened weights
          const weights = this.services.neuralNet.getWeightMatrices().flat().flat();
          this.services.weightHistogram.update(weights);

          // Update activation histogram with sample activations
          this.updateActivationHistogram();
        }
      }

      // Update confusion matrix and classification metrics when training completes or pauses
      if (state.isInitialised && state.datasetLoaded && state.currentEpoch > 0 && !state.isRunning) {
        void this.updateClassificationMetrics();
      }
    });
  }

  /**
   * Sets up UI initialization
   */
  private setupUIInitialization(): void {
    window.addEventListener('load', () => {
      // App starts empty - user must select a dataset first
      // Show app
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        appContainer.classList.add('loaded');
      }

      // Set initial UI state (buttons disabled until network initialized)
      this.controllers.training.updateUI(this.services.session.getState());

      // Setup speed comparison buttons
      this.setupSpeedComparison();

      // Setup undo/redo buttons
      this.setupUndoRedo();

      // Setup help modal close button
      this.setupHelpModal();

      // Setup training presets
      this.setupPresets();

      // Setup report export
      this.setupReportExport();

      // Setup dataset statistics
      this.setupDatasetStatistics();

      // Setup education features (tutorials, tooltips, challenges)
      this.setupEducation();

      // Setup advanced ML features (complexity, adversarial, dropout viz)
      this.setupAdvancedFeatures();
    });
  }

  /**
   * Sets up cleanup handlers
   */
  private setupCleanup(): void {
    this.boundCleanup = this.dispose.bind(this);
    window.addEventListener('beforeunload', this.boundCleanup);
  }

  private boundCleanup: () => void = () => { };


  /**
   * Updates classification metrics (confusion matrix, precision, recall, F1)
   */
  private async updateClassificationMetrics(): Promise<void> {
    const data = this.services.session.getData();
    if (!data?.length) return;

    // Guard against disposed model
    if (!this.services.neuralNet.isReady()) return;

    try {
      // Double-check model is still ready after async operation
      if (!this.services.neuralNet.isReady()) return;
      
      const predictions = await this.services.neuralNet.predict(data);
      
      // Check again after await in case model was disposed during prediction
      if (!this.services.neuralNet.isReady()) return;
      
      const labels = data.map(d => d.label ?? 0);
      const numClasses = Math.max(...labels) + 1;

      // Build confusion matrix
      const matrix: number[][] = Array(numClasses).fill(null).map(() => Array(numClasses).fill(0) as number[]);
      for (let i = 0; i < predictions.length; i++) {
        const predicted = predictions[i]?.predictedClass ?? 0;
        const actual = labels[i] ?? 0;
        if (matrix[actual]) {
          matrix[actual][predicted] = (matrix[actual][predicted] ?? 0) + 1;
        }
      }

      // Render confusion matrix
      const classLabels = numClasses === 2 ? ['Class 0', 'Class 1'] : Array.from({ length: numClasses }, (_, i) => `Class ${i}`);
      this.services.confusionMatrix.render({
        matrix,
        labels: classLabels,
        total: predictions.length
      });

      // Calculate and display classification metrics (imported from D3ConfusionMatrix)
      const { calculateClassMetrics, calculateMacroMetrics } = await import('../../infrastructure/d3/D3ConfusionMatrix');
      const classMetrics = calculateClassMetrics(matrix);
      const macroMetrics = calculateMacroMetrics(classMetrics);

      // Update DOM elements
      const precisionEl = document.getElementById('metric-precision');
      const recallEl = document.getElementById('metric-recall');
      const f1El = document.getElementById('metric-f1');

      if (precisionEl) precisionEl.textContent = (macroMetrics.precision * 100).toFixed(1) + '%';
      if (recallEl) recallEl.textContent = (macroMetrics.recall * 100).toFixed(1) + '%';
      if (f1El) f1El.textContent = (macroMetrics.f1 * 100).toFixed(1) + '%';

      // Hide empty state
      const emptyState = document.getElementById('confusion-matrix-empty');
      if (emptyState) emptyState.classList.add('hidden');

    } catch (error) {
      // Silently ignore disposed model errors (expected during reinitialisation)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('disposed')) {
        console.error('Failed to update classification metrics:', error);
      }
    }
  }

  /**
   * Clears classification metrics display (called on reset).
   */
  clearClassificationMetrics(): void {
    const precisionEl = document.getElementById('metric-precision');
    const recallEl = document.getElementById('metric-recall');
    const f1El = document.getElementById('metric-f1');

    if (precisionEl) precisionEl.textContent = '—';
    if (recallEl) recallEl.textContent = '—';
    if (f1El) f1El.textContent = '—';
  }

  /**
   * Updates speed metrics display
   */
  private updateSpeedMetrics(history: import('../domain/TrainingHistory').TrainingHistory): void {
    const metrics = calculateSpeedMetrics(history);
    if (!metrics) return;

    const currentEl = document.getElementById('speed-current');
    if (currentEl) {
      currentEl.textContent = formatSpeedMetrics(metrics);
    }

    // Show comparison if baseline exists
    if (this.speedBaseline) {
      const comparison = compareSpeed(metrics, this.speedBaseline.metrics);
      const comparisonContainer = document.getElementById('speed-comparison-container');
      const baselineEl = document.getElementById('speed-baseline');
      const resultEl = document.getElementById('speed-comparison-result');

      if (comparisonContainer) comparisonContainer.classList.remove('hidden');
      if (baselineEl) baselineEl.textContent = formatSpeedMetrics(this.speedBaseline.metrics);
      if (resultEl) resultEl.textContent = comparison.description;
    }
  }

  /**
   * Sets up speed comparison UI handlers
   */
  private setupSpeedComparison(): void {
    const saveBtn = document.getElementById('btn-save-speed-baseline');
    const clearBtn = document.getElementById('btn-clear-speed-baseline');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const state = this.services.session.getState();
        const metrics = calculateSpeedMetrics(state.history);
        if (metrics) {
          this.speedBaseline = {
            name: 'Baseline',
            metrics,
            timestamp: Date.now(),
          };
          if (clearBtn) clearBtn.classList.remove('hidden');
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.speedBaseline = null;
        const comparisonContainer = document.getElementById('speed-comparison-container');
        if (comparisonContainer) comparisonContainer.classList.add('hidden');
        clearBtn.classList.add('hidden');
      });
    }
  }

  /**
   * Sets up undo/redo UI handlers and state sync
   */
  private setupUndoRedo(): void {
    const undoBtn = document.getElementById('btn-undo-config') as HTMLButtonElement | null;
    const redoBtn = document.getElementById('btn-redo-config') as HTMLButtonElement | null;

    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        void this.services.session.undoConfig();
      });
    }

    if (redoBtn) {
      redoBtn.addEventListener('click', () => {
        void this.services.session.redoConfig();
      });
    }

    // Update button states on every state change
    this.services.session.onStateChange(() => {
      if (undoBtn) {
        undoBtn.disabled = !this.services.session.canUndo();
      }
      if (redoBtn) {
        redoBtn.disabled = !this.services.session.canRedo();
      }
    });
  }

  /**
   * Sets up training presets UI handlers
   */
  private setupPresets(): void {
    const presetSelect = document.getElementById('preset-select') as HTMLSelectElement | null;
    const applyBtn = document.getElementById('btn-apply-preset') as HTMLButtonElement | null;
    const descriptionEl = document.getElementById('preset-description');

    if (!presetSelect || !applyBtn) return;

    // Update description when preset selection changes
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    presetSelect.addEventListener('change', async () => {
      const presetId = presetSelect.value;

      if (!presetId) {
        applyBtn.disabled = true;
        if (descriptionEl) descriptionEl.textContent = '';
        return;
      }

      // Dynamic import to avoid circular dependencies
      const { getPreset } = await import('../domain/TrainingPresets');
      const preset = getPreset(presetId);

      if (preset && descriptionEl) {
        descriptionEl.textContent = preset.description;
        applyBtn.disabled = false;
      }
    });
    // Apply preset when button clicked
    if (applyBtn) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      applyBtn.addEventListener('click', async () => {
        const presetId = presetSelect.value;
        if (!presetId) return;

        const { getPreset } = await import('../domain/TrainingPresets');
        const preset = getPreset(presetId);

        if (!preset) return;

        try {
          // Set dataset dropdown value and trigger load
          const datasetSelect = document.getElementById('dataset-select') as HTMLSelectElement | null;
          if (datasetSelect) {
            datasetSelect.value = preset.datasetType;
            await this.controllers.dataset.handleLoadData();
          }

          // Apply hyperparameters (this will trigger config history)
          await this.services.session.setHyperparameters(preset.hyperparameters);

          // Update epoch input if available
          const epochInput = document.getElementById('input-epochs') as HTMLInputElement | null;
          if (epochInput) {
            epochInput.value = preset.recommendedEpochs.toString();
          }

          // Reset selection
          presetSelect.value = '';
          applyBtn.disabled = true;
          if (descriptionEl) descriptionEl.textContent = '';

        } catch (error) {
          console.error('Failed to apply preset:', error);
        }
      });
    }
  }

  /**
   * Sets up training report export
   */
  private setupReportExport(): void {
    const exportBtn = document.getElementById('btn-export-report') as HTMLButtonElement | null;
    if (!exportBtn) return;

    // Enable button when training has started
    this.services.session.onStateChange((state): void => {
      exportBtn.disabled = !state.isInitialised || state.currentEpoch === 0;
    });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    exportBtn.addEventListener('click', async () => {
      const state = this.services.session.getState();
      if (!state.isInitialised || state.currentEpoch === 0) return;

      try {
        const { generateHTMLReport, downloadHTMLReport } = await import('../../infrastructure/export/TrainingReport');

        // Collect classification metrics if available
        let classMetrics;
        const precisionEl = document.getElementById('metric-precision');
        const recallEl = document.getElementById('metric-recall');
        const f1El = document.getElementById('metric-f1');

        if (precisionEl && recallEl && f1El) {
          const precisionText = precisionEl.textContent?.replace('%', '') || '0';
          const recallText = recallEl.textContent?.replace('%', '') || '0';
          const f1Text = f1El.textContent?.replace('%', '') || '0';

          if (precisionText !== '—' && recallText !== '—' && f1Text !== '—') {
            classMetrics = {
              precision: parseFloat(precisionText) / 100,
              recall: parseFloat(recallText) / 100,
              f1: parseFloat(f1Text) / 100,
            };
          }
        }

        // Get dataset info
        const data = this.services.session.getData();
        const datasetName = (document.getElementById('dataset-select') as HTMLSelectElement)?.value || 'Unknown';

        // Get current hyperparameters from neural net structure
        const structure = this.services.neuralNet.getStructure();
        const config: import('../../core/domain/Hyperparameters').Hyperparameters = {
          learningRate: state.history.records[state.history.records.length - 1]?.learningRate ?? 0.03,
          layers: structure?.layers.slice(1, -1) ?? [],
        };

        // Get final metrics from last record
        const lastRecord = state.history.records[state.history.records.length - 1];

        const reportData = {
          config,
          history: state.history,
          datasetInfo: {
            name: datasetName,
            samples: data.length,
            classes: structure?.layers[structure.layers.length - 1] ?? 2,
          },
          finalMetrics: {
            loss: lastRecord?.loss ?? state.currentLoss ?? 0,
            accuracy: lastRecord?.accuracy ?? state.currentAccuracy ?? 0,
            valLoss: lastRecord?.valLoss ?? undefined,
            valAccuracy: lastRecord?.valAccuracy ?? undefined,
          },
          classMetrics,
        };

        const html = generateHTMLReport(reportData);
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        downloadHTMLReport(html, `neuroviz-report-${timestamp}.html`);

      } catch (error) {
        console.error('Failed to generate report:', error);
      }
    });
  }

  /**
   * Sets up dataset statistics display
   */
  private setupDatasetStatistics(): void {
    // Update statistics when dataset changes
    this.services.session.onStateChange((state): void => {
      if (!state.datasetLoaded) return;

      const data = this.services.session.getData();
      if (!data || data.length === 0) return;

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.updateDatasetStatistics(data);
    });
  }

  /**
   * Updates dataset statistics panel
   */
  private async updateDatasetStatistics(data: readonly import('../domain/Point').Point[]): Promise<void> {
    const { calculateDatasetStatistics } = await import('../domain/DatasetStatistics');
    const stats = calculateDatasetStatistics(Array.from(data));

    // Show panel
    const panel = document.getElementById('dataset-stats-panel');
    if (panel) panel.classList.remove('hidden');

    // Update total samples
    const totalEl = document.getElementById('stats-total');
    if (totalEl) totalEl.textContent = stats.totalSamples.toString();

    // Update class distribution
    const classesEl = document.getElementById('stats-classes');
    if (classesEl) {
      classesEl.innerHTML = '';
      const sortedClasses = Array.from(stats.classDistribution.entries()).sort((a, b) => a[0] - b[0]);

      for (const [classLabel, count] of sortedClasses) {
        const percentage = ((count / stats.totalSamples) * 100).toFixed(1);
        const classDiv = document.createElement('div');
        classDiv.className = 'flex justify-between items-center';
        classDiv.innerHTML = `
          <span>Class ${classLabel}:</span>
          <span class="text-slate-300 font-mono">${count} <span class="text-slate-500">(${percentage}%)</span></span>
        `;
        classesEl.appendChild(classDiv);
      }
    }

    // Update outliers
    const outliersEl = document.getElementById('stats-outliers');
    const outliersCountEl = document.getElementById('stats-outliers-count');
    if (outliersEl && outliersCountEl) {
      if (stats.outliers.length > 0) {
        outliersCountEl.textContent = stats.outliers.length.toString();
        outliersEl.classList.remove('hidden');
      } else {
        outliersEl.classList.add('hidden');
      }
    }
  }

  /**
   * Sets up help modal close handlers
   */
  private setupHelpModal(): void {
    const helpModal = document.getElementById('help-modal');
    const helpClose = document.getElementById('help-close');

    if (helpClose && helpModal) {
      helpClose.addEventListener('click', () => {
        helpModal.classList.add('hidden');
      });
    }

    // Close on Esc or clicking backdrop
    if (helpModal) {
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
          helpModal.classList.add('hidden');
        }
      });
    }
  }

  /**
   * Updates activation histogram with sample points from the dataset.
   */
  private updateActivationHistogram(): void {
    const data = this.services.session.getData();
    const structure = this.services.neuralNet.getStructure();
    if (!data?.length || !structure) return;

    try {
      // Sample up to 100 random points to get activation distributions
      const sampleSize = Math.min(100, data.length);
      const sampledPoints: typeof data = [];
      const step = Math.max(1, Math.floor(data.length / sampleSize));
      for (let i = 0; i < data.length && sampledPoints.length < sampleSize; i += step) {
        const point = data[i];
        if (point) {
          sampledPoints.push(point);
        }
      }

      // Collect all activations per layer
      const layerActivations: number[][] = Array(structure.layers.length).fill(null).map(() => []);

      for (const point of sampledPoints) {
        const activations = this.services.neuralNet.getLayerActivations(point);
        activations.forEach((layerVals, layerIdx) => {
          layerActivations[layerIdx]?.push(...layerVals);
        });
      }

      // Convert to LayerActivationData format
      const layersData: LayerActivationData[] = structure.layers.map((layerSize, idx) => ({
        layerIndex: idx,
        layerName: idx === 0 ? 'Input' : idx === structure.layers.length - 1 ? 'Output' : `Layer ${idx}`,
        activations: layerActivations[idx] ?? []
      }));

      this.services.activationHistogram.update(layersData);
    } catch (error) {
      console.error('Failed to update activation histogram:', error);
    }
  }

  /**
   * Sets up education features (tutorials, tooltips, challenges)
   */
  private setupEducation(): void {
    this.educationController = new EducationController();
    this.educationController.initialise();

    // Hook into training events for tutorials and challenges
    this.services.session.onStateChange((state): void => {
      if (!this.educationController) return;

      // Notify tutorial service of training events
      if (state.isRunning && state.currentEpoch === 1) {
        this.educationController.notifyTrainingEvent('start');
      }
      if (state.currentEpoch > 0) {
        this.educationController.notifyTrainingEvent('epoch', state.currentEpoch);
      }
      if (!state.isRunning && state.currentEpoch > 0) {
        this.educationController.notifyTrainingEvent('complete');
      }

      // Validate active challenge
      const challengeState = this.educationController.getChallengeService().getState();
      if (challengeState.isActive && !challengeState.isComplete) {
        const datasetSelect = document.getElementById('dataset-select') as HTMLSelectElement | null;
        const datasetType = datasetSelect?.value ?? 'circle';
        const config = this.getCurrentConfig();
        if (config) {
          this.educationController.validateChallenge(config, state.history, datasetType);
        }
      }
    });

    // Listen for dataset load events from challenges
    window.addEventListener('load-dataset', ((e: CustomEvent<{ dataset: string }>) => {
      const datasetSelect = document.getElementById('dataset-select') as HTMLSelectElement | null;
      if (datasetSelect) {
        datasetSelect.value = e.detail.dataset;
        void this.controllers.dataset.handleLoadData();
      }
    }) as EventListener);
  }

  /**
   * Gets current hyperparameters configuration
   */
  private getCurrentConfig(): import('../domain/Hyperparameters').Hyperparameters | null {
    const structure = this.services.neuralNet.getStructure();
    if (!structure) return null;

    const state = this.services.session.getState();
    const lastRecord = state.history.records[state.history.records.length - 1];

    return {
      learningRate: lastRecord?.learningRate ?? 0.03,
      layers: structure.layers.slice(1, -1), // Hidden layers only
      activation: structure.activations[0] as import('../domain/Hyperparameters').ActivationType,
    };
  }

  /**
   * Sets up advanced ML features (complexity metrics, adversarial examples, dropout viz)
   */
  private setupAdvancedFeatures(): void {
    this.advancedFeatures = new AdvancedFeaturesService();

    // Update complexity metrics when architecture changes
    this.services.session.onStateChange((state): void => {
      if (state.isInitialised && this.advancedFeatures) {
        this.updateModelComplexity();
      }
    });

    // Setup adversarial example generation button
    const generateBtn = document.getElementById('btn-generate-adversarial') as HTMLButtonElement | null;
    const clearBtn = document.getElementById('btn-clear-adversarial');

    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        void this.generateAdversarialExamples();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.advancedFeatures?.clearAdversarialExamples();
        this.advancedFeatures?.updateAdversarialDisplay();
        // Clear from visualisation
        this.services.visualizer.clearAdversarialPoints?.();
      });
    }

    // Enable adversarial button when model is trained
    this.services.session.onStateChange((state): void => {
      if (generateBtn) {
        generateBtn.disabled = !state.isInitialised || state.currentEpoch === 0;
      }
    });

    // Update network diagram with dropout mask during training
    this.services.session.onStateChange((state): void => {
      // Guard against disposed model
      if (!this.services.neuralNet.isReady()) return;

      if (state.isRunning && this.advancedFeatures) {
        const config = this.services.neuralNet.getConfig();
        const dropoutRate = config?.dropoutRate ?? 0;

        if (dropoutRate > 0) {
          // Generate new dropout mask every few epochs
          if (state.currentEpoch % 3 === 0) {
            const structure = this.services.neuralNet.getStructure();
            if (structure) {
              const mask = this.advancedFeatures.generateDropoutMask(
                structure.layers.slice(1, -1), // Hidden layers only
                dropoutRate
              );

              // Update network diagram with dropout mask
              this.services.networkDiagram.render(
                structure.layers,
                structure.activations,
                this.services.neuralNet.getWeightMatrices(),
                mask
              );
            }
          }
        }
      }
    });
  }

  /**
   * Updates model complexity display
   */
  private updateModelComplexity(): void {
    const structure = this.services.neuralNet.getStructure();
    const config = this.services.neuralNet.getConfig();

    if (!structure || !config || !this.advancedFeatures) return;

    const metrics = this.advancedFeatures.calculateComplexity(
      structure.layers.slice(1, -1), // Hidden layers
      structure.layers[structure.layers.length - 1] ?? 2, // Output size
      config.batchNorm ?? false,
      config.dropoutRate ?? 0
    );

    this.advancedFeatures.updateComplexityDisplay(metrics);
  }

  /**
   * Generates adversarial examples for the current model
   */
  private async generateAdversarialExamples(): Promise<void> {
    if (!this.advancedFeatures) return;

    const data = this.services.session.getData();
    if (!data?.length) return;

    const generateBtn = document.getElementById('btn-generate-adversarial') as HTMLButtonElement | null;
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.textContent = 'Generating...';
    }

    try {
      // Guard: ensure model is ready
      if (!this.services.neuralNet.isReady()) {
        console.warn('Cannot generate adversarial examples: model not ready');
        throw new Error('Model not ready');
      }

      // Create prediction function
      const predictFn = async (point: import('../domain/Point').Point) => {
        if (!this.services.neuralNet.isReady()) return null;
        const predictions = await this.services.neuralNet.predict([point]);
        return predictions[0] ?? null;
      };

      const examples = await this.advancedFeatures.generateAdversarialExamples(data, predictFn);
      this.advancedFeatures.updateAdversarialDisplay();

      // Add adversarial points to visualisation
      if (examples.length > 0) {
        const adversarialPoints = examples.map(ex => ({
          ...ex.point,
          isAdversarial: true,
        }));
        this.services.visualizer.renderAdversarialPoints?.(adversarialPoints);
      }
    } catch (error) {
      console.error('Failed to generate adversarial examples:', error);
    } finally {
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Adversarial Examples';
      }
    }
  }

  /**
   * Disposes the application and cleans up all resources.
   * Call this method before re-instantiating or during hot reload.
   */
  dispose(): void {
    // Dispose TensorFlow.js neural network to release GPU memory
    if (this.services.neuralNet && typeof this.services.neuralNet.dispose === 'function') {
      this.services.neuralNet.dispose();
    }

    // Dispose services with dispose methods
    if (this.services.visualizer && typeof this.services.visualizer.dispose === 'function') {
      this.services.visualizer.dispose();
    }

    // Dispose D3 visualizations (calls clear() internally and cleans up observers)
    this.services.lossChart.dispose();
    this.services.lrChart.dispose();
    this.services.networkDiagram.dispose();
    this.services.confusionMatrix.dispose();
    this.services.weightHistogram.dispose();
    this.services.activationHistogram.dispose();

    // Dispose keyboard listener
    if (this.services.keyboardShortcuts) {
      this.services.keyboardShortcuts.dispose();
    }

    if (this.services.datasetGallery) {
      this.services.datasetGallery.dispose();
    }

    // Dispose all controllers (single iteration - no duplicates)
    Object.values(this.controllers).forEach(controller => {
      if (controller && typeof (controller as any).dispose === 'function') {
        (controller as any).dispose();
      }
    });

    // Dispose education controller
    if (this.educationController) {
      this.educationController.dispose();
    }

    // Remove window listeners
    window.removeEventListener('beforeunload', this.boundCleanup);
  }


}


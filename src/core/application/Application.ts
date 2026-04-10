import { TrainingSession } from './TrainingSession';
import type { IDatasetRepository } from '../ports/IDatasetRepository';
import type { INeuralNetworkService } from '../ports/INeuralNetworkService';
import type { IVisualizerService } from '../ports/IVisualizerService';
import type { LocalStorageService } from '../../infrastructure/storage/LocalStorageService';
import type {
  ILossChartService,
  ILearningRateChartService,
  IAccuracyChartService,
  INetworkDiagramService,
  IConfusionMatrixService,
  IWeightHistogramService,
  IActivationHistogramService,
} from '../ports/IChartService';
import type { Hyperparameters, ActivationType } from '../domain/Hyperparameters';
import type { Point } from '../domain/Point';
import { calculateDatasetStatistics } from '../domain/DatasetStatistics';
import { getPreset } from '../domain/TrainingPresets';
import {
  DatasetController,
  TrainingController,
  VisualizationController,
  ExportController,
  SessionController,
  MetricsController,
} from '../../presentation/controllers';
import { EducationController } from '../../presentation/controllers/EducationController';
import { KeyboardShortcuts } from '../../utils/KeyboardShortcuts';
import { DatasetGallery } from '../../utils/DatasetGallery';
import { AdvancedFeaturesService } from '../../infrastructure/ml/AdvancedFeaturesService';
import { logger } from '../../infrastructure/logging/Logger';
import { WorkflowSpine } from '../../presentation/WorkflowSpine';


/**
 * Disposable interface for services that need cleanup.
 */
export interface Disposable {
  dispose(): void;
}

/**
 * Core services used by the application.
 * All fields use port interfaces — no concrete infrastructure types.
 */
export interface Services {
  dataRepo: IDatasetRepository;
  neuralNet: INeuralNetworkService;
  visualizer: IVisualizerService;
  session: TrainingSession;
  lossChart: ILossChartService;
  lrChart: ILearningRateChartService;
  accuracyChart: IAccuracyChartService;
  networkDiagram: INetworkDiagramService;
  confusionMatrix: IConfusionMatrixService;
  weightHistogram: IWeightHistogramService;
  activationHistogram: IActivationHistogramService;
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
  metrics: MetricsController;
}

/**
 * Main application class that coordinates services and controllers.
 *
 * This class is a thin coordinator — all DOM manipulation is delegated
 * to controllers in the presentation layer.
 */
export class Application {
  private educationController: EducationController | null = null;
  private advancedFeatures: AdvancedFeaturesService | null = null;
  private workflowSpine: WorkflowSpine | null = null;

  constructor(
    public readonly services: Services,
    public readonly controllers: Controllers
  ) { }

  /**
   * Initializes the application
   */
  initialize(): void {
    this.setupStateSync();
    this.setupUIInitialization();
    this.setupCleanup();
  }

  /**
   * Sets up state synchronization between session and UI
   */
  private setupStateSync(): void {
    // Initialize workflow spine breadcrumb
    try {
      this.workflowSpine = new WorkflowSpine('workflow-spine');
    } catch {
      // Container may not exist in test environments
    }

    this.services.session.onStateChange((state): void => {
      // Update workflow spine
      this.workflowSpine?.update(state);
      // Always update: lightweight UI text + chart line appends
      this.controllers.training.updateUI(state);
      this.services.lossChart.update(state.history);
      this.services.lrChart.render(state.history);
      this.services.accuracyChart.update(state.history);

      // Guard against disposed model
      if (!this.services.neuralNet.isReady()) {
        return;
      }

      // Skip expensive visualizations during training steps unless on a milestone epoch.
      // This dramatically improves training throughput (from ~1 epoch/5s to ~60 epochs/s).
      const isTrainingStep = state.eventType === 'trainingStep';
      const isMilestone = state.currentEpoch % 5 === 0;

      if ((!isTrainingStep || isMilestone) && this.services.neuralNet.isReady()) {
        this.controllers.visualization.updateGradientFlow();
      }

      // Update 3D view periodically during training
      if (isMilestone && state.isRunning && this.services.neuralNet.isReady()) {
        void this.controllers.visualization.update3dView();
      }

      // Update network diagram and weight histogram periodically
      if (isMilestone && state.isRunning && this.services.neuralNet.isReady()) {
        this.updateNetworkVisualizations();
      }
    });
  }

  /**
   * Updates network diagram, weight histogram, and activation histogram.
   */
  private updateNetworkVisualizations(): void {
    const structure = this.services.neuralNet.getStructure();
    if (!structure) return;

    this.services.networkDiagram.render(
      structure.layers,
      structure.activations,
      this.services.neuralNet.getWeightMatrices()
    );

    const weights = this.services.neuralNet.getWeightMatrices().flat().flat();
    this.services.weightHistogram.update(weights);

    this.updateActivationHistogram(structure);
  }

  /**
   * Updates activation histogram with sample points from the dataset.
   */
  private updateActivationHistogram(structure: { layers: number[]; activations: string[] }): void {
    const data = this.services.session.getData();
    if (!data?.length) return;

    try {
      const sampleSize = Math.min(100, data.length);
      const sampledPoints: typeof data = [];
      const step = Math.max(1, Math.floor(data.length / sampleSize));
      for (let i = 0; i < data.length && sampledPoints.length < sampleSize; i += step) {
        const point = data[i];
        if (point) {
          sampledPoints.push(point);
        }
      }

      const layerActivations: number[][] = Array(structure.layers.length).fill(null).map(() => []);
      for (const point of sampledPoints) {
        const activations = this.services.neuralNet.getLayerActivations(point);
        activations.forEach((layerVals, layerIdx) => {
          layerActivations[layerIdx]?.push(...layerVals);
        });
      }

      const layersData = structure.layers.map((_, idx) => ({
        layerIndex: idx,
        layerName: idx === 0 ? 'Input' : idx === structure.layers.length - 1 ? 'Output' : `Layer ${idx}`,
        activations: layerActivations[idx] ?? []
      }));

      this.services.activationHistogram.update(layersData);
    } catch (error) {
      logger.error('Failed to update activation histogram', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Sets up UI initialization
   */
  private setupUIInitialization(): void {
    window.addEventListener('load', () => {
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        appContainer.classList.add('loaded');
      }

      this.controllers.training.updateUI(this.services.session.getState());
      this.controllers.metrics.initialize();
      this.setupUndoRedo();
      this.setupHelpModal();
      this.setupPresets();
      this.setupReportExport();
      this.setupDatasetStatistics();
      this.setupEducation();
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
   * Clears classification metrics display (called on reset).
   */
  clearClassificationMetrics(): void {
    this.controllers.metrics.clearClassificationMetrics();
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

    this.services.session.onStateChange(() => {
      if (undoBtn) undoBtn.disabled = !this.services.session.canUndo();
      if (redoBtn) redoBtn.disabled = !this.services.session.canRedo();
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

    presetSelect.addEventListener('change', () => {
      const presetId = presetSelect.value;
      if (!presetId) {
        applyBtn.disabled = true;
        if (descriptionEl) descriptionEl.textContent = '';
        return;
      }

      const preset = getPreset(presetId);
      if (preset && descriptionEl) {
        descriptionEl.textContent = preset.description;
        applyBtn.disabled = false;
      }
    });

    applyBtn.addEventListener('click', () => {
      const presetId = presetSelect.value;
      if (!presetId) return;

      const preset = getPreset(presetId);
      if (!preset) return;

      void (async (): Promise<void> => {
        const datasetSelect = document.getElementById('dataset-select') as HTMLSelectElement | null;
        if (datasetSelect) {
          datasetSelect.value = preset.datasetType;
          await this.controllers.dataset.handleLoadData();
        }

        await this.services.session.setHyperparameters(preset.hyperparameters);

        const epochInput = document.getElementById('input-epochs') as HTMLInputElement | null;
        if (epochInput) {
          epochInput.value = preset.recommendedEpochs.toString();
        }

        presetSelect.value = '';
        applyBtn.disabled = true;
        if (descriptionEl) descriptionEl.textContent = '';
      })().catch((error: unknown) => {
        logger.error('Failed to apply preset', error instanceof Error ? error : undefined);
      });
    });
  }

  /**
   * Sets up training report export.
   * Uses MetricsController for computed metrics instead of scraping the DOM.
   */
  private setupReportExport(): void {
    const exportBtn = document.getElementById('btn-export-report') as HTMLButtonElement | null;
    if (!exportBtn) return;

    this.services.session.onStateChange((state): void => {
      exportBtn.disabled = !state.isInitialised || state.currentEpoch === 0;
    });

    exportBtn.addEventListener('click', () => {
      const state = this.services.session.getState();
      if (!state.isInitialised || state.currentEpoch === 0) return;

      void import('../../infrastructure/export/TrainingReport').then(({ generateHTMLReport, downloadHTMLReport }) => {
        // Get classification metrics from MetricsController (not DOM)
        const classMetrics = this.controllers.metrics.getClassificationMetrics() ?? undefined;

        const data = this.services.session.getData();
        const datasetName = (document.getElementById('dataset-select') as HTMLSelectElement)?.value || 'Unknown';

        const structure = this.services.neuralNet.getStructure();
        const config: Hyperparameters = {
          learningRate: state.history.records[state.history.records.length - 1]?.learningRate ?? 0.03,
          layers: structure?.layers.slice(1, -1) ?? [],
        };

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
      }).catch((error: unknown) => {
        logger.error('Failed to generate report', error instanceof Error ? error : undefined);
      });
    });
  }

  /**
   * Sets up dataset statistics display
   */
  private setupDatasetStatistics(): void {
    this.services.session.onStateChange((state): void => {
      if (!state.datasetLoaded) return;

      const data = this.services.session.getData();
      if (!data || data.length === 0) return;

      try {
        this.updateDatasetStatistics(data);
      } catch (error) {
        logger.error('Failed to update dataset statistics', error instanceof Error ? error : undefined);
      }
    });
  }

  /**
   * Updates dataset statistics panel
   */
  private updateDatasetStatistics(data: readonly Point[]): void {
    const stats = calculateDatasetStatistics(Array.from(data));

    const panel = document.getElementById('dataset-stats-panel');
    if (panel) panel.classList.remove('hidden');

    const totalEl = document.getElementById('stats-total');
    if (totalEl) totalEl.textContent = stats.totalSamples.toString();

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

    if (helpModal) {
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
          helpModal.classList.add('hidden');
        }
      });
    }
  }

  /**
   * Sets up education features (tutorials, tooltips, challenges)
   */
  private setupEducation(): void {
    this.educationController = new EducationController();
    this.educationController.initialise();

    this.services.session.onStateChange((state): void => {
      if (!this.educationController) return;

      if (state.isRunning && state.currentEpoch === 1) {
        this.educationController.notifyTrainingEvent('start');
      }
      if (state.currentEpoch > 0) {
        this.educationController.notifyTrainingEvent('epoch', state.currentEpoch);
      }
      if (!state.isRunning && state.currentEpoch > 0) {
        this.educationController.notifyTrainingEvent('complete');
      }

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
  private getCurrentConfig(): Hyperparameters | null {
    const structure = this.services.neuralNet.getStructure();
    if (!structure) return null;

    const state = this.services.session.getState();
    const lastRecord = state.history.records[state.history.records.length - 1];

    return {
      learningRate: lastRecord?.learningRate ?? 0.03,
      layers: structure.layers.slice(1, -1),
      activation: structure.activations[0] as ActivationType,
    };
  }

  /**
   * Sets up advanced ML features (complexity metrics, adversarial examples, dropout viz)
   */
  private setupAdvancedFeatures(): void {
    this.advancedFeatures = new AdvancedFeaturesService();

    this.services.session.onStateChange((state): void => {
      if (state.isInitialised && this.advancedFeatures) {
        this.updateModelComplexity();
      }
    });

    const generateBtn = document.getElementById('btn-generate-adversarial') as HTMLButtonElement | null;
    const clearBtn = document.getElementById('btn-clear-adversarial');
    const methodSelect = document.getElementById('adversarial-method') as HTMLSelectElement | null;
    const methodDesc = document.getElementById('adversarial-method-desc');
    const sampleSizeSlider = document.getElementById('adversarial-sample-size') as HTMLInputElement | null;
    const sampleSizeValue = document.getElementById('adversarial-sample-value');

    if (methodSelect) {
      methodSelect.addEventListener('change', () => {
        const method = methodSelect.value as 'simple' | 'fgsm';
        this.advancedFeatures?.setGenerationConfig({ method });
        if (methodDesc) {
          methodDesc.textContent = method === 'simple'
            ? 'Spiral search pattern, fast but less accurate'
            : 'Gradient-based attack, slower but more accurate';
        }
      });
    }

    if (sampleSizeSlider && sampleSizeValue) {
      sampleSizeSlider.addEventListener('input', () => {
        const sampleSize = parseInt(sampleSizeSlider.value);
        sampleSizeValue.textContent = sampleSize.toString();
        this.advancedFeatures?.setGenerationConfig({ sampleSize });
      });
    }

    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        void this.generateAdversarialExamples().catch((error: unknown) => {
          logger.error('Failed to generate adversarial examples', error instanceof Error ? error : undefined);
        });
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.advancedFeatures?.clearAdversarialExamples();
        this.advancedFeatures?.updateAdversarialDisplay();
        this.services.visualizer.clearAdversarialPoints?.();
      });
    }

    this.services.session.onStateChange((state): void => {
      if (generateBtn) {
        generateBtn.disabled = !state.isInitialised || state.currentEpoch === 0;
      }
    });

    this.services.session.onStateChange((state): void => {
      if (!this.services.neuralNet.isReady()) return;

      if (state.isRunning && this.advancedFeatures) {
        const config = this.services.neuralNet.getConfig();
        const dropoutRate = config?.dropoutRate ?? 0;

        if (dropoutRate > 0 && state.currentEpoch % 3 === 0) {
          const structure = this.services.neuralNet.getStructure();
          if (structure) {
            const mask = this.advancedFeatures.generateDropoutMask(
              structure.layers.slice(1, -1),
              dropoutRate
            );
            this.services.networkDiagram.render(
              structure.layers,
              structure.activations,
              this.services.neuralNet.getWeightMatrices(),
              mask
            );
          }
        }
      }
    });
  }

  private updateModelComplexity(): void {
    const structure = this.services.neuralNet.getStructure();
    const config = this.services.neuralNet.getConfig();
    if (!structure || !config || !this.advancedFeatures) return;

    const metrics = this.advancedFeatures.calculateComplexity(
      structure.layers.slice(1, -1),
      structure.layers[structure.layers.length - 1] ?? 2,
      config.batchNorm ?? false,
      config.dropoutRate ?? 0
    );
    this.advancedFeatures.updateComplexityDisplay(metrics);
  }

  private async generateAdversarialExamples(): Promise<void> {
    if (!this.advancedFeatures) return;

    const data = this.services.session.getData();
    if (!data?.length) return;

    const generateBtn = document.getElementById('btn-generate-adversarial') as HTMLButtonElement | null;
    const progressDiv = document.getElementById('adversarial-progress');
    const progressText = document.getElementById('adversarial-progress-text');
    const progressCount = document.getElementById('adversarial-progress-count');
    const progressBar = document.getElementById('adversarial-progress-bar');

    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.textContent = 'Generating...';
    }
    if (progressDiv) progressDiv.classList.remove('hidden');

    try {
      if (!this.services.neuralNet.isReady()) {
        throw new Error('Model not ready');
      }

      const onProgress = (current: number, total: number, status: string): void => {
        if (progressText) progressText.textContent = status;
        if (progressCount) progressCount.textContent = `${current}/${total}`;
        if (progressBar) {
          progressBar.style.width = `${total > 0 ? (current / total) * 100 : 0}%`;
        }
      };

      const examples = await this.advancedFeatures.generateAdversarialExamples(
        data,
        this.services.neuralNet,
        onProgress
      );

      this.advancedFeatures.updateAdversarialDisplay();

      if (examples.length > 0) {
        const adversarialPoints = examples.map(ex => ({
          ...ex.point,
          isAdversarial: true,
          originalPoint: ex.originalPoint,
        }));
        this.services.visualizer.renderAdversarialPoints?.(adversarialPoints);
      }
    } finally {
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Adversarial Examples';
      }
      setTimeout(() => {
        if (progressDiv) progressDiv.classList.add('hidden');
      }, 1500);
    }
  }

  /**
   * Disposes the application and cleans up all resources.
   */
  dispose(): void {
    this.services.neuralNet.dispose();

    if ('dispose' in this.services.visualizer && typeof this.services.visualizer.dispose === 'function') {
      this.services.visualizer.dispose();
    }

    this.services.lossChart.dispose();
    this.services.lrChart.dispose();
    this.services.accuracyChart.dispose();
    this.services.networkDiagram.dispose();
    this.services.confusionMatrix.dispose();
    this.services.weightHistogram.dispose();
    this.services.activationHistogram.dispose();

    if (this.services.keyboardShortcuts) {
      this.services.keyboardShortcuts.dispose();
    }

    if (this.services.datasetGallery) {
      this.services.datasetGallery.dispose();
    }

    Object.values(this.controllers).forEach(controller => {
      if (controller && 'dispose' in controller && typeof controller.dispose === 'function') {
        (controller as Disposable).dispose();
      }
    });

    if (this.educationController) {
      this.educationController.dispose();
    }

    window.removeEventListener('beforeunload', this.boundCleanup);
  }
}

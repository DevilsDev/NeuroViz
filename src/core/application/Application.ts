import { TrainingSession } from './TrainingSession';
import { IDatasetRepository } from '../ports/IDatasetRepository';
import { TFNeuralNet } from '../../infrastructure/tensorflow/TFNeuralNet';
import { D3Chart } from '../../infrastructure/d3/D3Chart';
import { D3LossChart } from '../../infrastructure/d3/D3LossChart';
import { D3NetworkDiagram } from '../../infrastructure/d3/D3NetworkDiagram';
import { D3ConfusionMatrix } from '../../infrastructure/d3/D3ConfusionMatrix';
import { D3WeightHistogram } from '../../infrastructure/d3/D3WeightHistogram';
import { LocalStorageService } from '../../infrastructure/storage/LocalStorageService';
import {
  DatasetController,
  TrainingController,
  VisualizationController,
  ExportController,
  SessionController,
  ComparisonController,
  ResearchController,
} from '../../presentation/controllers';
import { KeyboardShortcuts } from '../../utils/KeyboardShortcuts';
import { DatasetGallery } from '../../utils/DatasetGallery';



/**
 * Core services used by the application
 * Note: Uses concrete types rather than interfaces to simplify integration
 * with existing controller implementations that expect specific types
 */
export interface Services {
  dataRepo: IDatasetRepository;
  neuralNet: TFNeuralNet;
  visualizer: D3Chart;
  session: TrainingSession;
  lossChart: D3LossChart;
  networkDiagram: D3NetworkDiagram;
  confusionMatrix: D3ConfusionMatrix;
  weightHistogram: D3WeightHistogram;
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
    this.services.session.onStateChange((state) => {
      this.controllers.training.updateUI(state);
      this.services.lossChart.update(state.history);
      this.controllers.comparison.updateComparisonDisplay();
      this.controllers.visualization.updateGradientFlow();

      // Update network diagram and weight histogram periodically
      if (state.currentEpoch % 5 === 0 && state.isRunning) {
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
      // Trigger initial dataset load
      void this.controllers.dataset.handleLoadData().catch((error) => {
        console.error('Failed to load initial dataset:', error);
      });

      // Show app
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        appContainer.classList.add('loaded');
      }
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

    try {
      const predictions = await this.services.neuralNet.predict(data);
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
      console.error('Failed to update classification metrics:', error);
    }
  }

  /**
   * Disposes the application and cleans up all resources.
   * Call this method before re-instantiating or during hot reload.
   */
  dispose(): void {
    // Dispose services with dispose methods
    if (this.services.visualizer && typeof this.services.visualizer.dispose === 'function') {
      this.services.visualizer.dispose();
    }

    // Clear D3 visualizations
    this.services.lossChart.clear();
    this.services.networkDiagram.clear();
    this.services.confusionMatrix.clear();
    this.services.weightHistogram.clear();

    // Dispose keyboard listener
    if (this.services.keyboardShortcuts) {
      this.services.keyboardShortcuts.dispose();
    }

    if (this.services.datasetGallery) {
      this.services.datasetGallery.dispose();
    }

    // Dispose all controllers
    Object.values(this.controllers).forEach(controller => {
      if (controller && typeof (controller as any).dispose === 'function') {
        (controller as any).dispose();
      }
    });

    // Dispose all controllers
    Object.values(this.controllers).forEach(controller => {
      if (controller && typeof (controller as any).dispose === 'function') {
        (controller as any).dispose();
      }
    });

    // Remove window listeners
    window.removeEventListener('beforeunload', this.boundCleanup);
  }


}


import type { TrainingState } from '../../core/application/ITrainingSession';
import type { TrainingHistory } from '../../core/domain';
import type { INeuralNetworkService } from '../../core/ports';
import type { IConfusionMatrixService } from '../../core/ports/IChartService';
import type { TrainingSession } from '../../core/application/TrainingSession';
import { calculateSpeedMetrics, compareSpeed, formatSpeedMetrics, type SpeedBaseline } from '../../core/domain/SpeedComparison';
import { logger } from '../../infrastructure/logging/Logger';
import { isModelDisposedError } from '../../core/domain/errors';

/**
 * Computed classification metrics stored in-memory (not scraped from DOM).
 */
export interface ClassificationMetrics {
  precision: number;
  recall: number;
  f1: number;
}

/**
 * DOM element references for the metrics controller.
 */
export interface MetricsElements {
  precisionEl: HTMLElement | null;
  recallEl: HTMLElement | null;
  f1El: HTMLElement | null;
  confusionMatrixEmpty: HTMLElement | null;
  speedCurrent: HTMLElement | null;
  speedComparisonContainer: HTMLElement | null;
  speedBaseline: HTMLElement | null;
  speedComparisonResult: HTMLElement | null;
  saveSpeedBaselineBtn: HTMLElement | null;
  clearSpeedBaselineBtn: HTMLElement | null;
}

/**
 * Controller responsible for classification metrics display and speed comparison.
 * Keeps computed metrics in-memory so they can be consumed programmatically
 * without scraping the DOM.
 */
export class MetricsController {
  private speedBaseline: SpeedBaseline | null = null;
  private currentClassificationMetrics: ClassificationMetrics | null = null;

  constructor(
    private readonly session: TrainingSession,
    private readonly neuralNet: INeuralNetworkService,
    private readonly confusionMatrix: IConfusionMatrixService,
    private readonly elements: MetricsElements
  ) {}

  /**
   * Binds event listeners for speed comparison buttons.
   */
  initialize(): void {
    this.setupSpeedComparison();
    this.setupStateSync();
  }

  /**
   * Returns the latest computed classification metrics, or null if not yet computed.
   */
  getClassificationMetrics(): ClassificationMetrics | null {
    return this.currentClassificationMetrics;
  }

  /**
   * Clears classification metrics display and in-memory state (called on reset).
   */
  clearClassificationMetrics(): void {
    this.currentClassificationMetrics = null;
    if (this.elements.precisionEl) this.elements.precisionEl.textContent = '\u2014';
    if (this.elements.recallEl) this.elements.recallEl.textContent = '\u2014';
    if (this.elements.f1El) this.elements.f1El.textContent = '\u2014';
  }

  /**
   * Updates classification metrics when training completes or pauses.
   */
  async updateClassificationMetrics(): Promise<void> {
    const data = this.session.getData();
    if (!data?.length) return;
    if (!this.neuralNet.isReady()) return;

    try {
      const predictions = await this.neuralNet.predict(data);
      if (!this.neuralNet.isReady()) return;

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
      const classLabels = numClasses === 2
        ? ['Class 0', 'Class 1']
        : Array.from({ length: numClasses }, (_, i) => `Class ${i}`);
      this.confusionMatrix.render({ matrix, labels: classLabels, total: predictions.length });

      // Calculate metrics and store in-memory
      const { calculateClassMetrics, calculateMacroMetrics } = await import('../../infrastructure/d3/D3ConfusionMatrix');
      const classMetrics = calculateClassMetrics(matrix);
      const macroMetrics = calculateMacroMetrics(classMetrics);

      this.currentClassificationMetrics = {
        precision: macroMetrics.precision,
        recall: macroMetrics.recall,
        f1: macroMetrics.f1,
      };

      // Update DOM from in-memory metrics
      if (this.elements.precisionEl) this.elements.precisionEl.textContent = (macroMetrics.precision * 100).toFixed(1) + '%';
      if (this.elements.recallEl) this.elements.recallEl.textContent = (macroMetrics.recall * 100).toFixed(1) + '%';
      if (this.elements.f1El) this.elements.f1El.textContent = (macroMetrics.f1 * 100).toFixed(1) + '%';
      if (this.elements.confusionMatrixEmpty) this.elements.confusionMatrixEmpty.classList.add('hidden');

    } catch (error) {
      if (!isModelDisposedError(error)) {
        logger.error('Failed to update classification metrics', error instanceof Error ? error : undefined);
      }
    }
  }

  /**
   * Updates speed metrics display from training history.
   */
  updateSpeedMetrics(history: TrainingHistory): void {
    const metrics = calculateSpeedMetrics(history);
    if (!metrics) return;

    if (this.elements.speedCurrent) {
      this.elements.speedCurrent.textContent = formatSpeedMetrics(metrics);
    }

    if (this.speedBaseline) {
      const comparison = compareSpeed(metrics, this.speedBaseline.metrics);
      if (this.elements.speedComparisonContainer) this.elements.speedComparisonContainer.classList.remove('hidden');
      if (this.elements.speedBaseline) this.elements.speedBaseline.textContent = formatSpeedMetrics(this.speedBaseline.metrics);
      if (this.elements.speedComparisonResult) this.elements.speedComparisonResult.textContent = comparison.description;
    }
  }

  private setupSpeedComparison(): void {
    if (this.elements.saveSpeedBaselineBtn) {
      this.elements.saveSpeedBaselineBtn.addEventListener('click', () => {
        const state = this.session.getState();
        const metrics = calculateSpeedMetrics(state.history);
        if (metrics) {
          this.speedBaseline = { name: 'Baseline', metrics, timestamp: Date.now() };
          if (this.elements.clearSpeedBaselineBtn) this.elements.clearSpeedBaselineBtn.classList.remove('hidden');
        }
      });
    }

    if (this.elements.clearSpeedBaselineBtn) {
      this.elements.clearSpeedBaselineBtn.addEventListener('click', () => {
        this.speedBaseline = null;
        if (this.elements.speedComparisonContainer) this.elements.speedComparisonContainer.classList.add('hidden');
        if (this.elements.clearSpeedBaselineBtn) this.elements.clearSpeedBaselineBtn.classList.add('hidden');
      });
    }
  }

  private setupStateSync(): void {
    this.session.onStateChange((state: TrainingState): void => {
      // Update speed metrics on every state change
      this.updateSpeedMetrics(state.history);

      // Update confusion matrix and classification metrics:
      //   - after every epoch completes (trainingStep)
      //   - on explicit pause so the user can inspect a snapshot
      //   - on natural stop (maxEpochs / early stopping / user stop)
      // NOTE: the old filter checked !state.isRunning, but isRunning maps to
      // isTraining which stays true during pause. That meant the matrix only
      // ever rendered when training completed its full epoch budget.
      const shouldUpdate =
        state.isInitialised &&
        state.datasetLoaded &&
        state.currentEpoch > 0 &&
        (state.eventType === 'trainingStep' ||
          state.eventType === 'paused' ||
          state.eventType === 'stopped');

      if (shouldUpdate) {
        void this.updateClassificationMetrics();
      }
    });
  }
}

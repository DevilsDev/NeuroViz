/**
 * Advanced Features Service
 * 
 * Handles model complexity calculations, adversarial example generation,
 * and dropout visualization coordination.
 */

import type { Point, Prediction, Hyperparameters } from '../../core/domain';
import {
  calculateModelComplexity,
  formatBytes,
  formatNumber,
  getComplexityExplanation,
  type ModelComplexityMetrics,
} from '../../core/domain/ModelComplexity';
import {
  generateSimpleAdversarial,
  type AdversarialExample,
  type AdversarialConfig,
  DEFAULT_ADVERSARIAL_CONFIG,
} from '../../core/domain/AdversarialExample';

/**
 * Service for advanced ML features
 */
export class AdvancedFeaturesService {
  private adversarialExamples: AdversarialExample[] = [];
  private currentDropoutMask: boolean[][] = [];

  /**
   * Calculates and returns model complexity metrics
   */
  calculateComplexity(
    hiddenLayers: readonly number[],
    numClasses: number,
    useBatchNorm: boolean,
    dropoutRate: number
  ): ModelComplexityMetrics {
    return calculateModelComplexity(
      2, // Input size (x, y)
      hiddenLayers,
      numClasses,
      useBatchNorm,
      dropoutRate
    );
  }

  /**
   * Updates the complexity display in the UI
   */
  updateComplexityDisplay(metrics: ModelComplexityMetrics): void {
    const paramsEl = document.getElementById('complexity-params');
    const flopsEl = document.getElementById('complexity-flops');
    const paramMemEl = document.getElementById('complexity-param-memory');
    const actMemEl = document.getElementById('complexity-activation-memory');
    const totalMemEl = document.getElementById('complexity-total-memory');
    const ratingEl = document.getElementById('complexity-rating');

    if (paramsEl) paramsEl.textContent = formatNumber(metrics.totalParameters);
    if (flopsEl) flopsEl.textContent = formatNumber(metrics.flopsPerForward);
    if (paramMemEl) paramMemEl.textContent = formatBytes(metrics.parameterMemoryBytes);
    if (actMemEl) actMemEl.textContent = formatBytes(metrics.activationMemoryBytes);
    if (totalMemEl) totalMemEl.textContent = formatBytes(metrics.totalMemoryBytes);
    if (ratingEl) ratingEl.textContent = getComplexityExplanation(metrics);
  }

  /**
   * Generates adversarial examples from the current dataset
   */
  async generateAdversarialExamples(
    data: readonly Point[],
    predictFn: (point: Point) => Promise<Prediction | null>,
    config: AdversarialConfig = DEFAULT_ADVERSARIAL_CONFIG
  ): Promise<AdversarialExample[]> {
    this.adversarialExamples = [];

    // Sample points to try (limit to avoid performance issues)
    const sampleSize = Math.min(20, data.length);
    const step = Math.max(1, Math.floor(data.length / sampleSize));
    const sampledPoints: Point[] = [];

    for (let i = 0; i < data.length && sampledPoints.length < sampleSize; i += step) {
      const point = data[i];
      if (point) sampledPoints.push(point);
    }

    // Create synchronous predict wrapper for the generation function
    const syncPredict = (p: Point): Prediction | null => {
      // We'll use a cached prediction approach
      return null; // Will be handled differently
    };

    // For each sampled point, try to generate an adversarial
    for (const point of sampledPoints) {
      const adversarial = await this.generateSingleAdversarial(point, predictFn, config);
      if (adversarial) {
        this.adversarialExamples.push(adversarial);
      }
    }

    return this.adversarialExamples;
  }

  /**
   * Generates a single adversarial example using async prediction
   */
  private async generateSingleAdversarial(
    point: Point,
    predictFn: (point: Point) => Promise<Prediction | null>,
    config: AdversarialConfig
  ): Promise<AdversarialExample | null> {
    const originalPred = await predictFn(point);
    if (!originalPred) return null;

    const originalClass = originalPred.predictedClass;

    // Try perturbations in a spiral pattern
    for (let step = 1; step <= config.numSteps; step++) {
      const radius = (step / config.numSteps) * config.maxPerturbation;

      // Try 8 directions
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;

        const perturbedPoint: Point = {
          x: point.x + dx,
          y: point.y + dy,
          label: point.label,
        };

        const perturbedPred = await predictFn(perturbedPoint);
        if (!perturbedPred) continue;

        // Check if we've crossed the decision boundary
        if (perturbedPred.predictedClass !== originalClass &&
            perturbedPred.confidence >= config.minConfidence) {
          const magnitude = Math.sqrt(dx * dx + dy * dy);

          const actualLabel = `Class ${point.label}`;
          const predictedLabel = `Class ${perturbedPred.predictedClass}`;
          const confidencePercent = Math.round(perturbedPred.confidence * 100);

          return {
            point: perturbedPoint,
            originalPoint: point,
            predictedClass: perturbedPred.predictedClass,
            confidence: perturbedPred.confidence,
            actualClass: point.label,
            perturbationMagnitude: magnitude,
            explanation: `Should be ${actualLabel}, but model predicts ${predictedLabel} with ${confidencePercent}% confidence.`,
          };
        }
      }
    }

    return null;
  }

  /**
   * Gets the current adversarial examples
   */
  getAdversarialExamples(): AdversarialExample[] {
    return this.adversarialExamples;
  }

  /**
   * Clears adversarial examples
   */
  clearAdversarialExamples(): void {
    this.adversarialExamples = [];
  }

  /**
   * Updates the adversarial examples display
   */
  updateAdversarialDisplay(): void {
    const resultsEl = document.getElementById('adversarial-results');
    const countEl = document.getElementById('adversarial-count');
    const listEl = document.getElementById('adversarial-list');
    const generateBtn = document.getElementById('btn-generate-adversarial') as HTMLButtonElement | null;

    if (this.adversarialExamples.length > 0) {
      resultsEl?.classList.remove('hidden');
      if (countEl) countEl.textContent = this.adversarialExamples.length.toString();

      if (listEl) {
        listEl.innerHTML = this.adversarialExamples.slice(0, 10).map((ex, i) => `
          <div class="p-1.5 bg-navy-900/50 rounded border-l-2 border-amber-500">
            <div class="text-amber-400 font-medium">#${i + 1}</div>
            <div class="text-slate-400">${ex.explanation}</div>
          </div>
        `).join('');
      }
    } else {
      resultsEl?.classList.add('hidden');
    }
  }

  /**
   * Generates a new dropout mask for visualization
   */
  generateDropoutMask(layers: readonly number[], dropoutRate: number): boolean[][] {
    if (dropoutRate <= 0) {
      this.currentDropoutMask = [];
      return [];
    }

    this.currentDropoutMask = layers.map(layerSize => {
      const mask: boolean[] = [];
      for (let i = 0; i < layerSize; i++) {
        mask.push(Math.random() > dropoutRate);
      }
      return mask;
    });

    return this.currentDropoutMask;
  }

  /**
   * Gets the current dropout mask
   */
  getDropoutMask(): boolean[][] {
    return this.currentDropoutMask;
  }

  /**
   * Clears the dropout mask
   */
  clearDropoutMask(): void {
    this.currentDropoutMask = [];
  }
}

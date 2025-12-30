/**
 * Advanced Features Service
 * 
 * Handles model complexity calculations, adversarial example generation,
 * and dropout visualization coordination.
 */

import type { Point, Prediction } from '../../core/domain';
import {
  calculateModelComplexity,
  formatBytes,
  formatNumber,
  getComplexityExplanation,
  type ModelComplexityMetrics,
} from '../../core/domain/ModelComplexity';
import {
  type AdversarialExample,
  type AdversarialConfig,
  DEFAULT_ADVERSARIAL_CONFIG,
} from '../../core/domain/AdversarialExample';
import { safeHTML } from '../security/htmlSanitizer';
import { generateAdversarialFGSM, type FGSMConfig } from '../../core/research/AdversarialExamples';
import type { INeuralNetworkService } from '../../core/ports';

export type AdversarialMethod = 'simple' | 'fgsm';

export interface AdversarialGenerationConfig {
  method: AdversarialMethod;
  sampleSize: number;
  simpleConfig?: AdversarialConfig;
  fgsmConfig?: FGSMConfig;
}

export const DEFAULT_GENERATION_CONFIG: AdversarialGenerationConfig = {
  method: 'simple',
  sampleSize: 20,
  simpleConfig: DEFAULT_ADVERSARIAL_CONFIG,
  fgsmConfig: { epsilon: 0.3, gradientStep: 0.01, targetClass: null, maxIterations: 10 },
};

/**
 * Service for advanced ML features
 */
export class AdvancedFeaturesService {
  private adversarialExamples: AdversarialExample[] = [];
  private currentDropoutMask: boolean[][] = [];
  private generationConfig: AdversarialGenerationConfig = { ...DEFAULT_GENERATION_CONFIG };

  /**
   * Sets the adversarial generation configuration
   */
  setGenerationConfig(config: Partial<AdversarialGenerationConfig>): void {
    this.generationConfig = { ...this.generationConfig, ...config };
  }

  /**
   * Gets the current generation configuration
   */
  getGenerationConfig(): AdversarialGenerationConfig {
    return { ...this.generationConfig };
  }

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
    model: INeuralNetworkService,
    onProgress?: (current: number, total: number, status: string) => void
  ): Promise<AdversarialExample[]> {
    this.adversarialExamples = [];

    const { method, sampleSize, simpleConfig, fgsmConfig } = this.generationConfig;

    // Sample points to try
    const actualSampleSize = Math.min(sampleSize, data.length);
    const step = Math.max(1, Math.floor(data.length / actualSampleSize));
    const sampledPoints: Point[] = [];

    for (let i = 0; i < data.length && sampledPoints.length < actualSampleSize; i += step) {
      const point = data[i];
      if (point) sampledPoints.push(point);
    }

    onProgress?.(0, sampledPoints.length, 'Starting generation...');

    if (method === 'fgsm') {
      // Use FGSM gradient-based approach
      return this.generateWithFGSM(sampledPoints, model, fgsmConfig!, onProgress);
    } else {
      // Use simple gradient-free approach
      return this.generateWithSimple(sampledPoints, model, simpleConfig!, onProgress);
    }
  }

  /**
   * Generates adversarial examples using simple gradient-free approach
   */
  private async generateWithSimple(
    points: Point[],
    model: INeuralNetworkService,
    config: AdversarialConfig,
    onProgress?: (current: number, total: number, status: string) => void
  ): Promise<AdversarialExample[]> {
    const examples: AdversarialExample[] = [];

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (!point) continue;

      onProgress?.(i, points.length, `Testing point ${i + 1}/${points.length}...`);

      // Create async predict function wrapper
      const predictFn = async (p: Point): Promise<Prediction | null> => {
        if (!model.isReady()) return null;
        const predictions = await model.predict([p]);
        return predictions[0] ?? null;
      };

      const adversarial = await this.generateSingleSimpleAdversarial(point, predictFn, config);
      if (adversarial) {
        examples.push(adversarial);
      }
    }

    this.adversarialExamples = examples;
    onProgress?.(points.length, points.length, `Found ${examples.length} adversarial examples`);
    return examples;
  }

  /**
   * Generates a single adversarial example using spiral search (async version)
   */
  private async generateSingleSimpleAdversarial(
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
   * Generates adversarial examples using FGSM gradient-based approach
   */
  private async generateWithFGSM(
    points: Point[],
    model: INeuralNetworkService,
    config: FGSMConfig,
    onProgress?: (current: number, total: number, status: string) => void
  ): Promise<AdversarialExample[]> {
    const examples: AdversarialExample[] = [];

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (!point) continue;

      onProgress?.(i, points.length, `FGSM attack ${i + 1}/${points.length}...`);

      try {
        const result = await generateAdversarialFGSM(model, point, config);

        if (result.success) {
          // Convert FGSM result to AdversarialExample format
          const magnitude = Math.sqrt(result.perturbation.dx ** 2 + result.perturbation.dy ** 2);
          const actualLabel = `Class ${point.label}`;
          const predictedLabel = `Class ${result.adversarialPrediction.predictedClass}`;
          const confidencePercent = Math.round(result.adversarialPrediction.confidence * 100);

          examples.push({
            point: result.adversarial,
            originalPoint: result.original,
            predictedClass: result.adversarialPrediction.predictedClass,
            confidence: result.adversarialPrediction.confidence,
            actualClass: point.label,
            perturbationMagnitude: magnitude,
            explanation: `Should be ${actualLabel}, but model predicts ${predictedLabel} with ${confidencePercent}% confidence (FGSM).`,
          });
        }
      } catch (error) {
        console.error(`FGSM failed for point ${i}:`, error);
      }
    }

    this.adversarialExamples = examples;
    onProgress?.(points.length, points.length, `Found ${examples.length} adversarial examples (FGSM)`);
    return examples;
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
    if (this.adversarialExamples.length > 0) {
      resultsEl?.classList.remove('hidden');
      if (countEl) countEl.textContent = this.adversarialExamples.length.toString();

      if (listEl) {
        listEl.innerHTML = this.adversarialExamples.slice(0, 10).map((ex, i) => safeHTML`
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

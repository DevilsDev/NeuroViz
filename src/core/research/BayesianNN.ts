/**
 * Bayesian Neural Network Approximation
 * 
 * Implements Monte Carlo Dropout for uncertainty quantification.
 * Uses dropout at inference time to approximate Bayesian inference.
 */

import type { Point, Prediction } from '../domain';
import type { INeuralNetworkService } from '../ports';

export interface UncertaintyResult {
  /** Point being evaluated */
  point: Point;
  /** Mean predicted class */
  predictedClass: number;
  /** Mean confidence */
  meanConfidence: number;
  /** Epistemic uncertainty (model uncertainty) */
  epistemicUncertainty: number;
  /** Aleatoric uncertainty (data uncertainty) */
  aleatoricUncertainty: number;
  /** Total uncertainty */
  totalUncertainty: number;
  /** Confidence interval (95%) */
  confidenceInterval: { lower: number; upper: number };
  /** Individual predictions from MC samples */
  samples: Prediction[];
}

export interface UncertaintyMapResult {
  /** Grid of uncertainty values */
  grid: UncertaintyCell[][];
  /** Maximum uncertainty for normalization */
  maxUncertainty: number;
  /** Resolution */
  resolution: number;
  /** Bounds */
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

export interface UncertaintyCell {
  x: number;
  y: number;
  predictedClass: number;
  meanConfidence: number;
  uncertainty: number;
}

export interface MCDropoutConfig {
  /** Number of forward passes */
  numSamples: number;
  /** Dropout rate (if model supports it) */
  dropoutRate: number;
}

/**
 * Estimates prediction uncertainty using Monte Carlo Dropout.
 * 
 * Since we can't directly enable dropout at inference in TensorFlow.js,
 * we simulate uncertainty by adding small noise to inputs and aggregating.
 */
export async function estimateUncertainty(
  model: INeuralNetworkService,
  point: Point,
  config: MCDropoutConfig = { numSamples: 30, dropoutRate: 0.1 }
): Promise<UncertaintyResult> {
  const { numSamples, dropoutRate } = config;
  const samples: Prediction[] = [];

  // Generate noisy samples to simulate epistemic uncertainty
  const noisyPoints: Point[] = [];
  for (let i = 0; i < numSamples; i++) {
    // Add small Gaussian noise to simulate dropout effect
    const noiseScale = dropoutRate * 0.5;
    noisyPoints.push({
      x: point.x + gaussianNoise() * noiseScale,
      y: point.y + gaussianNoise() * noiseScale,
      label: point.label,
    });
  }

  // Get predictions for all noisy samples
  const predictions = await model.predict(noisyPoints);
  samples.push(...predictions);

  // Also get clean prediction
  const cleanPredictions = await model.predict([point]);
  const cleanPred = cleanPredictions[0];

  // Calculate statistics
  const confidences = samples.map(p => p.confidence);
  const classes = samples.map(p => p.predictedClass);

  // Mean confidence
  const meanConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

  // Variance of confidence (epistemic uncertainty)
  const variance = confidences.reduce((sum, c) => sum + Math.pow(c - meanConfidence, 2), 0) / confidences.length;
  const epistemicUncertainty = Math.sqrt(variance);

  // Entropy of class predictions (aleatoric uncertainty)
  const classCounts = new Map<number, number>();
  for (const c of classes) {
    classCounts.set(c, (classCounts.get(c) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of classCounts.values()) {
    const p = count / classes.length;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  const aleatoricUncertainty = entropy;

  // Total uncertainty
  const totalUncertainty = Math.sqrt(epistemicUncertainty ** 2 + aleatoricUncertainty ** 2);

  // Confidence interval (95%)
  const sortedConf = [...confidences].sort((a, b) => a - b);
  const lowerIdx = Math.floor(0.025 * sortedConf.length);
  const upperIdx = Math.floor(0.975 * sortedConf.length);
  const confidenceInterval = {
    lower: sortedConf[lowerIdx] ?? 0,
    upper: sortedConf[upperIdx] ?? 1,
  };

  // Most common predicted class
  let maxCount = 0;
  let predictedClass = cleanPred?.predictedClass ?? 0;
  for (const [cls, count] of classCounts) {
    if (count > maxCount) {
      maxCount = count;
      predictedClass = cls;
    }
  }

  return {
    point,
    predictedClass,
    meanConfidence,
    epistemicUncertainty,
    aleatoricUncertainty,
    totalUncertainty,
    confidenceInterval,
    samples,
  };
}

/**
 * Generates Gaussian noise using Box-Muller transform.
 */
function gaussianNoise(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Computes uncertainty map over a grid.
 */
export async function computeUncertaintyMap(
  model: INeuralNetworkService,
  config: MCDropoutConfig = { numSamples: 10, dropoutRate: 0.1 },
  resolution: number = 20,
  bounds = { minX: -6, maxX: 6, minY: -6, maxY: 6 },
  onProgress?: (current: number, total: number) => void
): Promise<UncertaintyMapResult> {
  const { minX, maxX, minY, maxY } = bounds;
  const stepX = (maxX - minX) / resolution;
  const stepY = (maxY - minY) / resolution;

  const grid: UncertaintyCell[][] = [];
  let maxUncertainty = 0;
  const total = resolution * resolution;
  let current = 0;

  for (let i = 0; i < resolution; i++) {
    const row: UncertaintyCell[] = [];

    for (let j = 0; j < resolution; j++) {
      const x = minX + (i + 0.5) * stepX;
      const y = minY + (j + 0.5) * stepY;

      const result = await estimateUncertainty(model, { x, y, label: 0 }, config);

      row.push({
        x,
        y,
        predictedClass: result.predictedClass,
        meanConfidence: result.meanConfidence,
        uncertainty: result.totalUncertainty,
      });

      maxUncertainty = Math.max(maxUncertainty, result.totalUncertainty);
      current++;
      onProgress?.(current, total);
    }

    grid.push(row);
  }

  return { grid, maxUncertainty, resolution, bounds };
}

/**
 * Formats uncertainty result as HTML.
 */
export function formatUncertaintyHTML(result: UncertaintyResult): string {
  const {
    point,
    predictedClass,
    meanConfidence,
    epistemicUncertainty,
    aleatoricUncertainty,
    totalUncertainty,
    confidenceInterval,
  } = result;

  const uncertaintyLevel = totalUncertainty < 0.2 ? 'Low' : totalUncertainty < 0.5 ? 'Medium' : 'High';
  const uncertaintyColor = totalUncertainty < 0.2 ? 'text-emerald-400' : totalUncertainty < 0.5 ? 'text-amber-400' : 'text-red-400';

  return `
    <div class="text-xs space-y-2">
      <div class="flex justify-between">
        <span class="text-slate-400">Point:</span>
        <span>(${point.x.toFixed(2)}, ${point.y.toFixed(2)})</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Predicted Class:</span>
        <span class="text-emerald-400">${predictedClass}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Mean Confidence:</span>
        <span>${(meanConfidence * 100).toFixed(1)}%</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">95% CI:</span>
        <span>[${(confidenceInterval.lower * 100).toFixed(0)}%, ${(confidenceInterval.upper * 100).toFixed(0)}%]</span>
      </div>
      <div class="border-t border-navy-600 pt-2 mt-2">
        <div class="flex justify-between">
          <span class="text-slate-400">Epistemic (Model):</span>
          <span>${epistemicUncertainty.toFixed(3)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Aleatoric (Data):</span>
          <span>${aleatoricUncertainty.toFixed(3)}</span>
        </div>
        <div class="flex justify-between font-medium">
          <span class="text-slate-400">Total Uncertainty:</span>
          <span class="${uncertaintyColor}">${uncertaintyLevel} (${totalUncertainty.toFixed(3)})</span>
        </div>
      </div>
    </div>
  `;
}

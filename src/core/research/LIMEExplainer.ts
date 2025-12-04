/**
 * LIME-style Local Explanations
 * 
 * Implements Local Interpretable Model-agnostic Explanations (LIME)
 * to explain individual predictions by fitting a simple linear model
 * to the local neighborhood of a point.
 */

import type { Point } from '../domain';
import type { INeuralNetworkService } from '../ports';

export interface LIMEExplanation {
  /** The point being explained */
  point: Point;
  /** Predicted class for this point */
  predictedClass: number;
  /** Confidence of the prediction */
  confidence: number;
  /** Feature contributions to the prediction */
  contributions: FeatureContribution[];
  /** Local fidelity (how well the linear model fits locally) */
  localFidelity: number;
  /** Intercept of the local linear model */
  intercept: number;
}

export interface FeatureContribution {
  featureName: string;
  featureValue: number;
  contribution: number;
  weight: number;
}

export interface LIMEConfig {
  /** Number of samples to generate around the point */
  numSamples: number;
  /** Kernel width for weighting samples */
  kernelWidth: number;
  /** Feature names */
  featureNames: string[];
}

/**
 * Generates LIME explanations for a prediction.
 */
export async function explainPrediction(
  model: INeuralNetworkService,
  point: Point,
  config: LIMEConfig = { numSamples: 100, kernelWidth: 0.75, featureNames: ['X', 'Y'] }
): Promise<LIMEExplanation> {
  const { numSamples, kernelWidth, featureNames } = config;

  // Get the original prediction
  const originalPredictions = await model.predict([point]);
  const originalPrediction = originalPredictions[0];
  if (!originalPrediction) {
    throw new Error('Failed to get prediction for point');
  }

  // Generate perturbed samples around the point
  const samples: Point[] = [];
  const distances: number[] = [];

  for (let i = 0; i < numSamples; i++) {
    const perturbedX = point.x + (Math.random() - 0.5) * 2 * kernelWidth;
    const perturbedY = point.y + (Math.random() - 0.5) * 2 * kernelWidth;
    
    samples.push({ x: perturbedX, y: perturbedY, label: 0 });
    
    // Calculate distance from original point
    const dist = Math.sqrt(Math.pow(perturbedX - point.x, 2) + Math.pow(perturbedY - point.y, 2));
    distances.push(dist);
  }

  // Get predictions for all samples
  const samplePredictions = await model.predict(samples);

  // Calculate kernel weights (closer samples have higher weight)
  const weights = distances.map(d => Math.exp(-Math.pow(d / kernelWidth, 2)));

  // Prepare data for weighted linear regression
  // X matrix: [1, x, y] for each sample (with intercept)
  // y vector: prediction confidence for target class
  const targetClass = originalPrediction.predictedClass;
  
  const X: number[][] = samples.map(s => [1, s.x, s.y]);
  const y: number[] = samplePredictions.map(p => {
    if (p.probabilities && p.probabilities.length > targetClass) {
      return p.probabilities[targetClass] ?? p.confidence;
    }
    return p.predictedClass === targetClass ? p.confidence : 1 - p.confidence;
  });

  // Weighted least squares: (X'WX)^-1 X'Wy
  const coefficients = weightedLinearRegression(X, y, weights);

  // Extract feature contributions
  const contributions: FeatureContribution[] = [
    {
      featureName: featureNames[0] ?? 'X',
      featureValue: point.x,
      weight: coefficients[1] ?? 0,
      contribution: (coefficients[1] ?? 0) * point.x,
    },
    {
      featureName: featureNames[1] ?? 'Y',
      featureValue: point.y,
      weight: coefficients[2] ?? 0,
      contribution: (coefficients[2] ?? 0) * point.y,
    },
  ];

  // Calculate local fidelity (R² on weighted samples)
  const yPred = X.map(row => 
    row.reduce((sum, val, i) => sum + val * (coefficients[i] ?? 0), 0)
  );
  const localFidelity = calculateWeightedR2(y, yPred, weights);

  return {
    point,
    predictedClass: originalPrediction.predictedClass,
    confidence: originalPrediction.confidence,
    contributions,
    localFidelity,
    intercept: coefficients[0] ?? 0,
  };
}

/**
 * Performs weighted linear regression using normal equations.
 */
function weightedLinearRegression(X: number[][], y: number[], weights: number[]): number[] {
  const n = X.length;
  const p = X[0]?.length ?? 0;

  if (n === 0 || p === 0) return Array(p).fill(0);

  // Create diagonal weight matrix
  const W = weights;

  // X'WX
  const XtWX: number[][] = Array(p).fill(null).map(() => Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += (X[k]?.[i] ?? 0) * (W[k] ?? 0) * (X[k]?.[j] ?? 0);
      }
      XtWX[i]![j] = sum;
    }
  }

  // X'Wy
  const XtWy: number[] = Array(p).fill(0);
  for (let i = 0; i < p; i++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += (X[k]?.[i] ?? 0) * (W[k] ?? 0) * (y[k] ?? 0);
    }
    XtWy[i] = sum;
  }

  // Solve using simple matrix inversion (for 3x3)
  const coefficients = solveLinearSystem(XtWX, XtWy);
  
  return coefficients;
}

/**
 * Solves a small linear system Ax = b using Gaussian elimination.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  
  // Create augmented matrix
  const aug: number[][] = A.map((row, i) => [...row, b[i] ?? 0]);

  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k]?.[i] ?? 0) > Math.abs(aug[maxRow]?.[i] ?? 0)) {
        maxRow = k;
      }
    }
    const temp = aug[i];
    aug[i] = aug[maxRow]!;
    aug[maxRow] = temp!;

    // Eliminate column
    for (let k = i + 1; k < n; k++) {
      const pivot = aug[i]?.[i] ?? 1;
      const factor = pivot !== 0 ? (aug[k]?.[i] ?? 0) / pivot : 0;
      for (let j = i; j <= n; j++) {
        if (aug[k] && aug[i]) {
          aug[k]![j] = (aug[k]![j] ?? 0) - factor * (aug[i]![j] ?? 0);
        }
      }
    }
  }

  // Back substitution
  const x: number[] = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i]?.[n] ?? 0;
    for (let j = i + 1; j < n; j++) {
      sum -= (aug[i]?.[j] ?? 0) * (x[j] ?? 0);
    }
    const pivot = aug[i]?.[i] ?? 1;
    x[i] = pivot !== 0 ? sum / pivot : 0;
  }

  return x;
}

/**
 * Calculates weighted R² (coefficient of determination).
 */
function calculateWeightedR2(yTrue: number[], yPred: number[], weights: number[]): number {
  const n = yTrue.length;
  if (n === 0) return 0;

  // Weighted mean of y
  let sumW = 0;
  let sumWY = 0;
  for (let i = 0; i < n; i++) {
    sumW += weights[i] ?? 0;
    sumWY += (weights[i] ?? 0) * (yTrue[i] ?? 0);
  }
  const yMean = sumW > 0 ? sumWY / sumW : 0;

  // SS_res and SS_tot
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const w = weights[i] ?? 0;
    const yt = yTrue[i] ?? 0;
    const yp = yPred[i] ?? 0;
    ssRes += w * Math.pow(yt - yp, 2);
    ssTot += w * Math.pow(yt - yMean, 2);
  }

  return ssTot > 0 ? 1 - ssRes / ssTot : 0;
}

/**
 * Escapes HTML special characters to prevent XSS attacks.
 */
function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Formats LIME explanation as HTML.
 */
export function formatLIMEExplanationHTML(explanation: LIMEExplanation): string {
  const { point, predictedClass, confidence, contributions, localFidelity } = explanation;

  const maxContrib = Math.max(...contributions.map(c => Math.abs(c.contribution)), 0.01);

  const contribRows = contributions.map(c => {
    const barWidth = Math.abs(c.contribution) / maxContrib * 100;
    const barColor = c.contribution > 0 ? 'bg-emerald-500' : 'bg-red-500';
    const sign = c.contribution >= 0 ? '+' : '';

    return `
      <div class="mb-2">
        <div class="flex justify-between text-xs mb-1">
          <span class="font-medium">${escapeHTML(c.featureName)} = ${c.featureValue.toFixed(2)}</span>
          <span class="text-slate-400">${sign}${c.contribution.toFixed(3)}</span>
        </div>
        <div class="h-2 bg-navy-700 rounded overflow-hidden">
          <div class="${barColor} h-full rounded" style="width: ${barWidth}%"></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="text-xs mb-3">
      <div class="flex justify-between mb-1">
        <span class="text-slate-400">Point:</span>
        <span>(${point.x.toFixed(2)}, ${point.y.toFixed(2)})</span>
      </div>
      <div class="flex justify-between mb-1">
        <span class="text-slate-400">Predicted:</span>
        <span class="text-emerald-400">Class ${predictedClass} (${(confidence * 100).toFixed(0)}%)</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Local Fidelity:</span>
        <span class="${localFidelity > 0.7 ? 'text-emerald-400' : 'text-amber-400'}">${(localFidelity * 100).toFixed(0)}%</span>
      </div>
    </div>
    <div class="text-xs text-slate-400 mb-2">Feature Contributions:</div>
    ${contribRows}
    <div class="text-xs text-slate-500 mt-2">
      Green = pushes toward this class. Red = pushes away.
    </div>
  `;
}

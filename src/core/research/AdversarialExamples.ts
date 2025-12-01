/**
 * Adversarial Examples Generator
 * 
 * Implements Fast Gradient Sign Method (FGSM) to generate adversarial examples
 * that fool the neural network.
 */

import type { Point, Prediction } from '../domain';
import type { INeuralNetworkService } from '../ports';

export interface AdversarialResult {
  /** Original point */
  original: Point;
  /** Adversarial point */
  adversarial: Point;
  /** Original prediction */
  originalPrediction: Prediction;
  /** Adversarial prediction */
  adversarialPrediction: Prediction;
  /** Perturbation applied */
  perturbation: { dx: number; dy: number };
  /** Epsilon used */
  epsilon: number;
  /** Whether the attack succeeded (changed prediction) */
  success: boolean;
}

export interface FGSMConfig {
  /** Perturbation magnitude */
  epsilon: number;
  /** Step size for gradient estimation */
  gradientStep: number;
  /** Target class (null = untargeted attack) */
  targetClass: number | null;
  /** Maximum iterations for targeted attack */
  maxIterations: number;
}

/**
 * Generates an adversarial example using FGSM.
 * 
 * FGSM perturbs the input in the direction of the gradient of the loss
 * with respect to the input, scaled by epsilon.
 */
export async function generateAdversarialFGSM(
  model: INeuralNetworkService,
  point: Point,
  config: FGSMConfig = { epsilon: 0.3, gradientStep: 0.01, targetClass: null, maxIterations: 10 }
): Promise<AdversarialResult> {
  const { epsilon, gradientStep, targetClass, maxIterations } = config;

  // Get original prediction
  const originalPredictions = await model.predict([point]);
  const originalPrediction = originalPredictions[0];
  if (!originalPrediction) {
    throw new Error('Failed to get original prediction');
  }

  // Compute gradient direction
  const gradient = await computeInputGradient(model, point, gradientStep, targetClass);

  // Apply FGSM perturbation
  let dx: number;
  let dy: number;

  if (targetClass === null) {
    // Untargeted: move in direction that increases loss (decreases confidence)
    dx = epsilon * Math.sign(gradient.gradX);
    dy = epsilon * Math.sign(gradient.gradY);
  } else {
    // Targeted: move toward target class (negative gradient)
    dx = -epsilon * Math.sign(gradient.gradX);
    dy = -epsilon * Math.sign(gradient.gradY);
  }

  // Create adversarial point
  let adversarialPoint: Point = {
    x: point.x + dx,
    y: point.y + dy,
    label: point.label,
  };

  // For targeted attacks, iterate to improve success rate
  if (targetClass !== null) {
    for (let iter = 0; iter < maxIterations; iter++) {
      const preds = await model.predict([adversarialPoint]);
      if (preds[0]?.predictedClass === targetClass) {
        break;
      }

      // Compute gradient at current adversarial point
      const iterGradient = await computeInputGradient(
        model, adversarialPoint, gradientStep, targetClass
      );

      // Update with smaller step
      const stepEpsilon = epsilon / (iter + 2);
      adversarialPoint = {
        x: adversarialPoint.x - stepEpsilon * Math.sign(iterGradient.gradX),
        y: adversarialPoint.y - stepEpsilon * Math.sign(iterGradient.gradY),
        label: point.label,
      };
    }

    // Recalculate total perturbation
    dx = adversarialPoint.x - point.x;
    dy = adversarialPoint.y - point.y;
  }

  // Get adversarial prediction
  const adversarialPredictions = await model.predict([adversarialPoint]);
  const adversarialPrediction = adversarialPredictions[0];
  if (!adversarialPrediction) {
    throw new Error('Failed to get adversarial prediction');
  }

  // Check if attack succeeded
  const success = targetClass !== null
    ? adversarialPrediction.predictedClass === targetClass
    : adversarialPrediction.predictedClass !== originalPrediction.predictedClass;

  return {
    original: point,
    adversarial: adversarialPoint,
    originalPrediction,
    adversarialPrediction,
    perturbation: { dx, dy },
    epsilon,
    success,
  };
}

/**
 * Computes numerical gradient of output with respect to input.
 */
async function computeInputGradient(
  model: INeuralNetworkService,
  point: Point,
  step: number,
  targetClass: number | null
): Promise<{ gradX: number; gradY: number }> {
  // Create points for finite difference
  const points: Point[] = [
    { x: point.x + step, y: point.y, label: 0 },
    { x: point.x - step, y: point.y, label: 0 },
    { x: point.x, y: point.y + step, label: 0 },
    { x: point.x, y: point.y - step, label: 0 },
  ];

  const predictions = await model.predict(points);

  const getScore = (pred: Prediction | undefined, tc: number | null): number => {
    if (!pred) return 0;
    if (tc === null) {
      // For untargeted, use confidence of predicted class
      return pred.confidence;
    }
    // For targeted, use probability of target class
    if (pred.probabilities && pred.probabilities.length > tc) {
      return pred.probabilities[tc] ?? 0;
    }
    return pred.predictedClass === tc ? pred.confidence : 0;
  };

  const tc = targetClass;
  const fXPlus = getScore(predictions[0], tc);
  const fXMinus = getScore(predictions[1], tc);
  const fYPlus = getScore(predictions[2], tc);
  const fYMinus = getScore(predictions[3], tc);

  return {
    gradX: (fXPlus - fXMinus) / (2 * step),
    gradY: (fYPlus - fYMinus) / (2 * step),
  };
}

/**
 * Generates multiple adversarial examples for a dataset.
 */
export async function generateAdversarialBatch(
  model: INeuralNetworkService,
  points: Point[],
  config: FGSMConfig = { epsilon: 0.3, gradientStep: 0.01, targetClass: null, maxIterations: 10 },
  onProgress?: (current: number, total: number) => void
): Promise<AdversarialResult[]> {
  const results: AdversarialResult[] = [];

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (!point) continue;

    try {
      const result = await generateAdversarialFGSM(model, point, config);
      results.push(result);
    } catch (error) {
      console.error(`Failed to generate adversarial for point ${i}:`, error);
    }

    onProgress?.(i + 1, points.length);
  }

  return results;
}

/**
 * Calculates adversarial robustness metrics.
 */
export function calculateRobustnessMetrics(results: AdversarialResult[]): {
  attackSuccessRate: number;
  averagePerturbation: number;
  robustnessScore: number;
} {
  if (results.length === 0) {
    return { attackSuccessRate: 0, averagePerturbation: 0, robustnessScore: 1 };
  }

  const successCount = results.filter(r => r.success).length;
  const attackSuccessRate = successCount / results.length;

  const perturbations = results.map(r => 
    Math.sqrt(r.perturbation.dx ** 2 + r.perturbation.dy ** 2)
  );
  const averagePerturbation = perturbations.reduce((a, b) => a + b, 0) / perturbations.length;

  // Robustness score: 1 - success rate, weighted by perturbation size
  const robustnessScore = 1 - attackSuccessRate * (1 / (1 + averagePerturbation));

  return { attackSuccessRate, averagePerturbation, robustnessScore };
}

/**
 * Formats adversarial result as HTML.
 */
export function formatAdversarialResultHTML(result: AdversarialResult): string {
  const { original, adversarial, originalPrediction, adversarialPrediction, perturbation, success } = result;

  const perturbMagnitude = Math.sqrt(perturbation.dx ** 2 + perturbation.dy ** 2);

  return `
    <div class="text-xs space-y-2">
      <div class="grid grid-cols-2 gap-2">
        <div class="p-2 bg-navy-800 rounded">
          <div class="text-slate-400 mb-1">Original</div>
          <div>(${original.x.toFixed(2)}, ${original.y.toFixed(2)})</div>
          <div class="text-emerald-400">Class ${originalPrediction.predictedClass}</div>
          <div class="text-slate-500">${(originalPrediction.confidence * 100).toFixed(0)}% conf</div>
        </div>
        <div class="p-2 bg-navy-800 rounded">
          <div class="text-slate-400 mb-1">Adversarial</div>
          <div>(${adversarial.x.toFixed(2)}, ${adversarial.y.toFixed(2)})</div>
          <div class="${success ? 'text-red-400' : 'text-emerald-400'}">Class ${adversarialPrediction.predictedClass}</div>
          <div class="text-slate-500">${(adversarialPrediction.confidence * 100).toFixed(0)}% conf</div>
        </div>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Perturbation:</span>
        <span>${perturbMagnitude.toFixed(3)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">Attack:</span>
        <span class="${success ? 'text-red-400' : 'text-emerald-400'}">${success ? 'Succeeded' : 'Failed'}</span>
      </div>
    </div>
  `;
}

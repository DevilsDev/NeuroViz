/**
 * Adversarial Examples Domain
 * 
 * Defines types and utilities for generating and displaying
 * adversarial examples that fool the model.
 */

import type { Point } from './Point';
import type { Prediction } from './Prediction';

/**
 * An adversarial example - a point that fools the model
 */
export interface AdversarialExample {
  /** The adversarial point */
  point: Point;
  /** Original point it was derived from (if any) */
  originalPoint?: Point;
  /** What the model predicts for this point */
  predictedClass: number;
  /** Model's confidence in its (wrong) prediction */
  confidence: number;
  /** The actual/intended class */
  actualClass: number;
  /** Perturbation magnitude (distance from original) */
  perturbationMagnitude: number;
  /** Human-readable explanation */
  explanation: string;
}

/**
 * Configuration for adversarial example generation
 */
export interface AdversarialConfig {
  /** Maximum perturbation magnitude */
  maxPerturbation: number;
  /** Number of steps for iterative methods */
  numSteps: number;
  /** Step size for gradient-based methods */
  stepSize: number;
  /** Minimum confidence for adversarial to be considered successful */
  minConfidence: number;
}

/**
 * Default adversarial generation config
 */
export const DEFAULT_ADVERSARIAL_CONFIG: AdversarialConfig = {
  maxPerturbation: 0.3,
  numSteps: 10,
  stepSize: 0.05,
  minConfidence: 0.5,
};

/**
 * Result of adversarial generation attempt
 */
export interface AdversarialGenerationResult {
  /** Successfully generated adversarial examples */
  examples: AdversarialExample[];
  /** Points that couldn't be made adversarial */
  failedPoints: Point[];
  /** Statistics about the generation */
  stats: {
    attempted: number;
    successful: number;
    averagePerturbation: number;
    averageConfidence: number;
  };
}

/**
 * Generates explanation text for an adversarial example
 */
export function generateAdversarialExplanation(
  example: AdversarialExample,
  classLabels?: string[]
): string {
  const actualLabel = classLabels?.[example.actualClass] ?? `Class ${example.actualClass}`;
  const predictedLabel = classLabels?.[example.predictedClass] ?? `Class ${example.predictedClass}`;
  const confidencePercent = Math.round(example.confidence * 100);
  const perturbPercent = Math.round(example.perturbationMagnitude * 100);

  return `This point should be ${actualLabel}, but the model predicts ${predictedLabel} with ${confidencePercent}% confidence. Only ${perturbPercent}% perturbation was needed to fool it.`;
}

/**
 * Calculates Euclidean distance between two points
 */
export function pointDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Creates a perturbed version of a point
 */
export function perturbPoint(
  point: Point,
  dx: number,
  dy: number,
  targetLabel?: number
): Point {
  return {
    x: point.x + dx,
    y: point.y + dy,
    label: targetLabel ?? point.label,
  };
}

/**
 * Finds points near the decision boundary that could be adversarial
 * Uses a simple grid search approach (gradient-free)
 */
export function findBoundaryPoints(
  predictions: Prediction[],
  _gridSize: number
): Point[] {
  const boundaryPoints: Point[] = [];

  // Find points where nearby predictions differ
  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i];
    if (!pred) continue;

    // Check if this point is near a decision boundary
    // by looking at confidence (low confidence = near boundary)
    if (pred.confidence < 0.7 && pred.confidence > 0.3) {
      boundaryPoints.push({
        x: pred.x,
        y: pred.y,
        label: pred.predictedClass,
      });
    }
  }

  return boundaryPoints;
}

/**
 * Simple adversarial generation using random perturbations
 * (Gradient-free approach suitable for educational purposes)
 */
export function generateSimpleAdversarial(
  point: Point,
  predict: (p: Point) => Prediction | null,
  config: AdversarialConfig = DEFAULT_ADVERSARIAL_CONFIG
): AdversarialExample | null {
  const originalPred = predict(point);
  if (!originalPred) return null;

  const originalClass = originalPred.predictedClass;

  // Try random perturbations in a spiral pattern
  for (let step = 1; step <= config.numSteps; step++) {
    const radius = (step / config.numSteps) * config.maxPerturbation;

    // Try 8 directions
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;

      const perturbedPoint = perturbPoint(point, dx, dy, point.label);
      const perturbedPred = predict(perturbedPoint);

      if (!perturbedPred) continue;

      // Check if we've crossed the decision boundary
      if (perturbedPred.predictedClass !== originalClass &&
          perturbedPred.confidence >= config.minConfidence) {
        const magnitude = pointDistance(point, perturbedPoint);

        return {
          point: perturbedPoint,
          originalPoint: point,
          predictedClass: perturbedPred.predictedClass,
          confidence: perturbedPred.confidence,
          actualClass: point.label,
          perturbationMagnitude: magnitude,
          explanation: generateAdversarialExplanation({
            point: perturbedPoint,
            predictedClass: perturbedPred.predictedClass,
            confidence: perturbedPred.confidence,
            actualClass: point.label,
            perturbationMagnitude: magnitude,
            explanation: '',
          }),
        };
      }
    }
  }

  return null;
}

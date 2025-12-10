/**
 * Adversarial Example Domain Tests
 */

import { describe, it, expect } from 'vitest';
import {
  pointDistance,
  perturbPoint,
  generateAdversarialExplanation,
  DEFAULT_ADVERSARIAL_CONFIG,
} from '../../../src/core/domain/AdversarialExample';
import type { AdversarialExample } from '../../../src/core/domain/AdversarialExample';

describe('Adversarial Examples', () => {
  describe('pointDistance', () => {
    it('should calculate Euclidean distance correctly', () => {
      const p1 = { x: 0, y: 0, label: 0 };
      const p2 = { x: 3, y: 4, label: 1 };

      expect(pointDistance(p1, p2)).toBe(5);
    });

    it('should return 0 for same point', () => {
      const p = { x: 1, y: 2, label: 0 };

      expect(pointDistance(p, p)).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const p1 = { x: -1, y: -1, label: 0 };
      const p2 = { x: 1, y: 1, label: 1 };

      expect(pointDistance(p1, p2)).toBeCloseTo(Math.sqrt(8));
    });
  });

  describe('perturbPoint', () => {
    it('should create perturbed point with offset', () => {
      const original = { x: 0.5, y: 0.5, label: 0 };
      const perturbed = perturbPoint(original, 0.1, -0.1);

      expect(perturbed.x).toBeCloseTo(0.6);
      expect(perturbed.y).toBeCloseTo(0.4);
      expect(perturbed.label).toBe(0);
    });

    it('should allow overriding label', () => {
      const original = { x: 0, y: 0, label: 0 };
      const perturbed = perturbPoint(original, 0, 0, 1);

      expect(perturbed.label).toBe(1);
    });
  });

  describe('generateAdversarialExplanation', () => {
    it('should generate readable explanation', () => {
      const example: AdversarialExample = {
        point: { x: 0.5, y: 0.5, label: 0 },
        originalPoint: { x: 0.4, y: 0.4, label: 0 },
        predictedClass: 1,
        confidence: 0.85,
        actualClass: 0,
        perturbationMagnitude: 0.14,
        explanation: '',
      };

      const explanation = generateAdversarialExplanation(example);

      expect(explanation).toContain('Class 0');
      expect(explanation).toContain('Class 1');
      expect(explanation).toContain('85%');
      expect(explanation).toContain('14%');
    });

    it('should use custom class labels if provided', () => {
      const example: AdversarialExample = {
        point: { x: 0, y: 0, label: 0 },
        predictedClass: 1,
        confidence: 0.9,
        actualClass: 0,
        perturbationMagnitude: 0.1,
        explanation: '',
      };

      const explanation = generateAdversarialExplanation(example, ['Cat', 'Dog']);

      expect(explanation).toContain('Cat');
      expect(explanation).toContain('Dog');
    });
  });

  describe('DEFAULT_ADVERSARIAL_CONFIG', () => {
    it('should have reasonable default values', () => {
      expect(DEFAULT_ADVERSARIAL_CONFIG.maxPerturbation).toBeGreaterThan(0);
      expect(DEFAULT_ADVERSARIAL_CONFIG.maxPerturbation).toBeLessThan(1);
      expect(DEFAULT_ADVERSARIAL_CONFIG.numSteps).toBeGreaterThan(0);
      expect(DEFAULT_ADVERSARIAL_CONFIG.stepSize).toBeGreaterThan(0);
      expect(DEFAULT_ADVERSARIAL_CONFIG.minConfidence).toBeGreaterThanOrEqual(0.5);
    });
  });
});

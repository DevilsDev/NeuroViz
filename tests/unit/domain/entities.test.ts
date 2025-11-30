import { describe, it, expect } from 'vitest';
import type { Point, Prediction, Hyperparameters } from '../../../src/core/domain';

/**
 * Domain Entity Tests
 *
 * Verifies that domain entities conform to their contracts
 * and maintain immutability guarantees.
 */

describe('Domain Entities', () => {
  describe('Point', () => {
    it('should create a valid Point with required properties', () => {
      const point: Point = { x: 0.5, y: -0.3, label: 1 };

      expect(point.x).toBe(0.5);
      expect(point.y).toBe(-0.3);
      expect(point.label).toBe(1);
    });

    it('should support negative coordinates', () => {
      const point: Point = { x: -1, y: -1, label: 0 };

      expect(point.x).toBe(-1);
      expect(point.y).toBe(-1);
    });

    it('should support binary classification labels (0 and 1)', () => {
      const point0: Point = { x: 0, y: 0, label: 0 };
      const point1: Point = { x: 1, y: 1, label: 1 };

      expect(point0.label).toBe(0);
      expect(point1.label).toBe(1);
    });

    it('should be usable in arrays for dataset representation', () => {
      const dataset: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
        { x: -0.5, y: 0.5, label: 0 },
      ];

      expect(dataset).toHaveLength(3);
      expect(dataset.every((p) => 'x' in p && 'y' in p && 'label' in p)).toBe(true);
    });

    it('should preserve readonly semantics at compile time', () => {
      // This test documents the readonly contract
      // TypeScript will prevent: point.x = 1; at compile time
      const point: Point = { x: 0, y: 0, label: 0 };

      // Verify the object structure is correct
      expect(Object.keys(point)).toEqual(['x', 'y', 'label']);
    });
  });

  describe('Prediction', () => {
    it('should create a valid Prediction with required properties', () => {
      const prediction: Prediction = { x: 0.5, y: 0.5, confidence: 0.85 };

      expect(prediction.x).toBe(0.5);
      expect(prediction.y).toBe(0.5);
      expect(prediction.confidence).toBe(0.85);
    });

    it('should support confidence values between 0 and 1', () => {
      const lowConfidence: Prediction = { x: 0, y: 0, confidence: 0.1 };
      const highConfidence: Prediction = { x: 0, y: 0, confidence: 0.99 };

      expect(lowConfidence.confidence).toBeGreaterThanOrEqual(0);
      expect(highConfidence.confidence).toBeLessThanOrEqual(1);
    });

    it('should support boundary confidence values', () => {
      const minConfidence: Prediction = { x: 0, y: 0, confidence: 0 };
      const maxConfidence: Prediction = { x: 0, y: 0, confidence: 1 };

      expect(minConfidence.confidence).toBe(0);
      expect(maxConfidence.confidence).toBe(1);
    });

    it('should be usable in grid arrays for boundary rendering', () => {
      const grid: Prediction[] = [
        { x: -1, y: -1, confidence: 0.2 },
        { x: -1, y: 1, confidence: 0.8 },
        { x: 1, y: -1, confidence: 0.7 },
        { x: 1, y: 1, confidence: 0.3 },
      ];

      expect(grid).toHaveLength(4);
      expect(grid.every((p) => p.confidence >= 0 && p.confidence <= 1)).toBe(true);
    });
  });

  describe('Hyperparameters', () => {
    it('should create valid Hyperparameters with required properties', () => {
      const config: Hyperparameters = {
        learningRate: 0.03,
        layers: [8, 4],
      };

      expect(config.learningRate).toBe(0.03);
      expect(config.layers).toEqual([8, 4]);
    });

    it('should support various learning rates', () => {
      const slowLearning: Hyperparameters = { learningRate: 0.001, layers: [4] };
      const fastLearning: Hyperparameters = { learningRate: 0.1, layers: [4] };

      expect(slowLearning.learningRate).toBe(0.001);
      expect(fastLearning.learningRate).toBe(0.1);
    });

    it('should support different network architectures', () => {
      const shallow: Hyperparameters = { learningRate: 0.01, layers: [4] };
      const deep: Hyperparameters = { learningRate: 0.01, layers: [16, 8, 4, 2] };
      const wide: Hyperparameters = { learningRate: 0.01, layers: [64, 32] };

      expect(shallow.layers).toHaveLength(1);
      expect(deep.layers).toHaveLength(4);
      expect(wide.layers[0]).toBe(64);
    });

    it('should preserve readonly layers array', () => {
      const config: Hyperparameters = {
        learningRate: 0.03,
        layers: [8, 4],
      };

      // Verify layers is an array with correct values
      expect(Array.isArray(config.layers)).toBe(true);
      expect(config.layers[0]).toBe(8);
      expect(config.layers[1]).toBe(4);
    });
  });
});

describe('Domain Entity Relationships', () => {
  it('should allow Point to be used as input for predictions', () => {
    const inputPoint: Point = { x: 0.5, y: 0.5, label: 1 };

    // Simulate prediction output for the same coordinates
    const prediction: Prediction = {
      x: inputPoint.x,
      y: inputPoint.y,
      confidence: 0.92,
    };

    expect(prediction.x).toBe(inputPoint.x);
    expect(prediction.y).toBe(inputPoint.y);
  });

  it('should support mapping Points to Predictions', () => {
    const points: Point[] = [
      { x: 0, y: 0, label: 0 },
      { x: 1, y: 1, label: 1 },
    ];

    // Simulate prediction mapping
    const predictions: Prediction[] = points.map((p) => ({
      x: p.x,
      y: p.y,
      confidence: p.label === 1 ? 0.9 : 0.1,
    }));

    expect(predictions).toHaveLength(2);
    expect(predictions[0]?.confidence).toBe(0.1);
    expect(predictions[1]?.confidence).toBe(0.9);
  });
});

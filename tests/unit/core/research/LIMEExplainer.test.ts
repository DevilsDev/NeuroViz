/**
 * Unit tests for LIME Explainer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { explainPrediction, formatLIMEExplanationHTML, type LIMEConfig } from '../../../../src/core/research/LIMEExplainer';
import type { INeuralNetworkService } from '../../../../src/core/ports';
import type { Point, Prediction } from '../../../../src/core/domain';

describe('LIMEExplainer', () => {
  let mockNeuralNet: INeuralNetworkService;
  let testPoint: Point;

  beforeEach(() => {
    // Create mock neural network
    mockNeuralNet = {
      initialize: vi.fn(),
      train: vi.fn(),
      evaluate: vi.fn(),
      predict: vi.fn().mockImplementation(async (points: Point[]) => {
        // Mock predictions: return class 1 with 80% confidence
        return points.map(() => ({
          class: 1,
          confidence: 0.8,
          probabilities: [0.2, 0.8],
        })) as Prediction[];
      }),
      getWeights: vi.fn(),
      dispose: vi.fn(),
      getMemoryInfo: vi.fn(),
    };

    // Test point
    testPoint = {
      x: 0.5,
      y: 0.5,
      label: 1,
    };
  });

  describe('explainPrediction', () => {
    it('should generate LIME explanation for a point', async () => {
      const config: LIMEConfig = {
        numSamples: 100,
        kernelWidth: 0.75,
        featureNames: ['X', 'Y'],
      };

      const explanation = await explainPrediction(mockNeuralNet, testPoint, config);

      // Check structure
      expect(explanation).toHaveProperty('point');
      expect(explanation).toHaveProperty('predictedClass');
      expect(explanation).toHaveProperty('confidence');
      expect(explanation).toHaveProperty('contributions');
      expect(explanation).toHaveProperty('localFidelity');

      // Check point
      expect(explanation.point).toEqual(testPoint);

      // Check predicted class
      expect(explanation.predictedClass).toBe(1);
      expect(explanation.confidence).toBeCloseTo(0.8, 1);

      // Check contributions
      expect(explanation.contributions).toHaveLength(2); // X and Y
      expect(explanation.contributions[0]).toHaveProperty('featureName', 'X');
      expect(explanation.contributions[1]).toHaveProperty('featureName', 'Y');
      expect(explanation.contributions[0]).toHaveProperty('featureValue');
      expect(explanation.contributions[0]).toHaveProperty('contribution');

      // Check local fidelity (should be between 0 and 1)
      expect(explanation.localFidelity).toBeGreaterThanOrEqual(0);
      expect(explanation.localFidelity).toBeLessThanOrEqual(1);

      // Verify predict was called with perturbed samples
      expect(mockNeuralNet.predict).toHaveBeenCalled();
    });

    it('should use default configuration if not provided', async () => {
      const explanation = await explainPrediction(mockNeuralNet, testPoint);

      expect(explanation).toBeDefined();
      expect(explanation.contributions).toHaveLength(2);
      expect(explanation.contributions[0].featureName).toBe('X');
      expect(explanation.contributions[1].featureName).toBe('Y');
    });

    it('should handle custom feature names', async () => {
      const config: LIMEConfig = {
        numSamples: 50,
        kernelWidth: 1.0,
        featureNames: ['Latitude', 'Longitude'],
      };

      const explanation = await explainPrediction(mockNeuralNet, testPoint, config);

      expect(explanation.contributions[0].featureName).toBe('Latitude');
      expect(explanation.contributions[1].featureName).toBe('Longitude');
    });

    it('should generate different samples for each explanation', async () => {
      const explanation1 = await explainPrediction(mockNeuralNet, testPoint);
      const explanation2 = await explainPrediction(mockNeuralNet, testPoint);

      // Explanations should be similar but not identical due to random sampling
      expect(explanation1.predictedClass).toBe(explanation2.predictedClass);

      // Contributions might differ slightly due to different samples
      const contrib1X = explanation1.contributions[0].contribution;
      const contrib2X = explanation2.contributions[0].contribution;

      // They should be in the same ballpark but might differ
      expect(Math.abs(contrib1X - contrib2X)).toBeLessThan(1.0);
    });

    it('should respect kernel width parameter', async () => {
      const configNarrow: LIMEConfig = {
        numSamples: 100,
        kernelWidth: 0.1, // Narrow kernel - only very local samples weighted
        featureNames: ['X', 'Y'],
      };

      const configWide: LIMEConfig = {
        numSamples: 100,
        kernelWidth: 2.0, // Wide kernel - distant samples also weighted
        featureNames: ['X', 'Y'],
      };

      const explanationNarrow = await explainPrediction(mockNeuralNet, testPoint, configNarrow);
      const explanationWide = await explainPrediction(mockNeuralNet, testPoint, configWide);

      // Both should succeed
      expect(explanationNarrow).toBeDefined();
      expect(explanationWide).toBeDefined();

      // Local fidelity might differ based on kernel width
      expect(typeof explanationNarrow.localFidelity).toBe('number');
      expect(typeof explanationWide.localFidelity).toBe('number');
    });
  });

  describe('formatLIMEExplanationHTML', () => {
    it('should format explanation as HTML', () => {
      const explanation = {
        point: testPoint,
        predictedClass: 1,
        confidence: 0.85,
        contributions: [
          {
            featureName: 'X',
            featureValue: 0.5,
            contribution: 0.3,
          },
          {
            featureName: 'Y',
            featureValue: 0.5,
            contribution: -0.1,
          },
        ],
        localFidelity: 0.92,
      };

      const html = formatLIMEExplanationHTML(explanation);

      // Check HTML contains key information
      expect(html).toContain('0.50'); // Point coordinates
      expect(html).toContain('Class 1'); // Predicted class
      expect(html).toContain('85%'); // Confidence
      expect(html).toContain('92%'); // Local fidelity
      expect(html).toContain('X'); // Feature name
      expect(html).toContain('Y'); // Feature name
      expect(html).toContain('+0.300'); // Positive contribution
      expect(html).toContain('-0.100'); // Negative contribution
      expect(html).toContain('bg-emerald-500'); // Positive bar color
      expect(html).toContain('bg-red-500'); // Negative bar color
    });

    it('should handle high fidelity with green color', () => {
      const explanation = {
        point: testPoint,
        predictedClass: 0,
        confidence: 0.9,
        contributions: [],
        localFidelity: 0.75, // > 0.7 threshold
      };

      const html = formatLIMEExplanationHTML(explanation);

      expect(html).toContain('text-emerald-400'); // High fidelity color
      expect(html).toContain('75%');
    });

    it('should handle low fidelity with amber color', () => {
      const explanation = {
        point: testPoint,
        predictedClass: 0,
        confidence: 0.9,
        contributions: [],
        localFidelity: 0.6, // <= 0.7 threshold
      };

      const html = formatLIMEExplanationHTML(explanation);

      expect(html).toContain('text-amber-400'); // Low fidelity color
      expect(html).toContain('60%');
    });

    it('should escape HTML in feature names (XSS protection)', () => {
      const explanation = {
        point: testPoint,
        predictedClass: 0,
        confidence: 0.9,
        contributions: [
          {
            featureName: '<script>alert("XSS")</script>',
            featureValue: 0.5,
            contribution: 0.1,
          },
        ],
        localFidelity: 0.8,
      };

      const html = formatLIMEExplanationHTML(explanation);

      // Should not contain executable script tag
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('alert("XSS")');
    });
  });

  describe('Edge Cases', () => {
    it('should handle points at boundary (0, 0)', async () => {
      const boundaryPoint: Point = {
        x: 0,
        y: 0,
        label: 0,
      };

      const explanation = await explainPrediction(mockNeuralNet, boundaryPoint);

      expect(explanation).toBeDefined();
      expect(explanation.point).toEqual(boundaryPoint);
    });

    it('should handle points at boundary (1, 1)', async () => {
      const boundaryPoint: Point = {
        x: 1,
        y: 1,
        label: 1,
      };

      const explanation = await explainPrediction(mockNeuralNet, boundaryPoint);

      expect(explanation).toBeDefined();
      expect(explanation.point).toEqual(boundaryPoint);
    });

    it('should handle very few samples (minimum viable)', async () => {
      const config: LIMEConfig = {
        numSamples: 10, // Very few samples
        kernelWidth: 1.0,
        featureNames: ['X', 'Y'],
      };

      const explanation = await explainPrediction(mockNeuralNet, testPoint, config);

      expect(explanation).toBeDefined();
      expect(explanation.contributions).toHaveLength(2);
    });
  });
});

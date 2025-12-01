/**
 * Unit tests for Neural Architecture Search (NAS)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runNAS, formatNASResultHTML, type NASConfig } from '../../../../src/core/research/NeuralArchitectureSearch';
import type { INeuralNetworkService } from '../../../../src/core/ports';
import type { Point } from '../../../../src/core/domain';

describe('NeuralArchitectureSearch', () => {
  let mockNeuralNet: INeuralNetworkService;
  let trainingData: Point[];
  let validationData: Point[];

  beforeEach(() => {
    // Create mock neural network
    mockNeuralNet = {
      initialize: vi.fn().mockResolvedValue(undefined),
      train: vi.fn().mockResolvedValue({
        loss: 0.5,
        accuracy: 0.75,
      }),
      evaluate: vi.fn().mockResolvedValue({
        loss: 0.6,
        accuracy: 0.72,
      }),
      predict: vi.fn(),
      getWeights: vi.fn(),
      dispose: vi.fn(),
      getMemoryInfo: vi.fn(),
    };

    // Simple training data
    trainingData = [
      { x: 0.1, y: 0.1, label: 0 },
      { x: 0.9, y: 0.9, label: 1 },
      { x: 0.2, y: 0.2, label: 0 },
      { x: 0.8, y: 0.8, label: 1 },
    ];

    // Validation data
    validationData = [
      { x: 0.15, y: 0.15, label: 0 },
      { x: 0.85, y: 0.85, label: 1 },
    ];
  });

  describe('runNAS', () => {
    it('should search and return best architecture', async () => {
      const config: NASConfig = {
        searchSpace: {
          layerSizes: [[4], [8], [4, 4]],
          activations: ['relu', 'tanh'],
          learningRates: [0.01, 0.1],
        },
        epochs: 10,
        numCandidates: 3, // Test only 3 candidates for speed
      };

      const result = await runNAS(
        mockNeuralNet,
        trainingData,
        validationData,
        config,
        () => {} // No progress callback
      );

      // Check result structure
      expect(result).toHaveProperty('bestArchitecture');
      expect(result).toHaveProperty('bestAccuracy');
      expect(result).toHaveProperty('allResults');
      expect(result).toHaveProperty('searchTime');

      // Check best architecture
      expect(result.bestArchitecture).toHaveProperty('layers');
      expect(result.bestArchitecture).toHaveProperty('activation');
      expect(result.bestArchitecture).toHaveProperty('learningRate');

      // Check accuracy is valid
      expect(result.bestAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.bestAccuracy).toBeLessThanOrEqual(1);

      // Check all results
      expect(result.allResults.length).toBeGreaterThan(0);
      expect(result.allResults.length).toBeLessThanOrEqual(config.numCandidates);

      // Check search time is reasonable
      expect(result.searchTime).toBeGreaterThan(0);

      // Verify neural network was initialized and trained
      expect(mockNeuralNet.initialize).toHaveBeenCalled();
      expect(mockNeuralNet.train).toHaveBeenCalled();
      expect(mockNeuralNet.evaluate).toHaveBeenCalled();
    });

    it('should call progress callback during search', async () => {
      const config: NASConfig = {
        searchSpace: {
          layerSizes: [[4], [8]],
          activations: ['relu'],
          learningRates: [0.01],
        },
        epochs: 5,
        numCandidates: 2,
      };

      const progressCallback = vi.fn();

      await runNAS(
        mockNeuralNet,
        trainingData,
        validationData,
        config,
        progressCallback
      );

      // Progress callback should be called at least once
      expect(progressCallback).toHaveBeenCalled();

      // Check callback was called with valid arguments
      const calls = progressCallback.mock.calls;
      for (const call of calls) {
        const [current, total, bestSoFar] = call;
        expect(current).toBeGreaterThan(0);
        expect(total).toBeGreaterThan(0);
        expect(current).toBeLessThanOrEqual(total);

        if (bestSoFar) {
          expect(bestSoFar.accuracy).toBeGreaterThanOrEqual(0);
          expect(bestSoFar.accuracy).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should sort results by accuracy (best first)', async () => {
      // Mock different accuracies for different evaluations
      let evaluationCount = 0;
      mockNeuralNet.evaluate = vi.fn().mockImplementation(async () => {
        evaluationCount++;
        return {
          loss: 0.5,
          accuracy: 0.5 + evaluationCount * 0.1, // Increasing accuracy
        };
      });

      const config: NASConfig = {
        searchSpace: {
          layerSizes: [[4], [8], [16]],
          activations: ['relu'],
          learningRates: [0.01],
        },
        epochs: 5,
        numCandidates: 3,
      };

      const result = await runNAS(
        mockNeuralNet,
        trainingData,
        validationData,
        config,
        () => {}
      );

      // Results should be sorted by accuracy (descending)
      for (let i = 0; i < result.allResults.length - 1; i++) {
        expect(result.allResults[i].accuracy).toBeGreaterThanOrEqual(
          result.allResults[i + 1].accuracy
        );
      }

      // Best architecture should match first result
      expect(result.bestArchitecture).toEqual(result.allResults[0].architecture);
      expect(result.bestAccuracy).toBe(result.allResults[0].accuracy);
    });

    it('should handle single candidate search space', async () => {
      const config: NASConfig = {
        searchSpace: {
          layerSizes: [[8]],
          activations: ['relu'],
          learningRates: [0.01],
        },
        epochs: 5,
        numCandidates: 1,
      };

      const result = await runNAS(
        mockNeuralNet,
        trainingData,
        validationData,
        config,
        () => {}
      );

      expect(result.allResults).toHaveLength(1);
      expect(result.bestArchitecture.layers).toEqual([8]);
      expect(result.bestArchitecture.activation).toBe('relu');
      expect(result.bestArchitecture.learningRate).toBe(0.01);
    });

    it('should respect numCandidates limit', async () => {
      const config: NASConfig = {
        searchSpace: {
          layerSizes: [[4], [8], [16], [32]], // 4 options
          activations: ['relu', 'tanh'], // 2 options
          learningRates: [0.01, 0.1], // 2 options
          // Total combinations: 4 * 2 * 2 = 16
        },
        epochs: 5,
        numCandidates: 5, // Only test 5 out of 16
      };

      const result = await runNAS(
        mockNeuralNet,
        trainingData,
        validationData,
        config,
        () => {}
      );

      // Should test exactly numCandidates architectures
      expect(result.allResults.length).toBe(5);
    });
  });

  describe('formatNASResultHTML', () => {
    it('should format NAS result as HTML', () => {
      const result = {
        bestArchitecture: {
          layers: [8, 4],
          activation: 'relu',
          learningRate: 0.01,
        },
        bestAccuracy: 0.87,
        allResults: [
          {
            architecture: { layers: [8, 4], activation: 'relu', learningRate: 0.01 },
            accuracy: 0.87,
            loss: 0.3,
            parameters: 100,
            trainingTime: 1234,
          },
          {
            architecture: { layers: [16], activation: 'tanh', learningRate: 0.1 },
            accuracy: 0.82,
            loss: 0.4,
            parameters: 80,
            trainingTime: 987,
          },
        ],
        searchTime: 5678,
      };

      const html = formatNASResultHTML(result);

      // Check HTML contains key information
      expect(html).toContain('87.0%'); // Best accuracy
      expect(html).toContain('[8, 4]'); // Best architecture layers
      expect(html).toContain('relu'); // Activation
      expect(html).toContain('0.010'); // Learning rate
      expect(html).toContain('100'); // Parameters
      expect(html).toContain('1.23s'); // Training time
      expect(html).toContain('5.68s'); // Search time
      expect(html).toContain('82.0%'); // Second result accuracy
    });

    it('should highlight best result', () => {
      const result = {
        bestArchitecture: {
          layers: [8],
          activation: 'relu',
          learningRate: 0.01,
        },
        bestAccuracy: 0.9,
        allResults: [
          {
            architecture: { layers: [8], activation: 'relu', learningRate: 0.01 },
            accuracy: 0.9,
            loss: 0.2,
            parameters: 50,
            trainingTime: 1000,
          },
        ],
        searchTime: 2000,
      };

      const html = formatNASResultHTML(result);

      // Best result should have highlighted styling
      expect(html).toContain('bg-emerald-900'); // Winner background
      expect(html).toContain('border-emerald-500'); // Winner border
      expect(html).toContain('Winner'); // Winner label
    });

    it('should display multiple results in order', () => {
      const result = {
        bestArchitecture: {
          layers: [16],
          activation: 'relu',
          learningRate: 0.01,
        },
        bestAccuracy: 0.9,
        allResults: [
          {
            architecture: { layers: [16], activation: 'relu', learningRate: 0.01 },
            accuracy: 0.9,
            loss: 0.2,
            parameters: 100,
            trainingTime: 1500,
          },
          {
            architecture: { layers: [8], activation: 'tanh', learningRate: 0.1 },
            accuracy: 0.85,
            loss: 0.3,
            parameters: 60,
            trainingTime: 1000,
          },
          {
            architecture: { layers: [4], activation: 'relu', learningRate: 0.001 },
            accuracy: 0.80,
            loss: 0.4,
            parameters: 30,
            trainingTime: 800,
          },
        ],
        searchTime: 5000,
      };

      const html = formatNASResultHTML(result);

      // Should contain all three results
      expect(html).toContain('90.0%');
      expect(html).toContain('85.0%');
      expect(html).toContain('80.0%');

      // Should display layers for all architectures
      expect(html).toContain('[16]');
      expect(html).toContain('[8]');
      expect(html).toContain('[4]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty training data gracefully', async () => {
      const config: NASConfig = {
        searchSpace: {
          layerSizes: [[4]],
          activations: ['relu'],
          learningRates: [0.01],
        },
        epochs: 5,
        numCandidates: 1,
      };

      // This should either throw or handle gracefully
      await expect(async () => {
        await runNAS(
          mockNeuralNet,
          [],
          validationData,
          config,
          () => {}
        );
      }).rejects.toThrow();
    });

    it('should handle very short training (1 epoch)', async () => {
      const config: NASConfig = {
        searchSpace: {
          layerSizes: [[4]],
          activations: ['relu'],
          learningRates: [0.01],
        },
        epochs: 1, // Single epoch
        numCandidates: 1,
      };

      const result = await runNAS(
        mockNeuralNet,
        trainingData,
        validationData,
        config,
        () => {}
      );

      expect(result).toBeDefined();
      expect(result.bestAccuracy).toBeGreaterThanOrEqual(0);
    });
  });
});

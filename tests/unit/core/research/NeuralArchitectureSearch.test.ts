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
  let createModel: () => INeuralNetworkService;

  beforeEach(() => {
    // Create mock neural network with small delays to simulate async behavior
    mockNeuralNet = {
      initialize: vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
      }),
      train: vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return { loss: 0.5, accuracy: 0.75 };
      }),
      evaluate: vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return { loss: 0.6, accuracy: 0.72 };
      }),
      predict: vi.fn(),
      getWeights: vi.fn(),
      dispose: vi.fn(),
      getMemoryInfo: vi.fn(),
    };

    // Factory function for creating models
    createModel = () => mockNeuralNet;

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
        numCandidates: 3,
        epochsPerCandidate: 10,
        strategy: 'random',
        populationSize: 10,
        mutationRate: 0.3,
      };

      const result = await runNAS(
        createModel,
        trainingData,
        validationData,
        config,
        () => {} // No progress callback
      );

      // Check result structure
      expect(result).toHaveProperty('best');
      expect(result).toHaveProperty('history');
      expect(result).toHaveProperty('config');
      expect(result).toHaveProperty('totalTime');

      // Check best architecture result
      expect(result.best).toHaveProperty('architecture');
      expect(result.best).toHaveProperty('accuracy');
      expect(result.best).toHaveProperty('loss');
      expect(result.best.architecture).toHaveProperty('layers');
      expect(result.best.architecture).toHaveProperty('activation');
      expect(result.best.architecture).toHaveProperty('learningRate');

      // Check accuracy is valid
      expect(result.best.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.best.accuracy).toBeLessThanOrEqual(1);

      // Check history
      expect(result.history.length).toBeGreaterThan(0);
      expect(result.history.length).toBeLessThanOrEqual(config.numCandidates);

      // Check search time is reasonable
      expect(result.totalTime).toBeGreaterThan(0);

      // Verify neural network was initialized and trained
      expect(mockNeuralNet.initialize).toHaveBeenCalled();
      expect(mockNeuralNet.train).toHaveBeenCalled();
      expect(mockNeuralNet.evaluate).toHaveBeenCalled();
    });

    it('should call progress callback during search', async () => {
      const config: NASConfig = {
        numCandidates: 2,
        epochsPerCandidate: 5,
        strategy: 'random',
        populationSize: 10,
        mutationRate: 0.3,
      };

      const progressCallback = vi.fn();

      await runNAS(
        createModel,
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
        numCandidates: 3,
        epochsPerCandidate: 5,
        strategy: 'random',
        populationSize: 10,
        mutationRate: 0.3,
      };

      const result = await runNAS(
        createModel,
        trainingData,
        validationData,
        config,
        () => {}
      );

      // Best should have highest accuracy
      const maxAccuracy = Math.max(...result.history.map(r => r.accuracy));
      expect(result.best.accuracy).toBe(maxAccuracy);
    });

    it('should handle single candidate search space', async () => {
      const config: NASConfig = {
        numCandidates: 1,
        epochsPerCandidate: 5,
        strategy: 'random',
        populationSize: 10,
        mutationRate: 0.3,
      };

      const result = await runNAS(
        createModel,
        trainingData,
        validationData,
        config,
        () => {}
      );

      expect(result.history).toHaveLength(1);
      expect(result.best.architecture.layers).toBeDefined();
      expect(result.best.architecture.activation).toBeDefined();
      expect(result.best.architecture.learningRate).toBeDefined();
    });

    it('should respect numCandidates limit', async () => {
      const config: NASConfig = {
        numCandidates: 5,
        epochsPerCandidate: 5,
        strategy: 'random',
        populationSize: 10,
        mutationRate: 0.3,
      };

      const result = await runNAS(
        createModel,
        trainingData,
        validationData,
        config,
        () => {}
      );

      // Should test exactly numCandidates architectures
      expect(result.history.length).toBe(5);
    });
  });

  describe('formatNASResultHTML', () => {
    it('should format NAS result as HTML', () => {
      const result = {
        best: {
          architecture: {
            id: 'test-1',
            layers: [8, 4],
            activation: 'relu' as const,
            optimizer: 'adam' as const,
            learningRate: 0.01,
            dropoutRate: 0,
            l2Regularization: 0,
          },
          accuracy: 0.87,
          loss: 0.3,
          numParameters: 100,
          trainingTime: 1234,
          epochsTrained: 10,
        },
        history: [
          {
            architecture: {
              id: 'test-1',
              layers: [8, 4],
              activation: 'relu' as const,
              optimizer: 'adam' as const,
              learningRate: 0.01,
              dropoutRate: 0,
              l2Regularization: 0,
            },
            accuracy: 0.87,
            loss: 0.3,
            numParameters: 100,
            trainingTime: 1234,
            epochsTrained: 10,
          },
          {
            architecture: {
              id: 'test-2',
              layers: [16],
              activation: 'tanh' as const,
              optimizer: 'adam' as const,
              learningRate: 0.1,
              dropoutRate: 0,
              l2Regularization: 0,
            },
            accuracy: 0.82,
            loss: 0.4,
            numParameters: 80,
            trainingTime: 987,
            epochsTrained: 10,
          },
        ],
        config: {
          numCandidates: 2,
          epochsPerCandidate: 10,
          strategy: 'random' as const,
          populationSize: 10,
          mutationRate: 0.3,
        },
        totalTime: 5678,
      };

      const html = formatNASResultHTML(result);

      // Check HTML contains key information
      expect(html).toContain('87.0%'); // Best accuracy
      expect(html).toContain('[8, 4]'); // Best architecture layers
      expect(html).toContain('relu'); // Activation
      expect(html).toContain('0.01'); // Learning rate
      expect(html).toContain('100'); // Parameters
    });

    it('should highlight best result', () => {
      const result = {
        best: {
          architecture: {
            id: 'test-1',
            layers: [8],
            activation: 'relu' as const,
            optimizer: 'adam' as const,
            learningRate: 0.01,
            dropoutRate: 0,
            l2Regularization: 0,
          },
          accuracy: 0.9,
          loss: 0.2,
          numParameters: 50,
          trainingTime: 1000,
          epochsTrained: 10,
        },
        history: [
          {
            architecture: {
              id: 'test-1',
              layers: [8],
              activation: 'relu' as const,
              optimizer: 'adam' as const,
              learningRate: 0.01,
              dropoutRate: 0,
              l2Regularization: 0,
            },
            accuracy: 0.9,
            loss: 0.2,
            numParameters: 50,
            trainingTime: 1000,
            epochsTrained: 10,
          },
        ],
        config: {
          numCandidates: 1,
          epochsPerCandidate: 10,
          strategy: 'random' as const,
          populationSize: 10,
          mutationRate: 0.3,
        },
        totalTime: 2000,
      };

      const html = formatNASResultHTML(result);

      // Should contain best architecture styling
      expect(html).toContain('bg-emerald-900/30');
      expect(html).toContain('border-emerald-700/50');
      expect(html).toContain('Best Architecture');
    });

    it('should display multiple results in order', () => {
      const result = {
        best: {
          architecture: {
            id: 'test-1',
            layers: [16],
            activation: 'relu' as const,
            optimizer: 'adam' as const,
            learningRate: 0.01,
            dropoutRate: 0,
            l2Regularization: 0,
          },
          accuracy: 0.9,
          loss: 0.2,
          numParameters: 100,
          trainingTime: 1500,
          epochsTrained: 10,
        },
        history: [
          {
            architecture: {
              id: 'test-1',
              layers: [16],
              activation: 'relu' as const,
              optimizer: 'adam' as const,
              learningRate: 0.01,
              dropoutRate: 0,
              l2Regularization: 0,
            },
            accuracy: 0.9,
            loss: 0.2,
            numParameters: 100,
            trainingTime: 1500,
            epochsTrained: 10,
          },
          {
            architecture: {
              id: 'test-2',
              layers: [8],
              activation: 'tanh' as const,
              optimizer: 'adam' as const,
              learningRate: 0.1,
              dropoutRate: 0,
              l2Regularization: 0,
            },
            accuracy: 0.85,
            loss: 0.3,
            numParameters: 60,
            trainingTime: 1000,
            epochsTrained: 10,
          },
          {
            architecture: {
              id: 'test-3',
              layers: [4],
              activation: 'relu' as const,
              optimizer: 'adam' as const,
              learningRate: 0.001,
              dropoutRate: 0,
              l2Regularization: 0,
            },
            accuracy: 0.80,
            loss: 0.4,
            numParameters: 30,
            trainingTime: 800,
            epochsTrained: 10,
          },
        ],
        config: {
          numCandidates: 3,
          epochsPerCandidate: 10,
          strategy: 'random' as const,
          populationSize: 10,
          mutationRate: 0.3,
        },
        totalTime: 5000,
      };

      const html = formatNASResultHTML(result);

      // Should contain results sorted by accuracy
      expect(html).toContain('90.0%');
      expect(html).toContain('85.0%');
      expect(html).toContain('80.0%');

      // Should display layers for architectures
      expect(html).toContain('[16]');
      expect(html).toContain('[8]');
      expect(html).toContain('[4]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty training data gracefully', async () => {
      const config: NASConfig = {
        numCandidates: 1,
        epochsPerCandidate: 5,
        strategy: 'random',
        populationSize: 10,
        mutationRate: 0.3,
      };

      // With empty training data, the model should still run but may not learn
      const result = await runNAS(
        createModel,
        [],
        validationData,
        config,
        () => {}
      );

      // Should still return a result even with empty training data
      expect(result).toBeDefined();
      expect(result.best).toBeDefined();
    });

    it('should handle very short training (1 epoch)', async () => {
      const config: NASConfig = {
        numCandidates: 1,
        epochsPerCandidate: 1, // Single epoch
        strategy: 'random',
        populationSize: 10,
        mutationRate: 0.3,
      };

      const result = await runNAS(
        createModel,
        trainingData,
        validationData,
        config,
        () => {}
      );

      expect(result).toBeDefined();
      expect(result.best.accuracy).toBeGreaterThanOrEqual(0);
    });
  });
});
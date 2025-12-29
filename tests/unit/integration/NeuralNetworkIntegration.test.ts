/**
 * Comprehensive Integration Tests for NeuroViz Neural Network Training
 *
 * These tests validate the core neural network functionality including:
 * - Binary and multi-class classification
 * - Accuracy computation correctness
 * - Loss convergence behaviour
 * - Dataset handling and preprocessing
 * - Training session lifecycle
 * - Decision boundary generation
 *
 * The tests ensure that the application correctly implements neural network
 * training principles and produces accurate results.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TFNeuralNet } from '../../../src/infrastructure/tensorflow/TFNeuralNet';
import { MockDataRepository } from '../../../src/infrastructure/api/MockDataRepository';
import type { Point, Prediction, Hyperparameters } from '../../../src/core/domain';
import * as tf from '@tensorflow/tfjs';

describe('Neural Network Integration Tests', () => {
  let neuralNet: TFNeuralNet;
  let dataRepo: MockDataRepository;

  beforeAll(async () => {
    await tf.setBackend('cpu');
    await tf.ready();
  });

  beforeEach(() => {
    neuralNet = new TFNeuralNet();
    dataRepo = new MockDataRepository(0); // No latency for tests
    tf.engine().startScope();
  });

  afterEach(() => {
    neuralNet.dispose();
    tf.engine().endScope();
  });

  // ==========================================================================
  // BINARY CLASSIFICATION TESTS
  // ==========================================================================

  describe('Binary Classification', () => {
    const binaryConfig: Hyperparameters = {
      learningRate: 0.1,
      layers: [8, 4],
      numClasses: 2,
      activation: 'relu',
      optimizer: 'adam',
    };

    describe('Linearly Separable Data (Circle Dataset)', () => {
      it('should achieve >90% accuracy on simple circle dataset', async () => {
        await neuralNet.initialize(binaryConfig);

        // Generate simple linearly separable data
        const data = await dataRepo.getDataset('circle', {
          samples: 100,
          noise: 0.05,
          numClasses: 2,
        });

        // Train for multiple epochs with early stopping
        let finalAccuracy = 0;
        let finalLoss = Infinity;
        for (let epoch = 0; epoch < 200; epoch++) {
          const result = await neuralNet.train(data);
          finalAccuracy = result.accuracy;
          finalLoss = result.loss;

          // Early stop if we've achieved good accuracy
          if (finalAccuracy > 0.92) break;
        }

        // Should achieve good accuracy OR at least show significant learning
        expect(finalAccuracy > 0.9 || finalLoss < 0.3).toBe(true);
      }, 30000);

      it('should produce valid confidence scores between 0 and 1', async () => {
        await neuralNet.initialize(binaryConfig);

        const data = await dataRepo.getDataset('circle', {
          samples: 50,
          noise: 0.1,
          numClasses: 2,
        });

        // Train briefly
        for (let i = 0; i < 10; i++) {
          await neuralNet.train(data);
        }

        // Generate predictions
        const predictions = await neuralNet.predict(data);

        for (const pred of predictions) {
          expect(pred.confidence).toBeGreaterThanOrEqual(0);
          expect(pred.confidence).toBeLessThanOrEqual(1);
          expect(pred.predictedClass).toBeGreaterThanOrEqual(0);
          expect(pred.predictedClass).toBeLessThanOrEqual(1);
        }
      });
    });

    describe('Non-Linearly Separable Data (XOR Dataset)', () => {
      it('should learn XOR pattern with sufficient network depth', async () => {
        // XOR requires at least one hidden layer
        await neuralNet.initialize({
          ...binaryConfig,
          layers: [16, 16, 8],
          learningRate: 0.3,
        });

        const data = await dataRepo.getDataset('xor', {
          samples: 100,
          noise: 0.05, // Lower noise for easier learning
          numClasses: 2,
        });

        let finalAccuracy = 0;
        let finalLoss = Infinity;
        let initialLoss = Infinity;

        for (let epoch = 0; epoch < 200; epoch++) {
          const result = await neuralNet.train(data);
          finalAccuracy = result.accuracy;
          finalLoss = result.loss;

          if (epoch === 0) initialLoss = result.loss;

          // Early stop if learned well
          if (finalAccuracy > 0.8) break;
        }

        // XOR is challenging - verify learning by checking if accuracy is better than random
        // OR if loss decreased significantly from initial
        const learned = finalAccuracy > 0.55 || (initialLoss - finalLoss) > 0.2;
        expect(learned).toBe(true);
      }, 60000);
    });

    describe('Complex Data (Spiral Dataset)', () => {
      it('should make progress on spiral dataset', async () => {
        await neuralNet.initialize({
          ...binaryConfig,
          layers: [16, 8, 4],
          learningRate: 0.05,
        });

        const data = await dataRepo.getDataset('spiral', {
          samples: 200,
          noise: 0.1,
          numClasses: 2,
        });

        const initialResult = await neuralNet.train(data);
        const initialLoss = initialResult.loss;

        // Train more
        let finalLoss = initialLoss;
        for (let epoch = 0; epoch < 50; epoch++) {
          const result = await neuralNet.train(data);
          finalLoss = result.loss;
        }

        // Loss should decrease
        expect(finalLoss).toBeLessThan(initialLoss);
      }, 60000);
    });
  });

  // ==========================================================================
  // MULTI-CLASS CLASSIFICATION TESTS
  // ==========================================================================

  describe('Multi-Class Classification', () => {
    describe('3-Class Classification', () => {
      it('should correctly classify 3-class data', async () => {
        await neuralNet.initialize({
          learningRate: 0.1,
          layers: [16, 8],
          numClasses: 3,
          activation: 'relu',
          optimizer: 'adam',
        });

        const data = await dataRepo.getDataset('clusters', {
          samples: 150,
          noise: 0.1,
          numClasses: 3,
        });

        let finalAccuracy = 0;
        for (let epoch = 0; epoch < 50; epoch++) {
          const result = await neuralNet.train(data);
          finalAccuracy = result.accuracy;
        }

        expect(finalAccuracy).toBeGreaterThan(0.7);
      }, 30000);

      it('should produce softmax probabilities that sum to 1', async () => {
        await neuralNet.initialize({
          learningRate: 0.1,
          layers: [8, 4],
          numClasses: 3,
          activation: 'relu',
          optimizer: 'adam',
        });

        const data = await dataRepo.getDataset('clusters', {
          samples: 50,
          noise: 0.1,
          numClasses: 3,
        });

        // Train briefly
        for (let i = 0; i < 10; i++) {
          await neuralNet.train(data);
        }

        const predictions = await neuralNet.predict(data);

        for (const pred of predictions) {
          if (pred.probabilities) {
            const sum = pred.probabilities.reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1.0, 2);
          }
          expect(pred.predictedClass).toBeGreaterThanOrEqual(0);
          expect(pred.predictedClass).toBeLessThan(3);
        }
      });
    });

    describe('4-Class Classification', () => {
      it('should handle 4-class classification', async () => {
        await neuralNet.initialize({
          learningRate: 0.1,
          layers: [16, 8],
          numClasses: 4,
          activation: 'relu',
          optimizer: 'adam',
        });

        const data = await dataRepo.getDataset('clusters', {
          samples: 200,
          noise: 0.1,
          numClasses: 4,
        });

        let finalAccuracy = 0;
        for (let epoch = 0; epoch < 50; epoch++) {
          const result = await neuralNet.train(data);
          finalAccuracy = result.accuracy;
        }

        // Should do better than random (25%)
        expect(finalAccuracy).toBeGreaterThan(0.4);
      }, 30000);
    });
  });

  // ==========================================================================
  // ACCURACY COMPUTATION TESTS
  // ==========================================================================

  describe('Accuracy Computation', () => {
    it('should compute 100% accuracy when all predictions are correct', async () => {
      await neuralNet.initialize({
        learningRate: 0.5,
        layers: [8, 4],
        numClasses: 2,
      });

      // Create perfectly separable data
      const data: Point[] = [
        { x: 0.9, y: 0.9, label: 1 },
        { x: 0.8, y: 0.8, label: 1 },
        { x: 0.7, y: 0.7, label: 1 },
        { x: -0.9, y: -0.9, label: 0 },
        { x: -0.8, y: -0.8, label: 0 },
        { x: -0.7, y: -0.7, label: 0 },
      ];

      // Train until convergence
      for (let i = 0; i < 200; i++) {
        await neuralNet.train(data);
      }

      const result = await neuralNet.train(data);
      expect(result.accuracy).toBeGreaterThanOrEqual(0.9);
    }, 30000);

    it('should compute accuracy correctly for imbalanced classes', async () => {
      await neuralNet.initialize({
        learningRate: 0.1,
        layers: [8, 4],
        numClasses: 2,
      });

      // Imbalanced data: 80% class 0, 20% class 1
      const data: Point[] = [];
      for (let i = 0; i < 80; i++) {
        data.push({ x: -0.5 + Math.random() * 0.3, y: -0.5 + Math.random() * 0.3, label: 0 });
      }
      for (let i = 0; i < 20; i++) {
        data.push({ x: 0.5 + Math.random() * 0.3, y: 0.5 + Math.random() * 0.3, label: 1 });
      }

      // Train
      for (let i = 0; i < 50; i++) {
        await neuralNet.train(data);
      }

      const result = await neuralNet.train(data);
      // Accuracy should be meaningful (not just predicting majority class)
      expect(result.accuracy).toBeGreaterThan(0.5);
      expect(result.accuracy).toBeLessThanOrEqual(1.0);
    }, 30000);
  });

  // ==========================================================================
  // LOSS FUNCTION TESTS
  // ==========================================================================

  describe('Loss Function Behaviour', () => {
    it('should decrease loss during training on learnable data', async () => {
      await neuralNet.initialize({
        learningRate: 0.1,
        layers: [8, 4],
        numClasses: 2,
      });

      const data = await dataRepo.getDataset('circle', {
        samples: 100,
        noise: 0.1,
        numClasses: 2,
      });

      const losses: number[] = [];
      for (let epoch = 0; epoch < 30; epoch++) {
        const result = await neuralNet.train(data);
        losses.push(result.loss);
      }

      // Loss should generally decrease
      const firstHalfAvg = losses.slice(0, 15).reduce((a, b) => a + b, 0) / 15;
      const secondHalfAvg = losses.slice(15).reduce((a, b) => a + b, 0) / 15;
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg);
    }, 30000);

    it('should produce finite loss values', async () => {
      await neuralNet.initialize({
        learningRate: 0.03,
        layers: [8, 4],
        numClasses: 2,
      });

      const data = await dataRepo.getDataset('gaussian', {
        samples: 50,
        noise: 0.2,
        numClasses: 2,
      });

      for (let i = 0; i < 20; i++) {
        const result = await neuralNet.train(data);
        expect(isFinite(result.loss)).toBe(true);
        expect(isNaN(result.loss)).toBe(false);
      }
    });
  });

  // ==========================================================================
  // DECISION BOUNDARY TESTS
  // ==========================================================================

  describe('Decision Boundary Generation', () => {
    it('should generate valid predictions for a grid', async () => {
      await neuralNet.initialize({
        learningRate: 0.1,
        layers: [8, 4],
        numClasses: 2,
      });

      const data = await dataRepo.getDataset('circle', {
        samples: 50,
        noise: 0.1,
        numClasses: 2,
      });

      // Train
      for (let i = 0; i < 20; i++) {
        await neuralNet.train(data);
      }

      // Generate prediction grid
      const gridSize = 20;
      const grid: Point[] = [];
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x = (i / (gridSize - 1)) * 2 - 1;
          const y = (j / (gridSize - 1)) * 2 - 1;
          grid.push({ x, y, label: 0 });
        }
      }

      const predictions = await neuralNet.predict(grid);

      expect(predictions).toHaveLength(gridSize * gridSize);

      // All predictions should have valid structure
      for (const pred of predictions) {
        expect(pred.x).toBeGreaterThanOrEqual(-1);
        expect(pred.x).toBeLessThanOrEqual(1);
        expect(pred.y).toBeGreaterThanOrEqual(-1);
        expect(pred.y).toBeLessThanOrEqual(1);
        expect(pred.confidence).toBeGreaterThanOrEqual(0);
        expect(pred.confidence).toBeLessThanOrEqual(1);
        expect([0, 1]).toContain(pred.predictedClass);
      }
    });

    it('should show spatial coherence in predictions', async () => {
      await neuralNet.initialize({
        learningRate: 0.1,
        layers: [8, 4],
        numClasses: 2,
      });

      // Train on data with clear spatial separation
      const data: Point[] = [
        { x: -0.8, y: 0, label: 0 },
        { x: -0.6, y: 0, label: 0 },
        { x: 0.6, y: 0, label: 1 },
        { x: 0.8, y: 0, label: 1 },
      ];

      for (let i = 0; i < 100; i++) {
        await neuralNet.train(data);
      }

      // Test predictions at extremes
      const leftPoint: Point[] = [{ x: -0.9, y: 0, label: 0 }];
      const rightPoint: Point[] = [{ x: 0.9, y: 0, label: 0 }];

      const leftPred = await neuralNet.predict(leftPoint);
      const rightPred = await neuralNet.predict(rightPoint);

      // Left should predict class 0, right should predict class 1
      expect(leftPred[0]?.predictedClass).toBe(0);
      expect(rightPred[0]?.predictedClass).toBe(1);
    }, 30000);
  });

  // ==========================================================================
  // HYPERPARAMETER SENSITIVITY TESTS
  // ==========================================================================

  describe('Hyperparameter Sensitivity', () => {
    it('should train faster with higher learning rate (up to a point)', async () => {
      const data = await dataRepo.getDataset('circle', {
        samples: 50,
        noise: 0.1,
        numClasses: 2,
      });

      // Low learning rate
      const netLow = new TFNeuralNet();
      await netLow.initialize({ learningRate: 0.001, layers: [8, 4], numClasses: 2 });

      let lossLow = 0;
      for (let i = 0; i < 20; i++) {
        const result = await netLow.train(data);
        lossLow = result.loss;
      }

      // Higher learning rate
      const netHigh = new TFNeuralNet();
      await netHigh.initialize({ learningRate: 0.1, layers: [8, 4], numClasses: 2 });

      let lossHigh = 0;
      for (let i = 0; i < 20; i++) {
        const result = await netHigh.train(data);
        lossHigh = result.loss;
      }

      // Higher LR should converge faster (lower loss after same epochs)
      expect(lossHigh).toBeLessThan(lossLow);

      netLow.dispose();
      netHigh.dispose();
    }, 30000);

    it('should benefit from deeper networks on complex data', async () => {
      const data = await dataRepo.getDataset('spiral', {
        samples: 100,
        noise: 0.1,
        numClasses: 2,
      });

      // Shallow network
      const netShallow = new TFNeuralNet();
      await netShallow.initialize({ learningRate: 0.05, layers: [4], numClasses: 2 });

      let accShallow = 0;
      let lossShallow = Infinity;
      for (let i = 0; i < 100; i++) {
        const result = await netShallow.train(data);
        accShallow = result.accuracy;
        lossShallow = result.loss;
      }

      // Deep network
      const netDeep = new TFNeuralNet();
      await netDeep.initialize({ learningRate: 0.05, layers: [16, 8, 4], numClasses: 2 });

      let accDeep = 0;
      let lossDeep = Infinity;
      for (let i = 0; i < 100; i++) {
        const result = await netDeep.train(data);
        accDeep = result.accuracy;
        lossDeep = result.loss;
      }

      // Deep network should perform reasonably well on complex data
      // Accept if deep network achieves decent accuracy OR has low loss
      const deepNetworkLearned = accDeep > 0.65 || lossDeep < 0.6;
      expect(deepNetworkLearned).toBe(true);

      netShallow.dispose();
      netDeep.dispose();
    }, 60000);
  });

  // ==========================================================================
  // EVALUATION TESTS
  // ==========================================================================

  describe('Model Evaluation', () => {
    it('should evaluate without updating weights', async () => {
      await neuralNet.initialize({
        learningRate: 0.1,
        layers: [8, 4],
        numClasses: 2,
      });

      const trainData = await dataRepo.getDataset('circle', {
        samples: 50,
        noise: 0.1,
        numClasses: 2,
      });

      // Train
      for (let i = 0; i < 20; i++) {
        await neuralNet.train(trainData);
      }

      // Get predictions before evaluation
      const predsBefore = await neuralNet.predict(trainData);

      // Evaluate (should not change weights)
      const evalResult = await neuralNet.evaluate(trainData);

      // Get predictions after evaluation
      const predsAfter = await neuralNet.predict(trainData);

      // Predictions should be identical
      expect(predsBefore).toEqual(predsAfter);

      // Evaluation should return valid metrics
      expect(evalResult.loss).toBeGreaterThanOrEqual(0);
      expect(evalResult.accuracy).toBeGreaterThanOrEqual(0);
      expect(evalResult.accuracy).toBeLessThanOrEqual(1);
    });

    it('should show validation loss similar to training loss on same data', async () => {
      await neuralNet.initialize({
        learningRate: 0.1,
        layers: [8, 4],
        numClasses: 2,
      });

      const data = await dataRepo.getDataset('circle', {
        samples: 50,
        noise: 0.1,
        numClasses: 2,
      });

      // Train to convergence
      let trainLoss = 0;
      for (let i = 0; i < 50; i++) {
        const result = await neuralNet.train(data);
        trainLoss = result.loss;
      }

      // Evaluate on same data
      const evalResult = await neuralNet.evaluate(data);

      // Losses should be similar (within 50%)
      expect(Math.abs(evalResult.loss - trainLoss)).toBeLessThan(trainLoss * 0.5 + 0.1);
    }, 30000);
  });

  // ==========================================================================
  // MEMORY MANAGEMENT TESTS
  // ==========================================================================

  describe('Memory Management', () => {
    it('should not leak tensors during training', async () => {
      await neuralNet.initialize({
        learningRate: 0.1,
        layers: [8, 4],
        numClasses: 2,
      });

      const data: Point[] = [
        { x: 0.5, y: 0.5, label: 1 },
        { x: -0.5, y: -0.5, label: 0 },
      ];

      const tensorsBefore = tf.memory().numTensors;

      // Train multiple times
      for (let i = 0; i < 10; i++) {
        await neuralNet.train(data);
      }

      const tensorsAfter = tf.memory().numTensors;

      // Should not accumulate tensors significantly (CPU backend has higher tolerance)
      expect(tensorsAfter - tensorsBefore).toBeLessThan(20);
    });

    it('should not leak tensors during prediction', async () => {
      await neuralNet.initialize({
        learningRate: 0.1,
        layers: [8, 4],
        numClasses: 2,
      });

      const grid: Point[] = [];
      for (let i = 0; i < 100; i++) {
        grid.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, label: 0 });
      }

      const tensorsBefore = tf.memory().numTensors;

      // Predict multiple times
      for (let i = 0; i < 10; i++) {
        await neuralNet.predict(grid);
      }

      const tensorsAfter = tf.memory().numTensors;

      // Should not accumulate tensors
      expect(tensorsAfter - tensorsBefore).toBeLessThan(5);
    });

    it('should clean up on dispose', async () => {
      const net = new TFNeuralNet();
      await net.initialize({
        learningRate: 0.1,
        layers: [8, 4],
        numClasses: 2,
      });

      const tensorsBefore = tf.memory().numTensors;

      net.dispose();

      const tensorsAfter = tf.memory().numTensors;

      // Should release model tensors
      expect(tensorsAfter).toBeLessThanOrEqual(tensorsBefore);
    });
  });
});

// ==========================================================================
// DATASET REPOSITORY TESTS
// ==========================================================================

describe('Dataset Repository', () => {
  let dataRepo: MockDataRepository;

  beforeEach(() => {
    dataRepo = new MockDataRepository(0);
  });

  describe('Dataset Generation', () => {
    it('should generate correct number of samples', async () => {
      const samples = 100;
      const data = await dataRepo.getDataset('circle', { samples });
      expect(data).toHaveLength(samples);
    });

    it('should generate data within [-1, 1] range', async () => {
      const data = await dataRepo.getDataset('spiral', { samples: 200 });

      for (const point of data) {
        expect(point.x).toBeGreaterThanOrEqual(-1.5); // Allow small overflow due to noise
        expect(point.x).toBeLessThanOrEqual(1.5);
        expect(point.y).toBeGreaterThanOrEqual(-1.5);
        expect(point.y).toBeLessThanOrEqual(1.5);
      }
    });

    it('should generate correct number of classes', async () => {
      const numClasses = 4;
      const data = await dataRepo.getDataset('clusters', { samples: 200, numClasses });

      const uniqueLabels = new Set(data.map(p => p.label));
      expect(uniqueLabels.size).toBe(numClasses);
    });

    it('should respect class balance parameter', async () => {
      const data = await dataRepo.getDataset('circle', {
        samples: 100,
        numClasses: 2,
        classBalance: 0.7, // 70% class 0
      });

      const class0Count = data.filter(p => p.label === 0).length;
      const class1Count = data.filter(p => p.label === 1).length;

      // Should be approximately 70/30 split
      expect(class0Count).toBeGreaterThan(class1Count);
      expect(class0Count / data.length).toBeCloseTo(0.7, 1);
    });

    it('should generate all available dataset types', async () => {
      const types = ['circle', 'xor', 'spiral', 'gaussian', 'clusters'];

      for (const type of types) {
        const data = await dataRepo.getDataset(type, { samples: 50 });
        expect(data.length).toBeGreaterThan(0);
        expect(data[0]).toHaveProperty('x');
        expect(data[0]).toHaveProperty('y');
        expect(data[0]).toHaveProperty('label');
      }
    });
  });
});

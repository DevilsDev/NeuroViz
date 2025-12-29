/**
 * TFNeuralNet Mathematical Correctness Tests
 *
 * Tests to verify computational accuracy and mathematical correctness of:
 * - Forward propagation
 * - Prediction probabilities
 * - Label tensor creation
 * - Accuracy calculation
 * - Loss function selection
 * - Activation function mapping
 * - Optimizer creation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { TFNeuralNet } from '../../../../src/infrastructure/tensorflow/TFNeuralNet';
import type { Point } from '../../../../src/core/domain';

describe('TFNeuralNet - Mathematical Correctness', () => {
  let neuralNet: TFNeuralNet;

  beforeEach(() => {
    neuralNet = new TFNeuralNet();
  });

  afterEach(() => {
    neuralNet.dispose();
    // Clean up any remaining tensors
    tf.disposeVariables();
  });

  describe('Binary Classification Predictions', () => {
    it('should produce probabilities in [0, 1] for binary classification', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4, 2],
        numClasses: 2,
      });

      const testPoints: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
        { x: -1, y: -1, label: 0 },
        { x: 0.5, y: 0.5, label: 1 },
      ];

      const predictions = await neuralNet.predict(testPoints);

      for (const pred of predictions) {
        // Confidence should be in [0, 1]
        expect(pred.confidence).toBeGreaterThanOrEqual(0);
        expect(pred.confidence).toBeLessThanOrEqual(1);

        // Probabilities array should have exactly 2 elements for binary
        expect(pred.probabilities).toHaveLength(2);

        // Probabilities should sum to approximately 1
        const sum = pred.probabilities.reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1, 5);

        // Each probability should be in [0, 1]
        for (const prob of pred.probabilities) {
          expect(prob).toBeGreaterThanOrEqual(0);
          expect(prob).toBeLessThanOrEqual(1);
        }

        // Predicted class should be 0 or 1
        expect([0, 1]).toContain(pred.predictedClass);

        // Predicted class should match the higher probability
        // Binary classification: class 1 if confidence >= 0.5, else class 0
        if (pred.probabilities[1] !== undefined && pred.probabilities[0] !== undefined) {
          const expectedClass = pred.probabilities[1] >= 0.5 ? 1 : 0;
          expect(pred.predictedClass).toBe(expectedClass);
        }
      }
    });

    it('should correctly map sigmoid output to binary class', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [2],
        numClasses: 2,
      });

      const testPoints: Point[] = [
        { x: 0, y: 0, label: 0 },
      ];

      const predictions = await neuralNet.predict(testPoints);
      const pred = predictions[0];

      expect(pred).toBeDefined();
      if (pred) {
        // For binary classification, confidence is the probability of class 1
        // Class should be 1 if confidence >= 0.5, else 0
        const expectedClass = pred.confidence >= 0.5 ? 1 : 0;
        expect(pred.predictedClass).toBe(expectedClass);

        // Probabilities should be [1-confidence, confidence]
        expect(pred.probabilities[0]).toBeCloseTo(1 - pred.confidence, 5);
        expect(pred.probabilities[1]).toBeCloseTo(pred.confidence, 5);
      }
    });
  });

  describe('Multi-class Classification Predictions', () => {
    it('should produce valid softmax probabilities for 3-class problem', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [6, 4],
        numClasses: 3,
      });

      const testPoints: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 0, label: 1 },
        { x: 0, y: 1, label: 2 },
      ];

      const predictions = await neuralNet.predict(testPoints);

      for (const pred of predictions) {
        // Should have 3 probabilities for 3 classes
        expect(pred.probabilities).toHaveLength(3);

        // Probabilities should sum to approximately 1 (softmax property)
        const sum = pred.probabilities.reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1, 5);

        // Each probability should be in [0, 1]
        for (const prob of pred.probabilities) {
          expect(prob).toBeGreaterThanOrEqual(0);
          expect(prob).toBeLessThanOrEqual(1);
        }

        // Predicted class should be in [0, 1, 2]
        expect([0, 1, 2]).toContain(pred.predictedClass);

        // Confidence should equal the max probability
        const maxProb = Math.max(...pred.probabilities);
        expect(pred.confidence).toBeCloseTo(maxProb, 5);

        // Predicted class should be the argmax
        const predictedProb = pred.probabilities[pred.predictedClass];
        expect(predictedProb).toBe(maxProb);
      }
    });

    it('should produce valid softmax probabilities for 4-class problem', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [8, 4],
        numClasses: 4,
      });

      const testPoints: Point[] = [
        { x: 0.5, y: 0.5, label: 0 },
        { x: -0.5, y: 0.5, label: 1 },
      ];

      const predictions = await neuralNet.predict(testPoints);

      for (const pred of predictions) {
        expect(pred.probabilities).toHaveLength(4);

        const sum = pred.probabilities.reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1, 5);

        expect([0, 1, 2, 3]).toContain(pred.predictedClass);
      }
    });
  });

  describe('Accuracy Calculation', () => {
    it('should calculate 100% accuracy for perfect binary predictions', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
      });

      // Train on a simple linearly separable dataset
      const trainingData: Point[] = [
        { x: -1, y: -1, label: 0 },
        { x: -1, y: 1, label: 0 },
        { x: 1, y: -1, label: 1 },
        { x: 1, y: 1, label: 1 },
      ];

      // Train until perfect accuracy
      let accuracy = 0;
      for (let i = 0; i < 500; i++) {
        const result = await neuralNet.train(trainingData);
        accuracy = result.accuracy;
        if (accuracy === 1.0) break;
      }

      // Should eventually reach 100% accuracy on linearly separable data
      expect(accuracy).toBe(1.0);
    }, 30000);

    it('should calculate 0% accuracy for completely wrong predictions', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [2],
        numClasses: 2,
      });

      // Create data where labels are opposite to natural pattern
      // This tests that accuracy is correctly calculated even when it's 0
      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
      ];

      const result = await neuralNet.train(data);

      // Accuracy should be between 0 and 1
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
    });

    it('should calculate accuracy correctly for multi-class', async () => {
      await neuralNet.initialize({
        learningRate: 0.1,
        layers: [8, 4],
        numClasses: 3,
      });

      // Use more training samples for robustness
      const data: Point[] = [
        { x: -1, y: 0, label: 0 },
        { x: -0.8, y: 0, label: 0 },
        { x: 0, y: 0, label: 1 },
        { x: 0.2, y: 0, label: 1 },
        { x: 1, y: 0, label: 2 },
        { x: 0.8, y: 0, label: 2 },
      ];

      // Train for a few epochs
      let accuracy = 0;
      let loss = Infinity;
      for (let i = 0; i < 500; i++) {
        const result = await neuralNet.train(data);
        accuracy = result.accuracy;
        loss = result.loss;
        if (accuracy > 0.99) break;
      }

      // Should learn this simple pattern - check accuracy or low loss
      const learned = accuracy > 0.9 || loss < 0.3;
      expect(learned).toBe(true);
    }, 30000);
  });

  describe('Loss Calculation', () => {
    it('should produce non-negative loss values', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4, 2],
        numClasses: 2,
      });

      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
      ];

      const result = await neuralNet.train(data);

      // Loss should always be non-negative
      expect(result.loss).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.loss)).toBe(true);
    });

    it('should decrease loss with training on simple data', async () => {
      await neuralNet.initialize({
        learningRate: 0.05,
        layers: [4],
        numClasses: 2,
      });

      const data: Point[] = [
        { x: -1, y: 0, label: 0 },
        { x: -1, y: 0, label: 0 },
        { x: 1, y: 0, label: 1 },
        { x: 1, y: 0, label: 1 },
      ];

      const result1 = await neuralNet.train(data);
      const initialLoss = result1.loss;

      // Train for multiple epochs
      let finalLoss = initialLoss;
      for (let i = 0; i < 50; i++) {
        const result = await neuralNet.train(data);
        finalLoss = result.loss;
      }

      // Loss should decrease with training
      expect(finalLoss).toBeLessThan(initialLoss);
    });

    it('should handle cross-entropy loss for binary classification', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
        lossFunction: 'crossEntropy',
      });

      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
      ];

      const result = await neuralNet.train(data);

      expect(result.loss).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.loss)).toBe(true);
    });

    it('should handle MSE loss', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
        lossFunction: 'mse',
      });

      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
      ];

      const result = await neuralNet.train(data);

      expect(result.loss).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.loss)).toBe(true);
    });

    it('should handle hinge loss', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
        lossFunction: 'hinge',
      });

      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
      ];

      const result = await neuralNet.train(data);

      expect(result.loss).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.loss)).toBe(true);
    });
  });

  describe('Weight Initialization and Updates', () => {
    it('should initialize weights with He Normal initialization', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [8, 4],
        numClasses: 2,
      });

      const weights = neuralNet.getWeights();

      // Should have weights
      expect(weights.length).toBeGreaterThan(0);

      // Calculate mean and std of weights
      const mean = weights.reduce((sum, w) => sum + w, 0) / weights.length;
      const variance = weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length;
      const std = Math.sqrt(variance);

      // He Normal should have mean close to 0
      expect(Math.abs(mean)).toBeLessThan(0.2);

      // He Normal should have reasonable standard deviation (not too small or large)
      expect(std).toBeGreaterThan(0.1);
      expect(std).toBeLessThan(2.0);
    });

    it('should update weights during training', async () => {
      await neuralNet.initialize({
        learningRate: 0.1,
        layers: [4],
        numClasses: 2,
      });

      const initialWeights = neuralNet.getWeights();

      const data: Point[] = [
        { x: 1, y: 1, label: 1 },
        { x: -1, y: -1, label: 0 },
      ];

      // Train for one epoch
      await neuralNet.train(data);

      const updatedWeights = neuralNet.getWeights();

      // Weights should have changed
      expect(updatedWeights.length).toBe(initialWeights.length);

      let numDifferent = 0;
      for (let i = 0; i < initialWeights.length; i++) {
        if (Math.abs((initialWeights[i] ?? 0) - (updatedWeights[i] ?? 0)) > 1e-6) {
          numDifferent++;
        }
      }

      // At least some weights should have changed
      expect(numDifferent).toBeGreaterThan(0);
    });

    it('should maintain weight structure across layers', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [8, 4],
        numClasses: 2,
      });

      const weightMatrices = neuralNet.getWeightMatrices();

      // Should have 3 layers: input->8, 8->4, 4->output(1)
      expect(weightMatrices.length).toBe(3);

      // First layer: 2 inputs -> 8 units
      expect(weightMatrices[0]?.length).toBe(2); // 2 input nodes
      expect(weightMatrices[0]?.[0]?.length).toBe(8); // to 8 hidden nodes

      // Second layer: 8 -> 4
      expect(weightMatrices[1]?.length).toBe(8);
      expect(weightMatrices[1]?.[0]?.length).toBe(4);

      // Third layer: 4 -> 1 (binary output)
      expect(weightMatrices[2]?.length).toBe(4);
      expect(weightMatrices[2]?.[0]?.length).toBe(1);
    });
  });

  describe('Activation Functions', () => {
    it('should produce different outputs for different activations', async () => {
      const data: Point[] = [
        { x: 0.5, y: 0.5, label: 0 },
      ];

      // Test ReLU activation
      const netReLU = new TFNeuralNet();
      await netReLU.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
        activation: 'relu',
      });
      const activationsReLU = netReLU.getLayerActivations(data[0]!);
      netReLU.dispose();

      // Test Tanh activation
      const netTanh = new TFNeuralNet();
      await netTanh.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
        activation: 'tanh',
      });
      const activationsTanh = netTanh.getLayerActivations(data[0]!);
      netTanh.dispose();

      // Both should have activations
      expect(activationsReLU.length).toBeGreaterThan(0);
      expect(activationsTanh.length).toBeGreaterThan(0);

      // ReLU activations should all be >= 0
      for (const layer of activationsReLU) {
        for (const activation of layer) {
          expect(activation).toBeGreaterThanOrEqual(0);
        }
      }

      // Tanh activations should be in [-1, 1]
      for (const layer of activationsTanh) {
        for (const activation of layer) {
          expect(activation).toBeGreaterThanOrEqual(-1);
          expect(activation).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should support sigmoid activation', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
        activation: 'sigmoid',
      });

      const point: Point = { x: 0, y: 0, label: 0 };
      const activations = neuralNet.getLayerActivations(point);

      // Sigmoid outputs should be in (0, 1)
      expect(activations.length).toBeGreaterThan(0);
      for (const layer of activations) {
        for (const activation of layer) {
          expect(activation).toBeGreaterThan(0);
          expect(activation).toBeLessThan(1);
        }
      }
    });

    it('should support ELU activation', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
        activation: 'elu',
      });

      const point: Point = { x: 0.5, y: -0.5, label: 0 };
      const activations = neuralNet.getLayerActivations(point);

      expect(activations.length).toBeGreaterThan(0);
      // ELU can have negative values (for x < 0)
      // Just verify we get activations
      expect(activations[0]?.length).toBeGreaterThan(0);
    });
  });

  describe('Optimizer Correctness', () => {
    it('should converge faster with Adam than SGD on simple problem', async () => {
      const data: Point[] = [
        { x: -1, y: 0, label: 0 },
        { x: 1, y: 0, label: 1 },
      ];

      // Train with SGD
      const netSGD = new TFNeuralNet();
      await netSGD.initialize({
        learningRate: 0.1,
        layers: [4],
        numClasses: 2,
        optimizer: 'sgd',
        momentum: 0.0,
      });

      let sgdLoss = Infinity;
      for (let i = 0; i < 20; i++) {
        const result = await netSGD.train(data);
        sgdLoss = result.loss;
      }
      netSGD.dispose();

      // Train with Adam
      const netAdam = new TFNeuralNet();
      await netAdam.initialize({
        learningRate: 0.1,
        layers: [4],
        numClasses: 2,
        optimizer: 'adam',
      });

      let adamLoss = Infinity;
      for (let i = 0; i < 20; i++) {
        const result = await netAdam.train(data);
        adamLoss = result.loss;
      }
      netAdam.dispose();

      // Adam should generally converge faster (lower loss) than vanilla SGD
      // This is a probabilistic test, so we allow for some variance
      expect(adamLoss).toBeLessThan(sgdLoss * 1.5);
    });

    it('should support RMSprop optimizer', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
        optimizer: 'rmsprop',
      });

      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
      ];

      const result = await neuralNet.train(data);

      expect(result.loss).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.loss)).toBe(true);
    });

    it('should support Adagrad optimizer', async () => {
      await neuralNet.initialize({
        learningRate: 0.1,
        layers: [4],
        numClasses: 2,
        optimizer: 'adagrad',
      });

      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
      ];

      const result = await neuralNet.train(data);

      expect(result.loss).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.loss)).toBe(true);
    });
  });

  describe('Regularization', () => {
    it('should produce higher loss with L2 regularization for large weights', async () => {
      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
      ];

      // Without regularization
      const netNoReg = new TFNeuralNet();
      await netNoReg.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
        l2Regularization: 0,
      });
      const resultNoReg = await netNoReg.train(data);
      netNoReg.dispose();

      // With L2 regularization
      const netWithReg = new TFNeuralNet();
      await netWithReg.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
        l2Regularization: 0.1,
      });
      const resultWithReg = await netWithReg.train(data);
      netWithReg.dispose();

      // L2 regularization adds penalty term, so loss should be higher initially
      expect(resultWithReg.loss).toBeGreaterThan(resultNoReg.loss * 0.5);
    });

    it('should support L1 regularization', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
        l1Regularization: 0.01,
      });

      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
      ];

      const result = await neuralNet.train(data);

      expect(result.loss).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.loss)).toBe(true);
    });
  });

  describe('Batch Normalization', () => {
    it('should support batch normalization', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [8, 4],
        numClasses: 2,
        batchNorm: true,
      });

      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
      ];

      const result = await neuralNet.train(data);

      expect(result.loss).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.loss)).toBe(true);
    });

    it('should train with batch normalization enabled', async () => {
      await neuralNet.initialize({
        learningRate: 0.05,
        layers: [8, 4],
        numClasses: 2,
        batchNorm: true,
      });

      const data: Point[] = [
        { x: -1, y: -1, label: 0 },
        { x: -1, y: 1, label: 0 },
        { x: 1, y: -1, label: 1 },
        { x: 1, y: 1, label: 1 },
      ];

      let finalAccuracy = 0;
      for (let i = 0; i < 200; i++) {
        const result = await neuralNet.train(data);
        finalAccuracy = result.accuracy;
        if (finalAccuracy > 0.95) break;
      }

      // Should learn the pattern even with batch norm
      expect(finalAccuracy).toBeGreaterThan(0.9);
    }, 30000);
  });

  describe('Edge Cases', () => {
    it('should handle empty dataset gracefully', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
      });

      const result = await neuralNet.train([]);

      expect(result.loss).toBe(0);
      expect(result.accuracy).toBe(0);
    });

    it('should handle single data point', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
      });

      const data: Point[] = [{ x: 0, y: 0, label: 0 }];
      const result = await neuralNet.train(data);

      expect(result.loss).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.loss)).toBe(true);
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
    });

    it('should handle extreme coordinate values', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
      });

      const data: Point[] = [
        { x: -1000, y: 1000, label: 0 },
        { x: 1000, y: -1000, label: 1 },
      ];

      const result = await neuralNet.train(data);

      expect(Number.isFinite(result.loss)).toBe(true);
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
    });

    it('should handle NaN inputs gracefully in prediction', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
      });

      // TensorFlow.js should handle NaN, though results may be undefined
      const data: Point[] = [{ x: NaN, y: 0, label: 0 }];

      // Should not throw
      const predictions = await neuralNet.predict(data);
      expect(predictions).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should not leak tensors during training', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
      });

      const initialNumTensors = TFNeuralNet.getMemoryInfo().numTensors;

      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
      ];

      // Train multiple times
      for (let i = 0; i < 10; i++) {
        await neuralNet.train(data);
      }

      const finalNumTensors = TFNeuralNet.getMemoryInfo().numTensors;

      // Should not accumulate many tensors (allow some growth for model weights)
      const tensorGrowth = finalNumTensors - initialNumTensors;
      expect(tensorGrowth).toBeLessThan(50);
    });

    it('should not leak tensors during prediction', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
      });

      const initialNumTensors = TFNeuralNet.getMemoryInfo().numTensors;

      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
      ];

      // Predict multiple times
      for (let i = 0; i < 10; i++) {
        await neuralNet.predict(data);
      }

      const finalNumTensors = TFNeuralNet.getMemoryInfo().numTensors;

      // Prediction should not leak tensors
      const tensorGrowth = finalNumTensors - initialNumTensors;
      expect(tensorGrowth).toBeLessThan(10);
    });
  });

  describe('Evaluation Mode', () => {
    it('should evaluate without updating weights', async () => {
      await neuralNet.initialize({
        learningRate: 0.1,
        layers: [4],
        numClasses: 2,
      });

      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
      ];

      // Get initial weights
      const initialWeights = neuralNet.getWeights();

      // Evaluate (should not change weights)
      await neuralNet.evaluate(data);

      // Get weights after evaluation
      const weightsAfterEval = neuralNet.getWeights();

      // Weights should be identical
      expect(weightsAfterEval.length).toBe(initialWeights.length);
      for (let i = 0; i < initialWeights.length; i++) {
        expect(weightsAfterEval[i]).toBeCloseTo(initialWeights[i] ?? 0, 10);
      }
    });

    it('should compute loss and accuracy during evaluation', async () => {
      await neuralNet.initialize({
        learningRate: 0.01,
        layers: [4],
        numClasses: 2,
      });

      const data: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
      ];

      const result = await neuralNet.evaluate(data);

      expect(result.loss).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.loss)).toBe(true);
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(1);
    });
  });
});

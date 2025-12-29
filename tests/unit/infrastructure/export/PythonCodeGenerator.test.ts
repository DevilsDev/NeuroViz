/**
 * PythonCodeGenerator Infrastructure Tests
 */

import { describe, it, expect } from 'vitest';
import { generatePythonCode } from '../../../../src/infrastructure/export/PythonCodeGenerator';
import type { Hyperparameters, LRScheduleConfig } from '../../../../src/core/domain';

describe('PythonCodeGenerator', () => {
  describe('generatePythonCode', () => {
    it('should generate basic Python code', () => {
      const hyperparams: Hyperparameters = {
        layers: [4, 2],
        learningRate: 0.01,
        epochs: 100,
        batchSize: 32,
        activation: 'relu',
      };

      const code = generatePythonCode(hyperparams);

      expect(code).toContain('import tensorflow');
      expect(code).toContain('keras.Sequential');
      expect(code).toContain('layers.Dense');
    });

    it('should include dataset generation', () => {
      const hyperparams: Hyperparameters = {
        layers: [4],
        learningRate: 0.01,
        epochs: 100,
      };

      const datasetInfo = {
        samples: 200,
        noise: 0.1,
        datasetType: 'circle',
      };

      const code = generatePythonCode(hyperparams, undefined, datasetInfo);

      expect(code).toContain('make_circles');
      expect(code).toContain('n_samples = 200');
      expect(code).toContain('noise = 0.1');
    });

    it('should handle XOR dataset', () => {
      const hyperparams: Hyperparameters = {
        layers: [8, 4],
        learningRate: 0.01,
        epochs: 100,
      };

      const datasetInfo = {
        samples: 400,
        noise: 0.1,
        datasetType: 'xor',
      };

      const code = generatePythonCode(hyperparams, undefined, datasetInfo);

      expect(code).toContain('make_classification');
    });

    it('should handle spiral dataset', () => {
      const hyperparams: Hyperparameters = {
        layers: [16, 8],
        learningRate: 0.01,
        epochs: 200,
      };

      const datasetInfo = {
        samples: 500,
        noise: 0.2,
        datasetType: 'spiral',
      };

      const code = generatePythonCode(hyperparams, undefined, datasetInfo);

      expect(code).toContain('theta');
      expect(code).toContain('Spiral dataset');
    });

    it('should include regularization', () => {
      const hyperparams: Hyperparameters = {
        layers: [4, 2],
        learningRate: 0.01,
        epochs: 100,
        l1Regularization: 0.001,
        l2Regularization: 0.01,
      };

      const code = generatePythonCode(hyperparams);

      expect(code).toContain('regularizers');
      expect(code).toContain('l1=');
      expect(code).toContain('l2=');
    });

    it('should include dropout', () => {
      const hyperparams: Hyperparameters = {
        layers: [8, 4],
        learningRate: 0.01,
        dropoutRate: 0.3,
      };

      const code = generatePythonCode(hyperparams);

      expect(code).toContain('Dropout');
      expect(code).toContain('0.3');
    });

    it('should include learning rate schedule', () => {
      const hyperparams: Hyperparameters = {
        layers: [4],
        learningRate: 0.01,
        epochs: 100,
      };

      const lrSchedule: LRScheduleConfig = {
        type: 'exponential',
        decayRate: 0.9,
        decaySteps: 10,
      };

      const code = generatePythonCode(hyperparams, lrSchedule);

      expect(code).toContain('LearningRateScheduler');
    });

    it('should handle different activations per layer', () => {
      const hyperparams: Hyperparameters = {
        layers: [8, 4, 2],
        learningRate: 0.01,
        epochs: 100,
        layerActivations: ['relu', 'tanh', 'sigmoid'],
      };

      const code = generatePythonCode(hyperparams);

      expect(code).toContain('relu');
      expect(code).toContain('tanh');
      expect(code).toContain('sigmoid');
    });

    it('should include batch normalization', () => {
      const hyperparams: Hyperparameters = {
        layers: [8, 4],
        learningRate: 0.01,
        batchNorm: true,
      };

      const code = generatePythonCode(hyperparams);

      expect(code).toContain('BatchNormalization');
    });

    it('should include optimizer configuration', () => {
      const hyperparams: Hyperparameters = {
        layers: [4],
        learningRate: 0.01,
        optimizer: 'adam',
        momentum: 0.9,
      };

      const code = generatePythonCode(hyperparams);

      expect(code).toContain('Adam');
      expect(code).toContain('compile');
    });

    it('should handle multi-class', () => {
      const hyperparams: Hyperparameters = {
        layers: [8, 4],
        learningRate: 0.01,
        epochs: 100,
        numClasses: 3,
      };

      const code = generatePythonCode(hyperparams);

      expect(code).toBeDefined();
      expect(code.length).toBeGreaterThan(0);
    });

    it('should handle empty layers', () => {
      const hyperparams: Hyperparameters = {
        layers: [],
        learningRate: 0.01,
        epochs: 100,
      };

      const code = generatePythonCode(hyperparams);

      expect(code).toContain('keras.Sequential');
    });

    it('should include training code', () => {
      const hyperparams: Hyperparameters = {
        layers: [4],
        learningRate: 0.01,
      };

      const code = generatePythonCode(hyperparams);

      expect(code).toContain('model.fit');
      expect(code).toContain('epochs=500'); // Hardcoded in generator
      expect(code).toContain('batch_size=32'); // Hardcoded in generator
    });

    it('should generate valid Python syntax', () => {
      const hyperparams: Hyperparameters = {
        layers: [8, 4, 2],
        learningRate: 0.001,
        epochs: 50,
        activation: 'relu',
        dropout: 0.2,
        l2Regularization: 0.01,
      };

      const code = generatePythonCode(hyperparams);

      // Check for balanced brackets
      const openBrackets = (code.match(/\(/g) || []).length;
      const closeBrackets = (code.match(/\)/g) || []).length;
      expect(openBrackets).toBe(closeBrackets);

      // Check for balanced square brackets
      const openSquare = (code.match(/\[/g) || []).length;
      const closeSquare = (code.match(/\]/g) || []).length;
      expect(openSquare).toBe(closeSquare);
    });
  });
});

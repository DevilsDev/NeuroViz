import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  InitializeNetworkCommand,
  InitializeNetworkConfig,
} from '../../../../src/core/application/commands/InitializeNetworkCommand';
import { ITrainingSession } from '../../../../src/core/application/ITrainingSession';

// Mock TrainingSession for testing
class MockTrainingSession implements Partial<ITrainingSession> {
  setHyperparametersCalled = false;
  lastHyperparameters: any = null;

  async setHyperparameters(hyperparameters: any): Promise<void> {
    this.setHyperparametersCalled = true;
    this.lastHyperparameters = hyperparameters;
  }
}

describe('InitializeNetworkCommand', () => {
  let mockSession: MockTrainingSession;
  let validConfig: InitializeNetworkConfig;

  beforeEach(() => {
    mockSession = new MockTrainingSession();
    validConfig = {
      learningRate: 0.03,
      layers: [4, 4],
      optimizer: 'adam',
      activation: 'relu',
      numClasses: 2,
    };
  });

  describe('validation - learning rate', () => {
    it('should accept valid learning rate', () => {
      const command = new InitializeNetworkCommand(mockSession as any, validConfig);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject negative learning rate', () => {
      const config = { ...validConfig, learningRate: -0.01 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('learningRate')).toBe(true);
    });

    it('should reject zero learning rate', () => {
      const config = { ...validConfig, learningRate: 0 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('learningRate')).toBe(true);
    });

    it('should reject NaN learning rate', () => {
      const config = { ...validConfig, learningRate: NaN };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('learningRate')).toBe(true);
    });

    it('should warn about learning rate > 1', () => {
      const config = { ...validConfig, learningRate: 1.5 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('learningRate')).toBe(true);
      expect(result.errors.get('learningRate')).toContain('less than 1');
    });

    it('should accept learning rate of 1.0', () => {
      const config = { ...validConfig, learningRate: 1.0 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should accept very small learning rates', () => {
      const config = { ...validConfig, learningRate: 1e-7 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });
  });

  describe('validation - layers', () => {
    it('should accept valid layer configuration', () => {
      const config = { ...validConfig, layers: [4, 4, 2] };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject empty layers array', () => {
      const config = { ...validConfig, layers: [] };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('layers')).toBe(true);
      expect(result.errors.get('layers')).toContain('At least one');
    });

    it('should accept single hidden layer', () => {
      const config = { ...validConfig, layers: [4] };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject layers with zero size', () => {
      const config = { ...validConfig, layers: [4, 0, 4] };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('layers')).toBe(true);
      expect(result.errors.get('layers')).toContain('must be positive');
    });

    it('should reject layers with negative size', () => {
      const config = { ...validConfig, layers: [4, -2, 4] };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('layers')).toBe(true);
    });

    it('should reject layers with NaN values', () => {
      const config = { ...validConfig, layers: [4, NaN, 4] };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('layers')).toBe(true);
      expect(result.errors.get('layers')).toContain('valid numbers');
    });

    it('should accept many hidden layers', () => {
      const config = { ...validConfig, layers: [8, 8, 8, 8, 8, 8] };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });
  });

  describe('validation - momentum (SGD optimizer)', () => {
    it('should accept valid momentum for SGD', () => {
      const config = { ...validConfig, optimizer: 'sgd' as const, momentum: 0.9 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject negative momentum', () => {
      const config = { ...validConfig, optimizer: 'sgd' as const, momentum: -0.1 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('momentum')).toBe(true);
    });

    it('should reject momentum >= 1', () => {
      const config = { ...validConfig, optimizer: 'sgd' as const, momentum: 1.0 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('momentum')).toBe(true);
    });

    it('should accept momentum of 0', () => {
      const config = { ...validConfig, optimizer: 'sgd' as const, momentum: 0 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should accept momentum just below 1', () => {
      const config = { ...validConfig, optimizer: 'sgd' as const, momentum: 0.999 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should not validate momentum for non-SGD optimizers', () => {
      const config = { ...validConfig, optimizer: 'adam' as const, momentum: 5 }; // Invalid but ignored
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true); // Momentum only validated for SGD
    });
  });

  describe('validation - regularization', () => {
    it('should accept valid L1 regularization', () => {
      const config = { ...validConfig, l1Regularization: 0.01 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should accept valid L2 regularization', () => {
      const config = { ...validConfig, l2Regularization: 0.01 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject negative L1 regularization', () => {
      const config = { ...validConfig, l1Regularization: -0.01 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('l1Regularization')).toBe(true);
    });

    it('should reject negative L2 regularization', () => {
      const config = { ...validConfig, l2Regularization: -0.01 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('l2Regularization')).toBe(true);
    });

    it('should accept zero regularization', () => {
      const config = { ...validConfig, l1Regularization: 0, l2Regularization: 0 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should accept both L1 and L2 regularization together', () => {
      const config = { ...validConfig, l1Regularization: 0.001, l2Regularization: 0.01 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });
  });

  describe('validation - dropout', () => {
    it('should accept valid dropout rate', () => {
      const config = { ...validConfig, dropoutRate: 0.5 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject negative dropout rate', () => {
      const config = { ...validConfig, dropoutRate: -0.1 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('dropoutRate')).toBe(true);
    });

    it('should reject dropout rate >= 1', () => {
      const config = { ...validConfig, dropoutRate: 1.0 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('dropoutRate')).toBe(true);
    });

    it('should accept dropout rate of 0 (no dropout)', () => {
      const config = { ...validConfig, dropoutRate: 0 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should accept dropout rate just below 1', () => {
      const config = { ...validConfig, dropoutRate: 0.999 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });
  });

  describe('validation - clip norm', () => {
    it('should accept valid clip norm', () => {
      const config = { ...validConfig, clipNorm: 1.0 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject negative clip norm', () => {
      const config = { ...validConfig, clipNorm: -1.0 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('clipNorm')).toBe(true);
    });

    it('should accept clip norm of 0 (disabled)', () => {
      const config = { ...validConfig, clipNorm: 0 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });
  });

  describe('validation - number of classes', () => {
    it('should accept valid number of classes', () => {
      const config = { ...validConfig, numClasses: 3 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject less than 2 classes', () => {
      const config = { ...validConfig, numClasses: 1 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('numClasses')).toBe(true);
    });

    it('should accept 2 classes (binary classification)', () => {
      const config = { ...validConfig, numClasses: 2 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should accept many classes', () => {
      const config = { ...validConfig, numClasses: 100 };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });
  });

  describe('validation - layer activations', () => {
    it('should accept matching layer activations', () => {
      const config = {
        ...validConfig,
        layers: [4, 4, 2],
        layerActivations: ['relu', 'relu', 'sigmoid'] as any,
      };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject mismatched layer activations', () => {
      const config = {
        ...validConfig,
        layers: [4, 4],
        layerActivations: ['relu', 'relu', 'sigmoid'] as any, // Too many
      };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.has('layerActivations')).toBe(true);
    });

    it('should accept undefined layer activations', () => {
      const config = { ...validConfig, layerActivations: undefined };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(true);
    });
  });

  describe('validation - multiple errors', () => {
    it('should report all validation errors', () => {
      const config = {
        ...validConfig,
        learningRate: -0.1,
        layers: [],
        dropoutRate: 2.0,
        numClasses: 1,
      };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      const result = command.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.size).toBeGreaterThanOrEqual(4);
      expect(result.errors.has('learningRate')).toBe(true);
      expect(result.errors.has('layers')).toBe(true);
      expect(result.errors.has('dropoutRate')).toBe(true);
      expect(result.errors.has('numClasses')).toBe(true);
    });
  });

  describe('execute', () => {
    it('should call setHyperparameters on session', async () => {
      const command = new InitializeNetworkCommand(mockSession as any, validConfig);
      await command.execute();

      expect(mockSession.setHyperparametersCalled).toBe(true);
    });

    it('should pass correct hyperparameters to session', async () => {
      const command = new InitializeNetworkCommand(mockSession as any, validConfig);
      await command.execute();

      expect(mockSession.lastHyperparameters).toMatchObject({
        learningRate: 0.03,
        layers: [4, 4],
        optimizer: 'adam',
        activation: 'relu',
        numClasses: 2,
      });
    });

    it('should apply default values for optional parameters', async () => {
      const command = new InitializeNetworkCommand(mockSession as any, validConfig);
      await command.execute();

      expect(mockSession.lastHyperparameters.momentum).toBe(0.9);
      expect(mockSession.lastHyperparameters.l1Regularization).toBe(0);
      expect(mockSession.lastHyperparameters.l2Regularization).toBe(0);
      expect(mockSession.lastHyperparameters.dropoutRate).toBe(0);
      expect(mockSession.lastHyperparameters.clipNorm).toBe(0);
      expect(mockSession.lastHyperparameters.batchNorm).toBe(false);
    });

    it('should use provided optional parameters', async () => {
      const config = {
        ...validConfig,
        momentum: 0.95,
        l1Regularization: 0.001,
        l2Regularization: 0.01,
        dropoutRate: 0.3,
        clipNorm: 1.0,
        batchNorm: true,
      };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      await command.execute();

      expect(mockSession.lastHyperparameters.momentum).toBe(0.95);
      expect(mockSession.lastHyperparameters.l1Regularization).toBe(0.001);
      expect(mockSession.lastHyperparameters.l2Regularization).toBe(0.01);
      expect(mockSession.lastHyperparameters.dropoutRate).toBe(0.3);
      expect(mockSession.lastHyperparameters.clipNorm).toBe(1.0);
      expect(mockSession.lastHyperparameters.batchNorm).toBe(true);
    });

    it('should handle layer activations correctly', async () => {
      const config = {
        ...validConfig,
        layers: [4, 4, 2],
        layerActivations: ['relu', 'tanh', 'sigmoid'] as any,
      };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      await command.execute();

      expect(mockSession.lastHyperparameters.layerActivations).toEqual(['relu', 'tanh', 'sigmoid']);
    });

    it('should set layerActivations to undefined when empty', async () => {
      const config = {
        ...validConfig,
        layerActivations: [] as any,
      };
      const command = new InitializeNetworkCommand(mockSession as any, config);
      await command.execute();

      expect(mockSession.lastHyperparameters.layerActivations).toBeUndefined();
    });

    it('should call onNetworkUpdate callback if provided', async () => {
      const callback = vi.fn();
      const command = new InitializeNetworkCommand(mockSession as any, validConfig, callback);
      await command.execute();

      expect(callback).toHaveBeenCalled();
    });

    it('should not error if onNetworkUpdate callback not provided', async () => {
      const command = new InitializeNetworkCommand(mockSession as any, validConfig);
      await expect(command.execute()).resolves.toBeUndefined();
    });

    it('should wait for setHyperparameters to complete', async () => {
      let completed = false;
      const slowSession = {
        async setHyperparameters() {
          await new Promise(resolve => setTimeout(resolve, 10));
          completed = true;
        },
      };

      const command = new InitializeNetworkCommand(slowSession as any, validConfig);
      await command.execute();

      expect(completed).toBe(true);
    });
  });
});

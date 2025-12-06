import { describe, it, expect, beforeEach } from 'vitest';
import { EarlyStoppingStrategy } from '../../../../src/core/application/training/EarlyStoppingStrategy';

describe('EarlyStoppingStrategy', () => {
  describe('initialization', () => {
    it('should initialize with correct patience', () => {
      const patience = 5;
      const strategy = new EarlyStoppingStrategy(patience);

      expect(strategy.getPatience()).toBe(patience);
      expect(strategy.getBestValLoss()).toBeNull();
      expect(strategy.getEpochsWithoutImprovement()).toBe(0);
    });

    it('should initialize with zero patience (disabled)', () => {
      const strategy = new EarlyStoppingStrategy(0);

      expect(strategy.getPatience()).toBe(0);
    });
  });

  describe('shouldStop - disabled cases', () => {
    it('should not stop when patience is 0 (disabled)', () => {
      const strategy = new EarlyStoppingStrategy(0);

      expect(strategy.shouldStop(0.5)).toBe(false);
      expect(strategy.shouldStop(1.0)).toBe(false);
      expect(strategy.shouldStop(2.0)).toBe(false);
    });

    it('should not stop when patience is negative', () => {
      const strategy = new EarlyStoppingStrategy(-1);

      expect(strategy.shouldStop(0.5)).toBe(false);
    });

    it('should not stop when validation loss is null', () => {
      const strategy = new EarlyStoppingStrategy(5);

      expect(strategy.shouldStop(null)).toBe(false);
      expect(strategy.shouldStop(null)).toBe(false);
    });
  });

  describe('shouldStop - first validation loss', () => {
    it('should not stop on first validation loss', () => {
      const strategy = new EarlyStoppingStrategy(3);

      const shouldStop = strategy.shouldStop(0.5);

      expect(shouldStop).toBe(false);
      expect(strategy.getBestValLoss()).toBe(0.5);
      expect(strategy.getEpochsWithoutImprovement()).toBe(0);
    });

    it('should set best loss on first validation', () => {
      const strategy = new EarlyStoppingStrategy(3);

      strategy.shouldStop(0.8);

      expect(strategy.getBestValLoss()).toBe(0.8);
    });
  });

  describe('shouldStop - improving validation loss', () => {
    it('should not stop when validation loss improves', () => {
      const strategy = new EarlyStoppingStrategy(3);

      strategy.shouldStop(0.5);
      strategy.shouldStop(0.4);
      const shouldStop = strategy.shouldStop(0.3);

      expect(shouldStop).toBe(false);
      expect(strategy.getBestValLoss()).toBe(0.3);
      expect(strategy.getEpochsWithoutImprovement()).toBe(0);
    });

    it('should reset epochs without improvement on improvement', () => {
      const strategy = new EarlyStoppingStrategy(3);

      strategy.shouldStop(0.5); // Best: 0.5, no improvement: 0
      strategy.shouldStop(0.6); // Best: 0.5, no improvement: 1
      strategy.shouldStop(0.4); // Best: 0.4, no improvement: 0 (reset)

      expect(strategy.getEpochsWithoutImprovement()).toBe(0);
      expect(strategy.getBestValLoss()).toBe(0.4);
    });

    it('should handle very small improvements', () => {
      const strategy = new EarlyStoppingStrategy(3);

      strategy.shouldStop(0.5);
      strategy.shouldStop(0.499999);

      expect(strategy.getBestValLoss()).toBe(0.499999);
      expect(strategy.getEpochsWithoutImprovement()).toBe(0);
    });
  });

  describe('shouldStop - no improvement', () => {
    it('should increment epochs without improvement when loss does not improve', () => {
      const strategy = new EarlyStoppingStrategy(5);

      strategy.shouldStop(0.5); // Best: 0.5, no improvement: 0
      strategy.shouldStop(0.6); // Best: 0.5, no improvement: 1
      strategy.shouldStop(0.7); // Best: 0.5, no improvement: 2

      expect(strategy.getEpochsWithoutImprovement()).toBe(2);
      expect(strategy.getBestValLoss()).toBe(0.5);
    });

    it('should trigger early stopping when patience is exceeded', () => {
      const patience = 3;
      const strategy = new EarlyStoppingStrategy(patience);

      strategy.shouldStop(0.5); // Best: 0.5, no improvement: 0
      expect(strategy.shouldStop(0.6)).toBe(false); // no improvement: 1
      expect(strategy.shouldStop(0.7)).toBe(false); // no improvement: 2
      expect(strategy.shouldStop(0.8)).toBe(true); // no improvement: 3 >= patience

      expect(strategy.getEpochsWithoutImprovement()).toBe(3);
    });

    it('should not trigger early stopping before patience is exceeded', () => {
      const patience = 5;
      const strategy = new EarlyStoppingStrategy(patience);

      strategy.shouldStop(0.5);
      expect(strategy.shouldStop(0.6)).toBe(false); // 1 < 5
      expect(strategy.shouldStop(0.6)).toBe(false); // 2 < 5
      expect(strategy.shouldStop(0.6)).toBe(false); // 3 < 5
      expect(strategy.shouldStop(0.6)).toBe(false); // 4 < 5
      expect(strategy.shouldStop(0.6)).toBe(true); // 5 >= 5
    });

    it('should handle equal validation loss as no improvement', () => {
      const strategy = new EarlyStoppingStrategy(2);

      strategy.shouldStop(0.5);
      strategy.shouldStop(0.5); // Equal, not better
      strategy.shouldStop(0.5);

      expect(strategy.getEpochsWithoutImprovement()).toBe(2);
      expect(strategy.shouldStop(0.5)).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset all internal state', () => {
      const strategy = new EarlyStoppingStrategy(3);

      strategy.shouldStop(0.5);
      strategy.shouldStop(0.6);
      strategy.shouldStop(0.7);

      strategy.reset();

      expect(strategy.getBestValLoss()).toBeNull();
      expect(strategy.getEpochsWithoutImprovement()).toBe(0);
    });

    it('should allow new training session after reset', () => {
      const strategy = new EarlyStoppingStrategy(2);

      // First session
      strategy.shouldStop(0.5);
      strategy.shouldStop(0.6);
      strategy.shouldStop(0.7);
      expect(strategy.shouldStop(0.8)).toBe(true);

      // Reset and start new session
      strategy.reset();
      strategy.shouldStop(0.3); // New best

      expect(strategy.getBestValLoss()).toBe(0.3);
      expect(strategy.getEpochsWithoutImprovement()).toBe(0);
      expect(strategy.shouldStop(0.4)).toBe(false);
    });
  });

  describe('setPatience', () => {
    it('should update patience value', () => {
      const strategy = new EarlyStoppingStrategy(3);

      strategy.setPatience(5);

      expect(strategy.getPatience()).toBe(5);
    });

    it('should affect when early stopping triggers', () => {
      const strategy = new EarlyStoppingStrategy(2);

      strategy.shouldStop(0.5);
      expect(strategy.shouldStop(0.6)).toBe(false);
      expect(strategy.shouldStop(0.6)).toBe(true); // Would stop at patience=2

      // Increase patience
      strategy.reset();
      strategy.setPatience(5);

      strategy.shouldStop(0.5);
      expect(strategy.shouldStop(0.6)).toBe(false); // 1 < 5
      expect(strategy.shouldStop(0.6)).toBe(false); // 2 < 5
      expect(strategy.shouldStop(0.6)).toBe(false); // 3 < 5
      expect(strategy.shouldStop(0.6)).toBe(false); // 4 < 5
      expect(strategy.shouldStop(0.6)).toBe(true); // 5 >= 5
    });

    it('should allow disabling early stopping by setting patience to 0', () => {
      const strategy = new EarlyStoppingStrategy(3);

      strategy.shouldStop(0.5);
      strategy.shouldStop(0.6);

      strategy.setPatience(0);

      expect(strategy.shouldStop(0.7)).toBe(false); // Disabled
      expect(strategy.shouldStop(0.8)).toBe(false); // Disabled
    });
  });

  describe('complex scenarios', () => {
    it('should handle oscillating validation loss', () => {
      const strategy = new EarlyStoppingStrategy(4);

      strategy.shouldStop(0.5); // Best: 0.5, no improvement: 0
      expect(strategy.shouldStop(0.6)).toBe(false); // no improvement: 1
      expect(strategy.shouldStop(0.4)).toBe(false); // Best: 0.4, no improvement: 0 (reset)
      expect(strategy.shouldStop(0.5)).toBe(false); // no improvement: 1
      expect(strategy.shouldStop(0.45)).toBe(false); // no improvement: 2
      expect(strategy.shouldStop(0.3)).toBe(false); // Best: 0.3, no improvement: 0 (reset)

      expect(strategy.getBestValLoss()).toBe(0.3);
      expect(strategy.getEpochsWithoutImprovement()).toBe(0);
    });

    it('should handle very long training with intermittent improvements', () => {
      const patience = 10;
      const strategy = new EarlyStoppingStrategy(patience);

      strategy.shouldStop(1.0);
      for (let i = 0; i < 9; i++) {
        expect(strategy.shouldStop(1.1)).toBe(false);
      }
      // At this point, 9 epochs without improvement
      expect(strategy.getEpochsWithoutImprovement()).toBe(9);

      // Improvement resets counter
      strategy.shouldStop(0.9);
      expect(strategy.getEpochsWithoutImprovement()).toBe(0);

      // Can go another 10 epochs without stopping
      for (let i = 0; i < 9; i++) {
        expect(strategy.shouldStop(1.0)).toBe(false);
      }
      expect(strategy.shouldStop(1.0)).toBe(true); // 10th epoch triggers
    });

    it('should handle gradual improvement preventing early stopping', () => {
      const patience = 3;
      const strategy = new EarlyStoppingStrategy(patience);

      strategy.shouldStop(1.0);
      strategy.shouldStop(0.9);
      strategy.shouldStop(0.8);
      strategy.shouldStop(0.7);
      strategy.shouldStop(0.6);
      strategy.shouldStop(0.5);

      // Never stopped because each epoch improved
      expect(strategy.getEpochsWithoutImprovement()).toBe(0);
      expect(strategy.getBestValLoss()).toBe(0.5);
    });
  });

  describe('edge cases', () => {
    it('should handle very large validation losses', () => {
      const strategy = new EarlyStoppingStrategy(3);

      strategy.shouldStop(1e10);
      strategy.shouldStop(1e11);

      expect(strategy.getBestValLoss()).toBe(1e10);
      expect(strategy.getEpochsWithoutImprovement()).toBe(1);
    });

    it('should handle very small validation losses', () => {
      const strategy = new EarlyStoppingStrategy(3);

      strategy.shouldStop(1e-10);
      strategy.shouldStop(1e-11);

      expect(strategy.getBestValLoss()).toBe(1e-11);
      expect(strategy.getEpochsWithoutImprovement()).toBe(0);
    });

    it('should handle negative validation losses', () => {
      const strategy = new EarlyStoppingStrategy(3);

      strategy.shouldStop(-0.5);
      strategy.shouldStop(-0.6); // Better (more negative)
      strategy.shouldStop(-0.4); // Worse (less negative)

      expect(strategy.getBestValLoss()).toBe(-0.6);
      expect(strategy.getEpochsWithoutImprovement()).toBe(1);
    });

    it('should handle patience of 1', () => {
      const strategy = new EarlyStoppingStrategy(1);

      strategy.shouldStop(0.5);
      expect(strategy.shouldStop(0.6)).toBe(true); // Stops immediately on no improvement
    });

    it('should handle very large patience', () => {
      const patience = 1000;
      const strategy = new EarlyStoppingStrategy(patience);

      strategy.shouldStop(0.5);
      for (let i = 0; i < 999; i++) {
        expect(strategy.shouldStop(0.6)).toBe(false);
      }
      expect(strategy.shouldStop(0.6)).toBe(true);
    });
  });
});

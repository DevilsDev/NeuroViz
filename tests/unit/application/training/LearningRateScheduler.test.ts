import { describe, it, expect, beforeEach } from 'vitest';
import { LearningRateScheduler } from '../../../../src/core/application/training/LearningRateScheduler';
import { LRScheduleConfig } from '../../../../src/core/domain';

describe('LearningRateScheduler', () => {
  const initialLR = 0.1;

  describe('initialization', () => {
    it('should initialize with correct initial learning rate', () => {
      const schedule: LRScheduleConfig = { type: 'none' };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      expect(scheduler.getCurrentLR()).toBe(initialLR);
    });

    it('should accept schedule configuration', () => {
      const schedule: LRScheduleConfig = {
        type: 'exponential',
        decayRate: 0.95,
      };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      expect(scheduler.getCurrentLR()).toBe(initialLR);
    });
  });

  describe('none schedule', () => {
    it('should maintain constant learning rate', () => {
      const schedule: LRScheduleConfig = { type: 'none' };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      for (let epoch = 0; epoch < 100; epoch++) {
        const lr = scheduler.calculateLR(epoch);
        expect(lr).toBe(initialLR);
      }
    });
  });

  describe('exponential decay', () => {
    it('should decay learning rate exponentially', () => {
      const decayRate = 0.95;
      const schedule: LRScheduleConfig = {
        type: 'exponential',
        decayRate,
      };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr0 = scheduler.calculateLR(0);
      const lr1 = scheduler.calculateLR(1);
      const lr10 = scheduler.calculateLR(10);

      expect(lr0).toBe(initialLR);
      expect(lr1).toBeCloseTo(initialLR * decayRate);
      expect(lr10).toBeCloseTo(initialLR * Math.pow(decayRate, 10));
    });

    it('should use default decay rate if not provided', () => {
      const schedule: LRScheduleConfig = { type: 'exponential' };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr1 = scheduler.calculateLR(1);
      expect(lr1).toBeCloseTo(initialLR * 0.95); // Default decay rate
    });
  });

  describe('step decay', () => {
    it('should decay learning rate at step intervals', () => {
      const decayRate = 0.5;
      const decaySteps = 10;
      const schedule: LRScheduleConfig = {
        type: 'step',
        decayRate,
        decaySteps,
      };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr0 = scheduler.calculateLR(0);
      const lr9 = scheduler.calculateLR(9);
      const lr10 = scheduler.calculateLR(10);
      const lr19 = scheduler.calculateLR(19);
      const lr20 = scheduler.calculateLR(20);

      expect(lr0).toBe(initialLR);
      expect(lr9).toBe(initialLR); // No decay yet
      expect(lr10).toBeCloseTo(initialLR * decayRate); // First decay
      expect(lr19).toBeCloseTo(initialLR * decayRate); // Still first decay
      expect(lr20).toBeCloseTo(initialLR * decayRate * decayRate); // Second decay
    });

    it('should use default values if not provided', () => {
      const schedule: LRScheduleConfig = { type: 'step' };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr10 = scheduler.calculateLR(10);
      expect(lr10).toBeCloseTo(initialLR * 0.5); // Default decay at step 10
    });
  });

  describe('cosine annealing', () => {
    it('should follow cosine curve from initial to near-zero', () => {
      const maxEpochs = 100;
      const schedule: LRScheduleConfig = { type: 'cosine' };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr0 = scheduler.calculateLR(0, maxEpochs);
      const lr50 = scheduler.calculateLR(50, maxEpochs);
      const lr100 = scheduler.calculateLR(100, maxEpochs);

      expect(lr0).toBeCloseTo(initialLR); // Start at max
      expect(lr50).toBeCloseTo(initialLR * 0.5 * (1 + Math.cos(Math.PI * 0.5))); // Mid-point
      expect(lr100).toBeCloseTo(0, 5); // Near zero at end
    });

    it('should handle missing maxEpochs with default', () => {
      const schedule: LRScheduleConfig = { type: 'cosine' };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr50 = scheduler.calculateLR(50); // Uses default maxEpochs = 100
      expect(lr50).toBeGreaterThan(0);
      expect(lr50).toBeLessThan(initialLR);
    });
  });

  describe('cyclic triangular', () => {
    it('should oscillate in triangular wave pattern', () => {
      const cycleLength = 20;
      const minLR = 0.01;
      const schedule: LRScheduleConfig = {
        type: 'cyclic_triangular',
        cycleLength,
        minLR,
      };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr0 = scheduler.calculateLR(0);
      const lr10 = scheduler.calculateLR(10); // Peak
      const lr20 = scheduler.calculateLR(20); // Back to start
      const lr30 = scheduler.calculateLR(30); // Peak of cycle 2

      expect(lr0).toBeCloseTo(minLR); // Start at min
      expect(lr10).toBeCloseTo(initialLR); // Peak at half cycle
      expect(lr20).toBeCloseTo(minLR); // Back to min after full cycle
      expect(lr30).toBeCloseTo(initialLR); // Peak of second cycle
    });

    it('should use default values if not provided', () => {
      const schedule: LRScheduleConfig = { type: 'cyclic_triangular' };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr0 = scheduler.calculateLR(0);
      expect(lr0).toBeGreaterThan(0);
      expect(lr0).toBeLessThan(initialLR);
    });
  });

  describe('cyclic cosine', () => {
    it('should oscillate in smooth cosine wave pattern', () => {
      const cycleLength = 20;
      const minLR = 0.01;
      const schedule: LRScheduleConfig = {
        type: 'cyclic_cosine',
        cycleLength,
        minLR,
      };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr0 = scheduler.calculateLR(0);
      const lr10 = scheduler.calculateLR(10);
      const lr20 = scheduler.calculateLR(20);
      const lr40 = scheduler.calculateLR(40);

      // Value = minLR + (maxLR - minLR) * [0.5 * (1 + cos(pi * position / cycleLength))]
      // At epoch 0: position 0, angle = 0, cos(0) = 1, value = 1.0 → maxLR
      // At epoch 10: position 10, angle = π/2, cos(π/2) = 0, value = 0.5 → mid
      // At epoch 20: position 0 (20%20), angle = 0, cos(0) = 1, value = 1.0 → maxLR
      // At epoch 40: position 0 (40%20), angle = 0, cos(0) = 1, value = 1.0 → maxLR

      expect(lr0).toBeCloseTo(initialLR); // Start at max
      expect(lr10).toBeCloseTo((minLR + initialLR) / 2); // Midpoint of cycle
      expect(lr20).toBeCloseTo(initialLR); // Back to max (new cycle starts)
      expect(lr40).toBeCloseTo(initialLR); // Still at max (another cycle)
    });

    it('should use default values if not provided', () => {
      const schedule: LRScheduleConfig = { type: 'cyclic_cosine' };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr0 = scheduler.calculateLR(0);
      expect(lr0).toBeCloseTo(initialLR);
    });
  });

  describe('warmup', () => {
    it('should linearly increase LR during warmup period', () => {
      const warmupEpochs = 10;
      const schedule: LRScheduleConfig = {
        type: 'exponential',
        warmupEpochs,
        decayRate: 0.95,
      };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr0 = scheduler.calculateLR(0);
      const lr5 = scheduler.calculateLR(5);
      const lr9 = scheduler.calculateLR(9);
      const lr10 = scheduler.calculateLR(10);

      expect(lr0).toBeCloseTo(initialLR / warmupEpochs); // 1/10 of initial
      expect(lr5).toBeCloseTo(initialLR * 6 / warmupEpochs); // 6/10 of initial
      expect(lr9).toBeCloseTo(initialLR); // Full LR at end of warmup
      expect(lr10).toBeCloseTo(initialLR); // Start decay after warmup
    });

    it('should apply decay after warmup period', () => {
      const warmupEpochs = 10;
      const decayRate = 0.9;
      const schedule: LRScheduleConfig = {
        type: 'exponential',
        warmupEpochs,
        decayRate,
      };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr10 = scheduler.calculateLR(10);
      const lr11 = scheduler.calculateLR(11);
      const lr20 = scheduler.calculateLR(20);

      expect(lr10).toBeCloseTo(initialLR);
      expect(lr11).toBeCloseTo(initialLR * decayRate); // First decay step
      expect(lr20).toBeCloseTo(initialLR * Math.pow(decayRate, 10)); // 10 decay steps
    });

    it('should work with all schedule types', () => {
      const warmupEpochs = 5;
      const scheduleTypes: Array<LRScheduleConfig['type']> = [
        'none',
        'exponential',
        'step',
        'cosine',
        'cyclic_triangular',
        'cyclic_cosine',
      ];

      for (const type of scheduleTypes) {
        const schedule: LRScheduleConfig = { type, warmupEpochs };
        const scheduler = new LearningRateScheduler(initialLR, schedule);

        const lr0 = scheduler.calculateLR(0);
        const lr4 = scheduler.calculateLR(4);

        expect(lr0).toBeLessThan(initialLR); // Warmup in progress
        expect(lr4).toBeCloseTo(initialLR); // Warmup complete
      }
    });
  });

  describe('setInitialLR', () => {
    it('should update initial learning rate and reset current LR', () => {
      const schedule: LRScheduleConfig = { type: 'none' };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      scheduler.calculateLR(10); // Advance some epochs
      const newInitialLR = 0.05;
      scheduler.setInitialLR(newInitialLR);

      expect(scheduler.getCurrentLR()).toBe(newInitialLR);
    });
  });

  describe('setSchedule', () => {
    it('should update schedule configuration', () => {
      const schedule1: LRScheduleConfig = { type: 'none' };
      const scheduler = new LearningRateScheduler(initialLR, schedule1);

      const lr0 = scheduler.calculateLR(0);
      expect(lr0).toBe(initialLR);

      const schedule2: LRScheduleConfig = {
        type: 'exponential',
        decayRate: 0.9,
      };
      scheduler.setSchedule(schedule2);

      const lr1 = scheduler.calculateLR(1);
      expect(lr1).toBeCloseTo(initialLR * 0.9);
    });
  });

  describe('hasSignificantChange', () => {
    it('should detect significant changes above threshold', () => {
      const schedule: LRScheduleConfig = { type: 'none' };
      const scheduler = new LearningRateScheduler(0.1, schedule);

      const previousLR = 0.1;
      scheduler.setInitialLR(0.12); // 20% change

      expect(scheduler.hasSignificantChange(previousLR, 0.01)).toBe(true); // Above 1%
      expect(scheduler.hasSignificantChange(previousLR, 0.25)).toBe(false); // Below 25%
    });

    it('should not detect insignificant changes below threshold', () => {
      const schedule: LRScheduleConfig = { type: 'none' };
      const scheduler = new LearningRateScheduler(0.1, schedule);

      const previousLR = 0.1;
      scheduler.setInitialLR(0.1005); // 0.5% change

      expect(scheduler.hasSignificantChange(previousLR, 0.01)).toBe(false); // Below 1%
    });

    it('should use default threshold of 1% if not provided', () => {
      const schedule: LRScheduleConfig = { type: 'none' };
      const scheduler = new LearningRateScheduler(0.1, schedule);

      const previousLR = 0.1;
      scheduler.setInitialLR(0.102); // 2% change

      expect(scheduler.hasSignificantChange(previousLR)).toBe(true);
    });
  });

  describe('getCurrentLR', () => {
    it('should return current learning rate without recalculation', () => {
      const schedule: LRScheduleConfig = {
        type: 'exponential',
        decayRate: 0.9,
      };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      scheduler.calculateLR(5);
      const currentLR = scheduler.getCurrentLR();

      expect(currentLR).toBeCloseTo(initialLR * Math.pow(0.9, 5));
    });

    it('should not change when called multiple times', () => {
      const schedule: LRScheduleConfig = { type: 'none' };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr1 = scheduler.getCurrentLR();
      const lr2 = scheduler.getCurrentLR();
      const lr3 = scheduler.getCurrentLR();

      expect(lr1).toBe(lr2);
      expect(lr2).toBe(lr3);
    });
  });

  describe('edge cases', () => {
    it('should handle epoch 0 correctly', () => {
      const schedule: LRScheduleConfig = {
        type: 'exponential',
        decayRate: 0.9,
      };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr = scheduler.calculateLR(0);
      expect(lr).toBe(initialLR);
    });

    it('should handle very large epoch numbers', () => {
      const schedule: LRScheduleConfig = {
        type: 'exponential',
        decayRate: 0.99,
      };
      const scheduler = new LearningRateScheduler(initialLR, schedule);

      const lr = scheduler.calculateLR(1000);
      expect(lr).toBeGreaterThan(0);
      expect(lr).toBeLessThan(initialLR);
      expect(isFinite(lr)).toBe(true);
    });

    it('should handle very small initial learning rate', () => {
      const tinyLR = 1e-7;
      const schedule: LRScheduleConfig = {
        type: 'exponential',
        decayRate: 0.95,
      };
      const scheduler = new LearningRateScheduler(tinyLR, schedule);

      const lr = scheduler.calculateLR(10);
      expect(lr).toBeGreaterThan(0);
      expect(lr).toBeLessThan(tinyLR);
    });
  });
});

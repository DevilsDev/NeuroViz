import { describe, it, expect, vi } from 'vitest';
import {
  UpdateTrainingConfigCommand,
  type UpdateTrainingConfigParams,
} from '../../../../src/core/application/commands/UpdateTrainingConfigCommand';
import type { ITrainingSession } from '../../../../src/core/application/ITrainingSession';

function validate(config: UpdateTrainingConfigParams) {
  const session = { setTrainingConfig: vi.fn() } as unknown as ITrainingSession;
  return new UpdateTrainingConfigCommand(session, config).validate();
}

describe('UpdateTrainingConfigCommand', () => {
  describe('maxEpochs / batchSize', () => {
    it('should accept 0 for maxEpochs (unlimited) and batchSize (full batch)', () => {
      expect(validate({ maxEpochs: 0, batchSize: 0 }).isValid).toBe(true);
    });

    it('should accept positive integers', () => {
      expect(validate({ maxEpochs: 100, batchSize: 32 }).isValid).toBe(true);
    });

    it.each([-1, NaN, 2.5])('should reject maxEpochs = %s', (maxEpochs) => {
      expect(validate({ maxEpochs }).errors.has('maxEpochs')).toBe(true);
    });

    it.each([-1, NaN, 2.5])('should reject batchSize = %s', (batchSize) => {
      expect(validate({ batchSize }).errors.has('batchSize')).toBe(true);
    });
  });

  describe('validationSplit', () => {
    it('should reject NaN', () => {
      expect(validate({ validationSplit: NaN }).errors.has('validationSplit')).toBe(true);
    });

    it('should accept 0 and 0.5', () => {
      expect(validate({ validationSplit: 0 }).isValid).toBe(true);
      expect(validate({ validationSplit: 0.5 }).isValid).toBe(true);
    });
  });

  describe('LR schedule fields', () => {
    it('should accept the values sent by the UI', () => {
      const result = validate({ lrSchedule: { type: 'step', decayRate: 0.95, decaySteps: 10, warmupEpochs: 0 } });
      expect(result.isValid).toBe(true);
    });

    it.each([0, -5, 1.5, NaN])('should reject decaySteps = %s', (decaySteps) => {
      expect(validate({ lrSchedule: { type: 'step', decaySteps } }).errors.has('decaySteps')).toBe(true);
    });

    it.each([0, -0.5, 1.5, NaN])('should reject decayRate = %s', (decayRate) => {
      expect(validate({ lrSchedule: { type: 'exponential', decayRate } }).errors.has('decayRate')).toBe(true);
    });

    it.each([-1, 2.5, NaN])('should reject warmupEpochs = %s', (warmupEpochs) => {
      expect(validate({ lrSchedule: { type: 'none', warmupEpochs } }).errors.has('warmupEpochs')).toBe(true);
    });
  });
});

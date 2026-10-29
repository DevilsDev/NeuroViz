import { describe, it, expect, vi } from 'vitest';
import { StepTrainingCommand } from '../../../../src/core/application/commands/StepTrainingCommand';
import type { ITrainingSession } from '../../../../src/core/application/ITrainingSession';
import type { Point } from '../../../../src/core/domain';

function createSession(trainingData: Point[]): ITrainingSession {
  return {
    getState: vi.fn(() => ({ isInitialised: true, datasetLoaded: true, isRunning: false, isPaused: false })),
    getTrainingData: vi.fn(() => trainingData),
    step: vi.fn().mockResolvedValue(undefined),
  } as unknown as ITrainingSession;
}

describe('StepTrainingCommand', () => {
  it('should be valid when there is training data', () => {
    const command = new StepTrainingCommand(createSession([{ x: 0, y: 0, label: 0 }]));
    expect(command.validate().isValid).toBe(true);
  });

  it('should reject stepping when the training set is empty', () => {
    const result = new StepTrainingCommand(createSession([])).validate();

    expect(result.isValid).toBe(false);
    expect(result.message).toMatch(/No training data/);
  });
});

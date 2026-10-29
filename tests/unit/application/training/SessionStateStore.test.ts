import { describe, it, expect, vi } from 'vitest';
import { SessionStateStore } from '../../../../src/core/application/training/SessionStateStore';
import { DEFAULT_TRAINING_CONFIG } from '../../../../src/core/domain';

vi.mock('../../../../src/infrastructure/logging/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe('SessionStateStore - listeners', () => {
  it('should keep notifying the remaining listeners when one throws', async () => {
    const { logger } = await import('../../../../src/infrastructure/logging/Logger');
    const store = new SessionStateStore({ ...DEFAULT_TRAINING_CONFIG });
    const after = vi.fn();
    store.addListener(() => {
      throw new Error('subscriber bug');
    });
    store.addListener(after);

    expect(() => store.notifyListeners('trainingStep')).not.toThrow();
    expect(after).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalled();
  });
});

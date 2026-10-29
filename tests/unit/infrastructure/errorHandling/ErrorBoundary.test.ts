/**
 * ErrorBoundary listener lifecycle tests
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { ErrorBoundary } from '../../../../src/infrastructure/errorHandling/ErrorBoundary';

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('init() is idempotent: one listener per event type', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const boundary = new ErrorBoundary({ showToasts: false });
    boundary.init();
    boundary.init();

    const types = add.mock.calls.map(([type]) => type);
    expect(types.filter(t => t === 'error')).toHaveLength(1);
    expect(types.filter(t => t === 'unhandledrejection')).toHaveLength(1);
    boundary.dispose();
  });

  it('dispose() removes the exact handlers added by init()', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const boundary = new ErrorBoundary({ showToasts: false });
    boundary.init();
    boundary.dispose();

    for (const [type, handler] of add.mock.calls) {
      expect(remove).toHaveBeenCalledWith(type, handler);
    }
  });

  it('can be re-initialised after dispose()', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const boundary = new ErrorBoundary({ showToasts: false });
    boundary.init();
    boundary.dispose();
    boundary.init();
    expect(add.mock.calls.filter(([t]) => t === 'error')).toHaveLength(2);
    boundary.dispose();
  });
});

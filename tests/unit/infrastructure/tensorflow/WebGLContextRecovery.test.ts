import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebGLContextRecovery } from '../../../../src/infrastructure/tensorflow/WebGLContextRecovery';

describe('WebGLContextRecovery', () => {
  let onContextLost: ReturnType<typeof vi.fn>;
  let onContextRestored: ReturnType<typeof vi.fn>;
  let recovery: WebGLContextRecovery;

  beforeEach(() => {
    onContextLost = vi.fn();
    onContextRestored = vi.fn();
    recovery = new WebGLContextRecovery({ onContextLost, onContextRestored });
  });

  afterEach(() => {
    recovery.dispose();
  });

  describe('init()', () => {
    it('is idempotent — second call is a no-op', () => {
      recovery.init();
      expect(recovery.isInitialised).toBe(true);
      recovery.init();
      expect(recovery.isInitialised).toBe(true);
    });

    it('attaches listeners in capture phase so events from any canvas reach it', () => {
      const spy = vi.spyOn(document, 'addEventListener');
      recovery.init();
      // Should attach both lost + restored handlers with capture=true
      expect(spy).toHaveBeenCalledWith('webglcontextlost', expect.any(Function), true);
      expect(spy).toHaveBeenCalledWith('webglcontextrestored', expect.any(Function), true);
      spy.mockRestore();
    });
  });

  describe('dispose()', () => {
    it('detaches listeners', () => {
      recovery.init();
      const spy = vi.spyOn(document, 'removeEventListener');
      recovery.dispose();
      expect(spy).toHaveBeenCalledWith('webglcontextlost', expect.any(Function), true);
      expect(spy).toHaveBeenCalledWith('webglcontextrestored', expect.any(Function), true);
      expect(recovery.isInitialised).toBe(false);
      spy.mockRestore();
    });

    it('is idempotent — second call is a no-op', () => {
      recovery.init();
      recovery.dispose();
      expect(() => recovery.dispose()).not.toThrow();
    });

    it('dispose without init is a no-op', () => {
      expect(() => recovery.dispose()).not.toThrow();
      expect(recovery.isInitialised).toBe(false);
    });
  });

  describe('webglcontextlost handling', () => {
    it('invokes onContextLost when a webglcontextlost event fires', () => {
      recovery.init();
      const canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      const event = new Event('webglcontextlost', { bubbles: true, cancelable: true });
      canvas.dispatchEvent(event);
      expect(onContextLost).toHaveBeenCalledTimes(1);
      document.body.removeChild(canvas);
    });

    it('calls preventDefault so the browser can attempt restoration', () => {
      recovery.init();
      const canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      const event = new Event('webglcontextlost', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      canvas.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
      document.body.removeChild(canvas);
    });

    it('does not invoke onContextLost if dispose() was called first', () => {
      recovery.init();
      recovery.dispose();
      const canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      canvas.dispatchEvent(new Event('webglcontextlost', { bubbles: true, cancelable: true }));
      expect(onContextLost).not.toHaveBeenCalled();
      document.body.removeChild(canvas);
    });

    it('swallows errors thrown by the onContextLost callback', () => {
      const throwing = vi.fn(() => { throw new Error('boom'); });
      const rec = new WebGLContextRecovery({ onContextLost: throwing });
      rec.init();
      const canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      expect(() => {
        canvas.dispatchEvent(new Event('webglcontextlost', { bubbles: true, cancelable: true }));
      }).not.toThrow();
      expect(throwing).toHaveBeenCalled();
      rec.dispose();
      document.body.removeChild(canvas);
    });
  });

  describe('webglcontextrestored handling', () => {
    it('invokes onContextRestored when a webglcontextrestored event fires', () => {
      recovery.init();
      const canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      canvas.dispatchEvent(new Event('webglcontextrestored', { bubbles: true, cancelable: true }));
      expect(onContextRestored).toHaveBeenCalledTimes(1);
      document.body.removeChild(canvas);
    });

    it('is safe when onContextRestored is not provided', () => {
      const rec = new WebGLContextRecovery({ onContextLost: vi.fn() });
      rec.init();
      const canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      expect(() => {
        canvas.dispatchEvent(new Event('webglcontextrestored', { bubbles: true, cancelable: true }));
      }).not.toThrow();
      rec.dispose();
      document.body.removeChild(canvas);
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WebGLContextRecovery,
  resolveTfWebGLCanvas,
} from '../../../../src/infrastructure/tensorflow/WebGLContextRecovery';

/** Fires a cancelable WebGL context event on `target`. */
function fire(target: EventTarget, type: 'webglcontextlost' | 'webglcontextrestored'): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

describe('WebGLContextRecovery', () => {
  let onContextLost: ReturnType<typeof vi.fn>;
  let onContextRestored: ReturnType<typeof vi.fn>;
  /** Stand-in for TF.js's internal canvas: never attached to the DOM. */
  let tfCanvas: HTMLCanvasElement;
  let recovery: WebGLContextRecovery;

  beforeEach(() => {
    onContextLost = vi.fn();
    onContextRestored = vi.fn();
    tfCanvas = document.createElement('canvas');
    recovery = new WebGLContextRecovery({ onContextLost, onContextRestored }, () => tfCanvas);
  });

  afterEach(() => {
    recovery.dispose();
  });

  describe('init()', () => {
    it('is idempotent — second call is a no-op', () => {
      const spy = vi.spyOn(tfCanvas, 'addEventListener');
      recovery.init();
      expect(recovery.isInitialised).toBe(true);
      recovery.init();
      expect(recovery.isInitialised).toBe(true);
      expect(spy).toHaveBeenCalledTimes(2); // lost + restored, once
    });

    it('attaches listeners to the TF.js canvas, not to document', () => {
      const canvasSpy = vi.spyOn(tfCanvas, 'addEventListener');
      const documentSpy = vi.spyOn(document, 'addEventListener');
      recovery.init();
      expect(canvasSpy).toHaveBeenCalledWith('webglcontextlost', expect.any(Function));
      expect(canvasSpy).toHaveBeenCalledWith('webglcontextrestored', expect.any(Function));
      expect(documentSpy).not.toHaveBeenCalledWith('webglcontextlost', expect.anything(), expect.anything());
      documentSpy.mockRestore();
    });

    it('attaches nothing when no TF.js WebGL canvas is available (e.g. CPU backend)', () => {
      const documentSpy = vi.spyOn(document, 'addEventListener');
      const rec = new WebGLContextRecovery({ onContextLost }, () => null);
      rec.init();
      expect(documentSpy).not.toHaveBeenCalledWith('webglcontextlost', expect.anything(), expect.anything());
      fire(document.body, 'webglcontextlost');
      expect(onContextLost).not.toHaveBeenCalled();
      rec.dispose();
      documentSpy.mockRestore();
    });

    it('does not throw when the canvas resolver throws', () => {
      const rec = new WebGLContextRecovery({ onContextLost }, () => {
        throw new Error('backend unavailable');
      });
      expect(() => rec.init()).not.toThrow();
      rec.dispose();
    });
  });

  describe('dispose()', () => {
    it('detaches listeners from the TF.js canvas', () => {
      recovery.init();
      const spy = vi.spyOn(tfCanvas, 'removeEventListener');
      recovery.dispose();
      expect(spy).toHaveBeenCalledWith('webglcontextlost', expect.any(Function));
      expect(spy).toHaveBeenCalledWith('webglcontextrestored', expect.any(Function));
      expect(recovery.isInitialised).toBe(false);
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
    it('invokes onContextLost when the detached TF.js canvas loses its context', () => {
      recovery.init();
      fire(tfCanvas, 'webglcontextlost');
      expect(onContextLost).toHaveBeenCalledTimes(1);
    });

    it('ignores context loss on other canvases attached to the page (e.g. three.js)', () => {
      recovery.init();
      const threeCanvas = document.createElement('canvas');
      document.body.appendChild(threeCanvas);
      const event = fire(threeCanvas, 'webglcontextlost');
      expect(onContextLost).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
      document.body.removeChild(threeCanvas);
    });

    it('calls preventDefault so the browser can attempt restoration', () => {
      recovery.init();
      const event = fire(tfCanvas, 'webglcontextlost');
      expect(event.defaultPrevented).toBe(true);
    });

    it('does not invoke onContextLost if dispose() was called first', () => {
      recovery.init();
      recovery.dispose();
      fire(tfCanvas, 'webglcontextlost');
      expect(onContextLost).not.toHaveBeenCalled();
    });

    it('swallows errors thrown by the onContextLost callback', () => {
      const throwing = vi.fn(() => { throw new Error('boom'); });
      const rec = new WebGLContextRecovery({ onContextLost: throwing }, () => tfCanvas);
      rec.init();
      expect(() => fire(tfCanvas, 'webglcontextlost')).not.toThrow();
      expect(throwing).toHaveBeenCalled();
      rec.dispose();
    });
  });

  describe('webglcontextrestored handling', () => {
    it('invokes onContextRestored when the TF.js canvas context is restored', () => {
      recovery.init();
      fire(tfCanvas, 'webglcontextrestored');
      expect(onContextRestored).toHaveBeenCalledTimes(1);
    });

    it('ignores restore events from other canvases', () => {
      recovery.init();
      const threeCanvas = document.createElement('canvas');
      document.body.appendChild(threeCanvas);
      fire(threeCanvas, 'webglcontextrestored');
      expect(onContextRestored).not.toHaveBeenCalled();
      document.body.removeChild(threeCanvas);
    });

    it('is safe when onContextRestored is not provided', () => {
      const rec = new WebGLContextRecovery({ onContextLost: vi.fn() }, () => tfCanvas);
      rec.init();
      expect(() => fire(tfCanvas, 'webglcontextrestored')).not.toThrow();
      rec.dispose();
    });
  });

  describe('resolveTfWebGLCanvas()', () => {
    it('returns null when the active TF.js backend is not webgl', async () => {
      const tf = await import('@tensorflow/tfjs');
      await tf.setBackend('cpu');
      expect(resolveTfWebGLCanvas()).toBeNull();
    });
  });
});

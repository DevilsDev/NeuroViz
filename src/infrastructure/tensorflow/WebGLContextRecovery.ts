/**
 * WebGL context-loss recovery.
 *
 * TensorFlow.js WebGL backend runs training on an internal canvas whose
 * WebGL context can be lost under the following conditions:
 *   - Backgrounded tab on mobile GPUs reclaiming VRAM
 *   - Driver reset (power event, GPU crash)
 *   - Another application triggering a WebGL context reset
 *   - Out-of-memory pressure from other WebGL tabs
 *
 * When that happens, the next TF.js operation throws a cryptic error and
 * the UI silently displays stale state. This module listens for
 * `webglcontextlost` / `webglcontextrestored` on TF.js's own canvas so the app
 * can stop training and later re-enable the training controls.
 *
 * The listeners are attached directly to the TF.js canvas, NOT to `document`:
 * TF.js creates its canvas (an HTMLCanvasElement or OffscreenCanvas) without
 * attaching it to the DOM, so its events never reach `document`, while other
 * WebGL canvases on the page (e.g. the three.js 3D view) ARE attached. A
 * document-level listener therefore missed TF.js context loss and wrongly
 * reacted to three.js context loss.
 */

import * as tf from '@tensorflow/tfjs';

export interface WebGLContextRecoveryCallbacks {
  /**
   * Called when the TF.js WebGL context is lost.
   * The implementation should:
   *   1. Stop the training session if running
   *   2. Dispose the neural network
   *   3. Surface a user-visible toast/notification
   *   4. Offer a path to reinitialise
   */
  onContextLost: () => void;

  /**
   * Called when a previously lost TF.js WebGL context is restored by the
   * browser. The implementation should clear any "unhealthy" flags and let the
   * user reinitialise the network when they are ready.
   */
  onContextRestored?: () => void;
}

/** Returns the event target whose WebGL context should be monitored, or null. */
export type WebGLCanvasResolver = () => EventTarget | null | undefined;

/**
 * Resolves the canvas backing the active TF.js WebGL backend.
 * Returns null when the active backend is not `webgl` (e.g. CPU fallback),
 * in which case there is no GPU context to lose.
 */
export function resolveTfWebGLCanvas(
  tfApi: { backend: () => unknown; getBackend: () => string } = tf
): EventTarget | null {
  try {
    // tf.getBackend() only reads an engine field that stays unset until a
    // backend is initialised, and the app builds before any TF.js op runs.
    // tf.backend() initialises the best registered backend (synchronously for
    // webgl), creating the same context the first train/predict would create.
    const backend = tfApi.backend() as { gpgpu?: { gl?: { canvas?: EventTarget } } } | null;
    if (tfApi.getBackend() !== 'webgl') return null;
    // MathBackendWebGL exposes its GPGPUContext as `gpgpu`; the canvas is the
    // one its WebGL context was created on (backend_webgl.js: gpgpu.gl.canvas).
    return backend?.gpgpu?.gl?.canvas ?? null;
  } catch {
    return null;
  }
}

/**
 * Attaches WebGL context-loss / restore listeners to the TF.js canvas.
 *
 * Usage:
 *   const recovery = new WebGLContextRecovery({
 *     onContextLost: () => { session.stop(); neuralNet.dispose(); toast.error(...); },
 *     onContextRestored: () => { toast.info('GPU restored'); },
 *   });
 *   recovery.init();
 *   // ... later
 *   recovery.dispose();
 */
export class WebGLContextRecovery {
  private readonly callbacks: WebGLContextRecoveryCallbacks;
  private readonly resolveCanvas: WebGLCanvasResolver;
  private initialised = false;
  private canvas: EventTarget | null = null;
  private boundLostHandler: ((event: Event) => void) | null = null;
  private boundRestoredHandler: ((event: Event) => void) | null = null;

  /**
   * @param callbacks - Handlers for context loss / restore
   * @param resolveCanvas - Returns the canvas to monitor; defaults to the
   *   active TF.js WebGL backend's canvas. Injectable for tests.
   */
  constructor(
    callbacks: WebGLContextRecoveryCallbacks,
    resolveCanvas: WebGLCanvasResolver = resolveTfWebGLCanvas
  ) {
    this.callbacks = callbacks;
    this.resolveCanvas = resolveCanvas;
  }

  /**
   * Attach listeners. Safe to call only once; subsequent calls are no-ops.
   * If no TF.js WebGL canvas exists (e.g. CPU backend) nothing is attached.
   */
  init(): void {
    if (this.initialised) return;

    let canvas: EventTarget | null = null;
    try {
      canvas = this.resolveCanvas() ?? null;
    } catch {
      canvas = null;
    }
    this.initialised = true;
    if (!canvas) return;

    this.boundLostHandler = (event: Event): void => {
      if (event.target !== canvas) return;
      // preventDefault is required for the browser to attempt to restore
      // the context later. Without this, webglcontextrestored never fires.
      event.preventDefault();
      try {
        this.callbacks.onContextLost();
      } catch {
        // Swallow errors from the callback — we are already in an error
        // path and must not let a bad handler prevent recovery listener
        // cleanup.
      }
    };

    this.boundRestoredHandler = (event: Event): void => {
      if (event.target !== canvas) return;
      if (!this.callbacks.onContextRestored) return;
      try {
        this.callbacks.onContextRestored();
      } catch {
        // Same rationale as above.
      }
    };

    canvas.addEventListener('webglcontextlost', this.boundLostHandler);
    canvas.addEventListener('webglcontextrestored', this.boundRestoredHandler);
    this.canvas = canvas;
  }

  /**
   * Detach listeners. Idempotent.
   */
  dispose(): void {
    if (!this.initialised) return;

    if (this.canvas) {
      if (this.boundLostHandler) {
        this.canvas.removeEventListener('webglcontextlost', this.boundLostHandler);
      }
      if (this.boundRestoredHandler) {
        this.canvas.removeEventListener('webglcontextrestored', this.boundRestoredHandler);
      }
    }
    this.boundLostHandler = null;
    this.boundRestoredHandler = null;
    this.canvas = null;
    this.initialised = false;
  }

  /**
   * Test-only probe for initialisation state.
   */
  get isInitialised(): boolean {
    return this.initialised;
  }
}

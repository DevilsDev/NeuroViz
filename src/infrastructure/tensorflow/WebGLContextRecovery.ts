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
 * the UI silently displays stale state. This module attaches a document-level
 * listener (capture phase) for `webglcontextlost` so any lost context on any
 * canvas reaches the recovery callback, and a matching `webglcontextrestored`
 * listener so the app can re-enable training controls automatically.
 *
 * The listener is attached at document scope rather than on a specific canvas
 * because the TF.js WebGL backend owns its canvas internally and does not
 * expose a stable reference across versions.
 */

export interface WebGLContextRecoveryCallbacks {
  /**
   * Called when any WebGL context on the page is lost.
   * The implementation should:
   *   1. Stop the training session if running
   *   2. Dispose the neural network
   *   3. Surface a user-visible toast/notification
   *   4. Offer a path to reinitialise
   */
  onContextLost: () => void;

  /**
   * Called when a previously lost WebGL context is restored by the browser.
   * The implementation should clear any "unhealthy" flags and let the user
   * reinitialise the network when they are ready.
   */
  onContextRestored?: () => void;
}

/**
 * Attaches document-level WebGL context-loss / restore listeners.
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
  private initialised = false;
  private boundLostHandler: ((event: Event) => void) | null = null;
  private boundRestoredHandler: ((event: Event) => void) | null = null;

  constructor(callbacks: WebGLContextRecoveryCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Attach listeners. Safe to call only once; subsequent calls are no-ops.
   */
  init(): void {
    if (this.initialised) return;
    if (typeof document === 'undefined') return;

    this.boundLostHandler = (event: Event): void => {
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

    this.boundRestoredHandler = (_event: Event): void => {
      if (!this.callbacks.onContextRestored) return;
      try {
        this.callbacks.onContextRestored();
      } catch {
        // Same rationale as above.
      }
    };

    // Capture phase so we see events from any canvas on the page, including
    // canvases owned internally by TF.js that never bubble to document.
    document.addEventListener('webglcontextlost', this.boundLostHandler, true);
    document.addEventListener('webglcontextrestored', this.boundRestoredHandler, true);
    this.initialised = true;
  }

  /**
   * Detach listeners. Idempotent.
   */
  dispose(): void {
    if (!this.initialised) return;
    if (typeof document === 'undefined') return;

    if (this.boundLostHandler) {
      document.removeEventListener('webglcontextlost', this.boundLostHandler, true);
      this.boundLostHandler = null;
    }
    if (this.boundRestoredHandler) {
      document.removeEventListener('webglcontextrestored', this.boundRestoredHandler, true);
      this.boundRestoredHandler = null;
    }
    this.initialised = false;
  }

  /**
   * Test-only probe for initialisation state.
   */
  get isInitialised(): boolean {
    return this.initialised;
  }
}

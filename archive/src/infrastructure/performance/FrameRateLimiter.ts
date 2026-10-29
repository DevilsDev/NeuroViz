/**
 * Frame Rate Limiter
 * 
 * Controls rendering frequency to save battery and reduce CPU usage.
 * Supports multiple modes: full, balanced, and battery saver.
 */

export type PerformanceMode = 'full' | 'balanced' | 'battery';

export interface FrameRateLimiterConfig {
  mode: PerformanceMode;
  targetFps: number;
  adaptiveThrottling: boolean;
}

export interface PerformanceStats {
  currentFps: number;
  averageFps: number;
  frameTime: number;
  droppedFrames: number;
  throttleRatio: number;
}

const MODE_CONFIGS: Record<PerformanceMode, { targetFps: number; renderSkip: number; visualQuality: number }> = {
  full: { targetFps: 60, renderSkip: 1, visualQuality: 1.0 },
  balanced: { targetFps: 30, renderSkip: 2, visualQuality: 0.75 },
  battery: { targetFps: 15, renderSkip: 4, visualQuality: 0.5 },
};

/**
 * Manages frame rate limiting and performance monitoring.
 */
export class FrameRateLimiter {
  private mode: PerformanceMode = 'full';
  private targetFps: number = 60;
  private frameInterval: number = 1000 / 60;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private skipCounter: number = 0;
  private renderSkip: number = 1;
  private fpsHistory: number[] = [];
  private droppedFrames: number = 0;
  private adaptiveThrottling: boolean = true;
  private onModeChange?: (mode: PerformanceMode) => void;

  constructor(config?: Partial<FrameRateLimiterConfig>) {
    if (config?.mode) this.setMode(config.mode);
    if (config?.targetFps) this.setTargetFps(config.targetFps);
    if (config?.adaptiveThrottling !== undefined) {
      this.adaptiveThrottling = config.adaptiveThrottling;
    }
  }

  /**
   * Sets the performance mode.
   */
  setMode(mode: PerformanceMode): void {
    this.mode = mode;
    const config = MODE_CONFIGS[mode];
    this.targetFps = config.targetFps;
    this.frameInterval = 1000 / config.targetFps;
    this.renderSkip = config.renderSkip;
    this.onModeChange?.(mode);
  }

  /**
   * Gets the current performance mode.
   */
  getMode(): PerformanceMode {
    return this.mode;
  }

  /**
   * Sets a custom target FPS.
   */
  setTargetFps(fps: number): void {
    this.targetFps = Math.max(1, Math.min(60, fps));
    this.frameInterval = 1000 / this.targetFps;
  }

  /**
   * Gets the current target FPS.
   */
  getTargetFps(): number {
    return this.targetFps;
  }

  /**
   * Gets the visual quality multiplier for current mode.
   */
  getVisualQuality(): number {
    return MODE_CONFIGS[this.mode].visualQuality;
  }

  /**
   * Checks if a frame should be rendered based on timing.
   */
  shouldRender(timestamp: number = performance.now()): boolean {
    const elapsed = timestamp - this.lastFrameTime;

    // Check frame skip for battery modes
    this.skipCounter++;
    if (this.skipCounter < this.renderSkip) {
      return false;
    }
    this.skipCounter = 0;

    // Check frame interval
    if (elapsed < this.frameInterval) {
      return false;
    }

    // Update timing
    const actualFps = 1000 / elapsed;
    this.fpsHistory.push(actualFps);
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }

    // Track dropped frames
    if (elapsed > this.frameInterval * 2) {
      this.droppedFrames++;
    }

    this.lastFrameTime = timestamp;
    this.frameCount++;

    return true;
  }

  /**
   * Wraps a render function with frame limiting.
   */
  throttle<T extends (...args: unknown[]) => void>(fn: T): T {
    return ((...args: unknown[]) => {
      if (this.shouldRender()) {
        fn(...args);
      }
    }) as T;
  }

  /**
   * Creates a throttled requestAnimationFrame loop.
   */
  createAnimationLoop(callback: (deltaTime: number) => void): { start: () => void; stop: () => void } {
    let animationId: number | null = null;
    let lastTime = 0;
    let running = false;

    const loop = (timestamp: number): void => {
      if (!running) return;

      if (this.shouldRender(timestamp)) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        callback(deltaTime);
      }

      animationId = requestAnimationFrame(loop);
    };

    return {
      start: () => {
        if (running) return;
        running = true;
        lastTime = performance.now();
        animationId = requestAnimationFrame(loop);
      },
      stop: () => {
        running = false;
        if (animationId !== null) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      },
    };
  }

  /**
   * Gets current performance statistics.
   */
  getStats(): PerformanceStats {
    const currentFps = this.fpsHistory.length > 0 
      ? this.fpsHistory[this.fpsHistory.length - 1] ?? 0 
      : 0;
    const averageFps = this.fpsHistory.length > 0
      ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
      : 0;

    return {
      currentFps: Math.round(currentFps),
      averageFps: Math.round(averageFps),
      frameTime: this.frameInterval,
      droppedFrames: this.droppedFrames,
      throttleRatio: this.renderSkip,
    };
  }

  /**
   * Resets statistics.
   */
  resetStats(): void {
    this.fpsHistory = [];
    this.droppedFrames = 0;
    this.frameCount = 0;
  }

  /**
   * Registers a callback for mode changes.
   */
  onModeChanged(callback: (mode: PerformanceMode) => void): void {
    this.onModeChange = callback;
  }

  /**
   * Automatically adjusts mode based on performance.
   */
  autoAdjust(): void {
    if (!this.adaptiveThrottling) return;

    const stats = this.getStats();
    
    // If FPS is consistently low, downgrade mode
    if (stats.averageFps < this.targetFps * 0.7 && this.mode !== 'battery') {
      if (this.mode === 'full') {
        this.setMode('balanced');
      } else if (this.mode === 'balanced') {
        this.setMode('battery');
      }
    }
    
    // If FPS is consistently high and we're throttled, upgrade mode
    if (stats.averageFps > this.targetFps * 0.95 && this.mode !== 'full') {
      if (this.mode === 'battery') {
        this.setMode('balanced');
      } else if (this.mode === 'balanced') {
        this.setMode('full');
      }
    }
  }
}

/**
 * Singleton instance for global frame rate limiting.
 */
export const frameRateLimiter = new FrameRateLimiter();

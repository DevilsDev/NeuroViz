import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// WebGL is unavailable in jsdom: replace only the renderer, keep the rest of three
const renderSpy = vi.fn();
const forceContextLossSpy = vi.fn();
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  class FakeWebGLRenderer {
    domElement = document.createElement('canvas');
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    render = renderSpy;
    dispose = vi.fn();
    forceContextLoss = forceContextLossSpy;
  }
  return { ...actual, WebGLRenderer: FakeWebGLRenderer };
});

import { ThreeVisualization, type Prediction3D } from '../../../../src/infrastructure/three/ThreeVisualization';

describe('ThreeVisualization', () => {
  let container: HTMLDivElement;
  let frames: FrameRequestCallback[];
  let viz: ThreeVisualization;

  const runFrames = (n: number): void => {
    for (let i = 0; i < n; i++) {
      const pending = frames.splice(0);
      pending.forEach((cb) => cb(performance.now()));
    }
  };

  beforeEach(() => {
    frames = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => { frames = []; });
    renderSpy.mockClear();
    forceContextLossSpy.mockClear();

    container = document.createElement('div');
    document.body.appendChild(container);
    viz = new ThreeVisualization(container);
  });

  afterEach(() => {
    viz.dispose();
    container.remove();
    vi.unstubAllGlobals();
  });

  it('should stop rendering while paused and restart on resume', () => {
    runFrames(3);
    expect(renderSpy).toHaveBeenCalled();

    viz.pause();
    renderSpy.mockClear();
    runFrames(5);
    expect(renderSpy).not.toHaveBeenCalled();
    expect(frames).toHaveLength(0);

    viz.resume();
    runFrames(2);
    expect(renderSpy).toHaveBeenCalled();
  });

  it('should keep a single frame chain when resume is called repeatedly', () => {
    viz.pause();
    viz.resume();
    viz.resume();
    expect(frames).toHaveLength(1);
  });

  it('should reuse the surface mesh while the grid size is unchanged', () => {
    const grid = (gridSize: number, confidence: number): Prediction3D[] =>
      Array.from({ length: gridSize * gridSize }, (_, i) => ({
        x: (i % gridSize) / (gridSize - 1) * 2 - 1,
        y: Math.floor(i / gridSize) / (gridSize - 1) * 2 - 1,
        confidence,
        predictedClass: 0,
      }));

    viz.renderSurface(grid(5, 0.2), 5);
    const surface = (viz as unknown as { surfaceMesh: unknown }).surfaceMesh;

    viz.renderSurface(grid(5, 0.9), 5);
    expect((viz as unknown as { surfaceMesh: unknown }).surfaceMesh).toBe(surface);

    viz.renderSurface(grid(6, 0.9), 6);
    expect((viz as unknown as { surfaceMesh: unknown }).surfaceMesh).not.toBe(surface);
  });

  it('should release the WebGL context on dispose', () => {
    viz.dispose();
    expect(forceContextLossSpy).toHaveBeenCalled();
  });
});

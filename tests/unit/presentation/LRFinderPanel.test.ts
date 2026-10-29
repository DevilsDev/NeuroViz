import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LRFinderPanel, type LRFinderHost } from '../../../src/presentation/LRFinderPanel';
import type { TrainingState } from '../../../src/core/application/ITrainingSession';
import type { LRFinderResult } from '../../../src/core/application/training/LRFinderService';

function state(overrides: Partial<TrainingState> = {}): TrainingState {
  return {
    isInitialised: true, datasetLoaded: true, isRunning: false, isPaused: false, isProcessing: false,
    currentEpoch: 0, currentLoss: null, currentAccuracy: null, currentValLoss: null, currentValAccuracy: null,
    maxEpochs: 0, batchSize: 0, targetFps: 60, validationSplit: 0.2,
    history: { records: [], bestLoss: Infinity, bestEpoch: 0, bestValLoss: Infinity, bestValEpoch: 0, totalTimeMs: 0 },
    ...overrides,
  };
}

const RESULT: LRFinderResult = {
  points: Array.from({ length: 20 }, (_, i) => ({ lr: 1e-4 * Math.pow(10, i / 5), loss: 1 - i * 0.03 })),
  suggestedLR: 0.012,
};

describe('LRFinderPanel', () => {
  let current: TrainingState;
  let listeners: Array<(s: TrainingState) => void>;
  let host: LRFinderHost;
  let panel: LRFinderPanel;
  const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

  beforeEach(() => {
    document.body.innerHTML = `
      <input id="input-lr" value="0.03" />
      <button id="btn-find-lr"></button>
      <div id="lr-finder-result" hidden>
        <p id="lr-finder-status"></p><div id="lr-finder-chart"></div><button id="btn-use-lr" hidden></button>
      </div>`;
    current = state();
    listeners = [];
    host = {
      getState: () => current,
      getTrainingData: () => [{ x: 0, y: 0, label: 0 }],
      onStateChange: (cb) => { listeners.push(cb); return () => undefined; },
      getConfig: () => ({ learningRate: 0.03, layers: [4] }),
      getBatchSize: () => 10,
      runFinder: vi.fn(async () => RESULT),
    };
    panel = LRFinderPanel.fromDocument(host) as LRFinderPanel;
  });

  afterEach(() => panel.dispose());

  it('is only available with data loaded and training not running', () => {
    expect(el<HTMLButtonElement>('btn-find-lr').disabled).toBe(false);
    current = state({ datasetLoaded: false });
    listeners.forEach((l) => l(current));
    expect(el<HTMLButtonElement>('btn-find-lr').disabled).toBe(true);
    current = state({ isRunning: true });
    listeners.forEach((l) => l(current));
    expect(el<HTMLButtonElement>('btn-find-lr').disabled).toBe(true);
    current = state({ isRunning: true, isPaused: true });
    listeners.forEach((l) => l(current));
    expect(el<HTMLButtonElement>('btn-find-lr').disabled).toBe(false);
  });

  it('runs the finder, draws the chart and offers the suggestion', async () => {
    await panel.toggle();
    expect(host.runFinder).toHaveBeenCalledWith({ learningRate: 0.03, layers: [4] }, expect.any(Array), expect.objectContaining({ batchSize: 10 }));
    expect(el('lr-finder-result').hidden).toBe(false);
    expect(el('lr-finder-chart').querySelector('svg')).not.toBeNull();
    expect(el('lr-finder-status').textContent).toContain('0.012');
    expect(el('btn-use-lr').hidden).toBe(false);
    expect(el('btn-use-lr').textContent).toBe('Use 0.012');
  });

  it('writes the suggestion into the learning-rate field with change events', async () => {
    const onChange = vi.fn();
    el('input-lr').addEventListener('change', onChange);
    await panel.toggle();
    el<HTMLButtonElement>('btn-use-lr').click();
    expect(el<HTMLInputElement>('input-lr').value).toBe('0.012');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(el('btn-use-lr').hidden).toBe(true);
  });

  it('explains when there is no suggestion', async () => {
    host.runFinder = vi.fn(async () => ({ points: RESULT.points, suggestedLR: null }));
    await panel.toggle();
    expect(el('lr-finder-status').textContent).toMatch(/no suggestion/);
    expect(el('btn-use-lr').hidden).toBe(true);
  });

  it('cancels a sweep in progress when pressed again', async () => {
    let cancelledSeen = false;
    host.runFinder = vi.fn(async (_c, _d, options) => {
      await panel.toggle(); // second press while running
      cancelledSeen = options.isCancelled?.() ?? false;
      return { points: [], suggestedLR: null };
    });
    await panel.toggle();
    expect(cancelledSeen).toBe(true);
    expect(el('lr-finder-status').textContent).toBe('Cancelled.');
  });

  it('reports errors instead of throwing', async () => {
    host.runFinder = vi.fn(async () => { throw new Error('boom'); });
    await panel.toggle();
    expect(el('lr-finder-status').textContent).toMatch(/boom/);
    expect(el('btn-find-lr').textContent).toBe('Find a good learning rate');
  });
});

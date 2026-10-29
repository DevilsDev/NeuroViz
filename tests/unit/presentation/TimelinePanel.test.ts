import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimelinePanel, type TimelineHost } from '../../../src/presentation/TimelinePanel';
import type { TrainingState } from '../../../src/core/application/ITrainingSession';
import type { BoundarySnapshot } from '../../../src/core/application/training/ExperimentService';

function state(overrides: Partial<TrainingState> = {}): TrainingState {
  return {
    isInitialised: true, datasetLoaded: true, isRunning: false, isPaused: false, isProcessing: false,
    currentEpoch: 0, currentLoss: null, currentAccuracy: null, currentValLoss: null, currentValAccuracy: null,
    maxEpochs: 0, batchSize: 0, targetFps: 60, validationSplit: 0.2,
    history: { records: [], bestLoss: Infinity, bestEpoch: 0, bestValLoss: Infinity, bestValEpoch: 0, totalTimeMs: 0 },
    ...overrides,
  };
}

const frame = (epoch: number): BoundarySnapshot => ({ epoch, predictions: [{ x: 0, y: 0, confidence: 0.5, predictedClass: 0 }] });

describe('TimelinePanel', () => {
  let current: TrainingState;
  let snapshots: BoundarySnapshot[];
  let listeners: Array<(s: TrainingState) => void>;
  let host: TimelineHost;
  let panel: TimelinePanel;
  const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
  const emit = (s: TrainingState): void => { current = s; listeners.forEach((l) => l(s)); };
  const scrub = (value: number): void => {
    el<HTMLInputElement>('timeline-slider').value = String(value);
    el('timeline-slider').dispatchEvent(new Event('input'));
  };

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="viz-container"><svg></svg></div>
      <div id="timeline" hidden>
        <input type="range" id="timeline-slider" min="0" max="0" value="0" />
        <span id="timeline-label"></span>
        <button id="btn-timeline-live" hidden></button>
        <button id="btn-timeline-gif"></button>
      </div>`;
    current = state();
    snapshots = [];
    listeners = [];
    host = {
      getState: () => current,
      onStateChange: (cb) => { listeners.push(cb); return () => undefined; },
      getBoundarySnapshots: () => [...snapshots],
      showBoundarySnapshot: vi.fn((i: number) => i >= 0 && i < snapshots.length),
      showLiveBoundary: vi.fn(),
    };
    panel = TimelinePanel.fromDocument(host) as TimelinePanel;
  });

  afterEach(() => panel.dispose());

  it('appears with the data and unlocks once two frames exist', () => {
    emit(state({ datasetLoaded: false }));
    expect(el('timeline').hidden).toBe(true);

    emit(state());
    expect(el('timeline').hidden).toBe(false);
    expect(el<HTMLInputElement>('timeline-slider').disabled).toBe(true);
    expect(el<HTMLButtonElement>('btn-timeline-gif').disabled).toBe(true);
    expect(el('timeline-label').textContent).toMatch(/Train to record/);

    snapshots = [frame(1), frame(5)];
    emit(state());
    expect(el<HTMLInputElement>('timeline-slider').disabled).toBe(false);
    expect(el<HTMLButtonElement>('btn-timeline-gif').disabled).toBe(false);
  });

  it('follows the recording and locks scrubbing while training runs', () => {
    snapshots = [frame(1), frame(5), frame(10)];
    emit(state({ isRunning: true }));
    const slider = el<HTMLInputElement>('timeline-slider');
    expect(slider.disabled).toBe(true);
    expect(slider.max).toBe('2');
    expect(slider.value).toBe('2');
    expect(el('timeline-label').textContent).toBe('Recording · 3 frames');
    expect(el<HTMLButtonElement>('btn-timeline-gif').disabled).toBe(true);
  });

  it('replays a frame when paused and returns to live', () => {
    snapshots = [frame(1), frame(5), frame(10)];
    emit(state({ isRunning: true, isPaused: true }));
    scrub(1);
    expect(host.showBoundarySnapshot).toHaveBeenCalledWith(1);
    expect(el('timeline-label').textContent).toBe('Replaying epoch 5 of 10');
    expect(el('btn-timeline-live').hidden).toBe(false);

    el<HTMLButtonElement>('btn-timeline-live').click();
    expect(host.showLiveBoundary).toHaveBeenCalled();
    expect(el<HTMLInputElement>('timeline-slider').value).toBe('2');
    expect(el('btn-timeline-live').hidden).toBe(true);
  });

  it('treats the last frame as live', () => {
    snapshots = [frame(1), frame(5), frame(10)];
    emit(state());
    scrub(2);
    expect(host.showLiveBoundary).toHaveBeenCalled();
    expect(el('btn-timeline-live').hidden).toBe(true);
  });

  it('drops out of replay when training resumes', () => {
    snapshots = [frame(1), frame(5), frame(10)];
    emit(state());
    scrub(0);
    emit(state({ isRunning: true }));
    expect(el('btn-timeline-live').hidden).toBe(true);
    expect(el('timeline-label').textContent).toMatch(/Recording/);
  });
});

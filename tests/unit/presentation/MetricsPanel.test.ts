import { describe, it, expect, beforeEach } from 'vitest';
import {
  setupCurveTabs,
  EpochProgress,
  InsightsPanel,
  overfittingInsight,
} from '../../../src/presentation/MetricsPanel';
import type { TrainingState } from '../../../src/core/application/ITrainingSession';
import type { TrainingRecord } from '../../../src/core/domain';

function state(overrides: Partial<TrainingState> = {}): TrainingState {
  return {
    isInitialised: true,
    datasetLoaded: true,
    isRunning: false,
    isPaused: false,
    isProcessing: false,
    currentEpoch: 0,
    currentLoss: null,
    currentAccuracy: null,
    currentValLoss: null,
    currentValAccuracy: null,
    maxEpochs: 0,
    batchSize: 0,
    targetFps: 60,
    validationSplit: 0.2,
    history: { records: [], bestLoss: Infinity, bestEpoch: 0, bestValLoss: Infinity, bestValEpoch: 0, totalTimeMs: 0 },
    ...overrides,
  };
}

function records(n: number, loss: (e: number) => number, valLoss: (e: number) => number): TrainingRecord[] {
  return Array.from({ length: n }, (_, i) => ({
    epoch: i + 1,
    loss: loss(i + 1),
    accuracy: 0.7,
    valLoss: valLoss(i + 1),
    valAccuracy: 0.7,
    timestamp: i,
    learningRate: 0.03,
  }));
}

describe('setupCurveTabs', () => {
  let root: HTMLDivElement;

  beforeEach(() => {
    root = document.createElement('div');
    root.innerHTML = `
      <button data-curve="loss" class="active" aria-pressed="true">Loss</button>
      <button data-curve="accuracy" aria-pressed="false">Accuracy</button>
      <div data-curve-panel="loss"></div>
      <div data-curve-panel="accuracy" class="hidden"></div>`;
  });

  it('switches the visible curve and pressed state', () => {
    const teardown = setupCurveTabs(root);
    root.querySelector<HTMLButtonElement>('[data-curve="accuracy"]')!.click();

    expect(root.querySelector('[data-curve-panel="loss"]')!.classList.contains('hidden')).toBe(true);
    expect(root.querySelector('[data-curve-panel="accuracy"]')!.classList.contains('hidden')).toBe(false);
    expect(root.querySelector('[data-curve="accuracy"]')!.getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('[data-curve="loss"]')!.getAttribute('aria-pressed')).toBe('false');
    teardown();
  });

  it('teardown removes the listeners', () => {
    setupCurveTabs(root)();
    root.querySelector<HTMLButtonElement>('[data-curve="accuracy"]')!.click();
    expect(root.querySelector('[data-curve-panel="accuracy"]')!.classList.contains('hidden')).toBe(true);
  });
});

describe('EpochProgress', () => {
  it('shows progress towards the epoch limit', () => {
    const label = document.createElement('span');
    const fill = document.createElement('div');
    const progress = new EpochProgress(label, fill);

    progress.update(state({ currentEpoch: 62, maxEpochs: 500 }));
    expect(label.textContent).toBe('Epoch 62 of 500');
    expect(fill.style.width).toBe('12.4%');

    progress.update(state({ currentEpoch: 80, maxEpochs: 0 }));
    expect(label.textContent).toBe('Epoch 80');
    expect(fill.style.width).toBe('0%');
  });
});

describe('overfittingInsight', () => {
  it('waits for enough validation history', () => {
    const s = state({ history: { ...state().history, records: records(10, () => 0.5, () => 0.5) } });
    expect(overfittingInsight(s)).toBeNull();
  });

  it('reports a healthy run when validation tracks training', () => {
    const s = state({ history: { ...state().history, records: records(30, (e) => 0.7 - e * 0.005, (e) => 0.72 - e * 0.005) } });
    expect(overfittingInsight(s)?.kind).toBe('good');
  });

  it('flags overfitting when validation rises while training falls', () => {
    const s = state({ history: { ...state().history, records: records(30, (e) => 0.6 - e * 0.01, (e) => 0.4 + e * 0.01) } });
    const insight = overfittingInsight(s);
    expect(insight?.kind).toBe('warning');
    expect(insight?.title).toBe('Starting to overfit');
  });
});

describe('InsightsPanel', () => {
  it('prompts to start before any data is loaded', () => {
    const list = document.createElement('ul');
    const panel = new InsightsPanel(list, () => ({ datasetType: 'spiral', config: null }));
    panel.update(state({ datasetLoaded: false }));
    expect(list.textContent).toContain('Choose a dataset');
  });

  it('renders explanations as text, not markup', () => {
    const list = document.createElement('ul');
    const panel = new InsightsPanel(list, () => ({
      datasetType: '<img src=x>',
      config: { learningRate: 0.03, layers: [8, 4] },
    }));
    panel.update(state({ currentEpoch: 30, currentLoss: 0.4, currentAccuracy: 0.8 }));
    expect(list.querySelectorAll('li.insight').length).toBeGreaterThan(0);
    expect(list.querySelector('img')).toBeNull();
  });

  it('only refreshes every few epochs while training', () => {
    const list = document.createElement('ul');
    const panel = new InsightsPanel(list, () => ({ datasetType: 'spiral', config: null }));
    panel.update(state({ datasetLoaded: false }));
    const before = list.innerHTML;
    panel.update(state({ eventType: 'trainingStep', currentEpoch: 7 }));
    expect(list.innerHTML).toBe(before);
  });
});

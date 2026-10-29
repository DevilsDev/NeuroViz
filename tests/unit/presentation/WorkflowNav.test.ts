import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { deriveStages, WorkflowNav } from '../../../src/presentation/WorkflowNav';
import type { TrainingState } from '../../../src/core/application/ITrainingSession';

function createState(overrides: Partial<TrainingState> = {}): TrainingState {
  return {
    isInitialised: false,
    datasetLoaded: false,
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
    history: {
      records: [],
      bestLoss: Infinity,
      bestEpoch: 0,
      bestValLoss: Infinity,
      bestValEpoch: 0,
      totalTimeMs: 0,
    },
    ...overrides,
  };
}

describe('deriveStages', () => {
  it('empty state: only Prepare is active', () => {
    const stages = deriveStages(createState());
    expect(stages.prepare.active).toBe(true);
    expect(stages.prepare.complete).toBe(false);
    expect(stages.configure.active).toBe(false);
    expect(stages.train.active).toBe(false);
    expect(stages.analyze.active).toBe(false);
  });

  it('data loaded: Prepare complete, Configure active', () => {
    const stages = deriveStages(createState({ datasetLoaded: true }));
    expect(stages.prepare.complete).toBe(true);
    expect(stages.prepare.active).toBe(false);
    expect(stages.configure.active).toBe(true);
    expect(stages.configure.complete).toBe(false);
  });

  it('model initialised: Configure complete, Train active', () => {
    const stages = deriveStages(createState({ datasetLoaded: true, isInitialised: true }));
    expect(stages.configure.complete).toBe(true);
    expect(stages.train.active).toBe(true);
    expect(stages.train.complete).toBe(false);
  });

  it('mid-training: Train active (not complete)', () => {
    const stages = deriveStages(createState({
      datasetLoaded: true,
      isInitialised: true,
      isRunning: true,
      currentEpoch: 10,
    }));
    expect(stages.train.active).toBe(true);
    expect(stages.train.complete).toBe(false);
    expect(stages.analyze.active).toBe(true);
  });

  it('paused after training: Train complete, Analyze active', () => {
    const stages = deriveStages(createState({
      datasetLoaded: true,
      isInitialised: true,
      isRunning: true,
      isPaused: true,
      currentEpoch: 50,
    }));
    expect(stages.train.complete).toBe(true);
    expect(stages.analyze.active).toBe(true);
  });

  it('training complete (not running): Train complete, Analyze active', () => {
    const stages = deriveStages(createState({
      datasetLoaded: true,
      isInitialised: true,
      isRunning: false,
      currentEpoch: 100,
    }));
    expect(stages.train.complete).toBe(true);
    expect(stages.analyze.active).toBe(true);
  });
});

describe('WorkflowNav', () => {
  let nav: HTMLDivElement;

  beforeEach(() => {
    nav = document.createElement('div');
    nav.id = 'test-workflow-nav';
    for (const tab of ['tab-data', 'tab-model', 'tab-train', 'tab-analyze']) {
      const button = document.createElement('button');
      button.dataset.tab = tab;
      nav.appendChild(button);
    }
    document.body.appendChild(nav);
  });

  afterEach(() => {
    nav.remove();
  });

  const status = (tab: string): string | undefined =>
    nav.querySelector<HTMLElement>(`[data-tab="${tab}"]`)?.dataset.status;

  it('marks finished steps complete and highlights the next one', () => {
    const wf = new WorkflowNav('test-workflow-nav');

    wf.update(createState({ datasetLoaded: true }));
    expect(status('tab-data')).toBe('complete');
    expect(status('tab-model')).toBe('current');
    expect(status('tab-train')).toBe('pending');

    wf.update(createState({ datasetLoaded: true, isInitialised: true, currentEpoch: 12 }));
    expect(status('tab-model')).toBe('complete');
    expect(status('tab-train')).toBe('complete');
    expect(status('tab-analyze')).toBe('current');
  });

  it('announces step progress to screen readers', () => {
    const wf = new WorkflowNav('test-workflow-nav');
    wf.update(createState({ datasetLoaded: true }));

    expect(nav.querySelector('[data-tab="tab-data"] .step-status')?.textContent).toBe(' (done)');
    expect(nav.querySelector('[data-tab="tab-model"] .step-status')?.textContent).toBe(' (next step)');
  });

  it('throws if the nav is missing', () => {
    expect(() => new WorkflowNav('nonexistent')).toThrow();
  });
});

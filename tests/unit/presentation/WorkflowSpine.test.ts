import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { deriveStages, WorkflowSpine } from '../../../src/presentation/WorkflowSpine';
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

describe('WorkflowSpine DOM rendering', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-workflow-spine';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders four stages with connectors', () => {
    const spine = new WorkflowSpine('test-workflow-spine');
    const stages = container.querySelectorAll('.workflow-stage');
    const connectors = container.querySelectorAll('.workflow-connector');

    expect(stages.length).toBe(4);
    expect(connectors.length).toBe(3);
    expect(stages[0]?.textContent).toBe('Prepare');
    expect(stages[3]?.textContent).toBe('Analyze');

    // Suppress unused variable warning
    void spine;
  });

  it('update() applies active/complete classes', () => {
    const spine = new WorkflowSpine('test-workflow-spine');

    spine.update(createState({ datasetLoaded: true, isInitialised: true }));

    const prepareEl = container.querySelector('[data-stage="prepare"]');
    const configureEl = container.querySelector('[data-stage="configure"]');
    const trainEl = container.querySelector('[data-stage="train"]');

    expect(prepareEl?.classList.contains('complete')).toBe(true);
    expect(configureEl?.classList.contains('complete')).toBe(true);
    expect(trainEl?.classList.contains('active')).toBe(true);
  });

  it('throws if container not found', () => {
    expect(() => new WorkflowSpine('nonexistent')).toThrow();
  });
});

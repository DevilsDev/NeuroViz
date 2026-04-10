/**
 * Unit tests for MetricsController — focused on the confusion matrix filter fix.
 *
 * Before the fix, `setupStateSync` filtered on `!state.isRunning`, which never
 * fired on pause (because isRunning maps to isTraining, which stays true during
 * pause) and only fired on natural completion of the full epoch budget. The
 * fixed filter uses the `eventType` field instead. These tests pin the new
 * behaviour so it cannot silently regress.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetricsController, type MetricsElements } from '../../../src/presentation/controllers/MetricsController';
import type { TrainingState, TrainingEventType } from '../../../src/core/application/ITrainingSession';
import type { IConfusionMatrixService } from '../../../src/core/ports/IChartService';
import type { Point } from '../../../src/core/domain';
import { MockNeuralNetworkService } from '../mocks/MockNeuralNetworkService';

function createState(overrides: Partial<TrainingState> = {}): TrainingState {
  return {
    isInitialised: true,
    datasetLoaded: true,
    isRunning: true, // training is actively running
    isPaused: false,
    isProcessing: false,
    currentEpoch: 5,
    currentLoss: 0.5,
    currentAccuracy: 0.8,
    currentValLoss: 0.55,
    currentValAccuracy: 0.78,
    maxEpochs: 100,
    batchSize: 32,
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

function createMockElements(): MetricsElements {
  return {
    precisionEl: document.createElement('div'),
    recallEl: document.createElement('div'),
    f1El: document.createElement('div'),
    confusionMatrixEmpty: document.createElement('div'),
    speedCurrent: document.createElement('div'),
    speedComparisonContainer: document.createElement('div'),
    speedBaseline: document.createElement('div'),
    speedComparisonResult: document.createElement('div'),
    saveSpeedBaselineBtn: document.createElement('button'),
    clearSpeedBaselineBtn: document.createElement('button'),
  };
}

describe('MetricsController — confusion matrix filter', () => {
  let stateListener: ((state: TrainingState) => void) | null = null;
  let mockSession: {
    getState: ReturnType<typeof vi.fn>;
    getData: ReturnType<typeof vi.fn>;
    onStateChange: ReturnType<typeof vi.fn>;
  };
  let mockNeuralNet: MockNeuralNetworkService;
  let mockConfusionMatrix: IConfusionMatrixService;
  let controller: MetricsController;

  const sampleData: Point[] = [
    { x: 0.1, y: 0.1, label: 0 },
    { x: 0.9, y: 0.9, label: 1 },
  ];

  beforeEach(() => {
    stateListener = null;

    mockSession = {
      getState: vi.fn(() => createState()),
      getData: vi.fn(() => sampleData),
      onStateChange: vi.fn((cb: (s: TrainingState) => void) => {
        stateListener = cb;
        return () => { stateListener = null; };
      }),
    };

    mockNeuralNet = new MockNeuralNetworkService();
    mockNeuralNet.initializeCalled = true;
    // Make isReady return true so updateClassificationMetrics doesn't bail out
    (mockNeuralNet as unknown as { isReady: () => boolean }).isReady = (): boolean => true;

    mockConfusionMatrix = {
      render: vi.fn(),
      dispose: vi.fn(),
    } as unknown as IConfusionMatrixService;

    controller = new MetricsController(
      mockSession as unknown as Parameters<typeof MetricsController>[0] extends never
        ? never
        : ConstructorParameters<typeof MetricsController>[0],
      mockNeuralNet,
      mockConfusionMatrix,
      createMockElements(),
    );
    controller.initialize();
  });

  function emit(eventType: TrainingEventType | undefined, extra: Partial<TrainingState> = {}): void {
    if (!stateListener) throw new Error('stateListener not wired');
    stateListener(createState({ eventType, ...extra }));
  }

  async function tickMicrotasks(): Promise<void> {
    // Let the void Promise chain in updateClassificationMetrics settle.
    await Promise.resolve();
    await Promise.resolve();
  }

  it('renders confusion matrix after each trainingStep (even while isRunning=true)', async () => {
    emit('trainingStep');
    await tickMicrotasks();
    expect(mockConfusionMatrix.render).toHaveBeenCalled();
  });

  it('renders confusion matrix on paused — the old bug scenario', async () => {
    // Before the fix: pause did not flip isRunning, so the filter never
    // triggered. Now the eventType filter fires regardless of isRunning.
    emit('paused', { isRunning: true, isPaused: true });
    await tickMicrotasks();
    expect(mockConfusionMatrix.render).toHaveBeenCalled();
  });

  it('renders confusion matrix on stopped', async () => {
    emit('stopped', { isRunning: false });
    await tickMicrotasks();
    expect(mockConfusionMatrix.render).toHaveBeenCalled();
  });

  it('does NOT render on unrelated eventTypes', async () => {
    emit('initialized');
    emit('dataLoaded');
    emit('configChanged');
    emit('reset', { currentEpoch: 0 });
    await tickMicrotasks();
    expect(mockConfusionMatrix.render).not.toHaveBeenCalled();
  });

  it('does NOT render when currentEpoch is 0 even on trainingStep', async () => {
    emit('trainingStep', { currentEpoch: 0 });
    await tickMicrotasks();
    expect(mockConfusionMatrix.render).not.toHaveBeenCalled();
  });

  it('does NOT render when datasetLoaded is false', async () => {
    emit('trainingStep', { datasetLoaded: false });
    await tickMicrotasks();
    expect(mockConfusionMatrix.render).not.toHaveBeenCalled();
  });

  it('does NOT render when isInitialised is false', async () => {
    emit('trainingStep', { isInitialised: false });
    await tickMicrotasks();
    expect(mockConfusionMatrix.render).not.toHaveBeenCalled();
  });
});

describe('MetricsController — validation badge', () => {
  let stateListener: ((state: TrainingState) => void) | null = null;
  let badge: HTMLSpanElement;

  beforeEach(() => {
    stateListener = null;

    badge = document.createElement('span');
    badge.id = 'badge-validation-active';
    badge.classList.add('hidden');
    document.body.appendChild(badge);

    const mockSession = {
      getState: vi.fn(() => createState()),
      getData: vi.fn(() => []),
      onStateChange: vi.fn((cb: (s: TrainingState) => void) => {
        stateListener = cb;
        return () => { stateListener = null; };
      }),
    };

    const mockNeuralNet = new MockNeuralNetworkService();
    (mockNeuralNet as unknown as { isReady: () => boolean }).isReady = (): boolean => true;

    const mockConfusionMatrix = {
      render: vi.fn(),
      dispose: vi.fn(),
    } as unknown as IConfusionMatrixService;

    const controller = new MetricsController(
      mockSession as unknown as ConstructorParameters<typeof MetricsController>[0],
      mockNeuralNet,
      mockConfusionMatrix,
      createMockElements(),
    );
    controller.initialize();
  });

  afterEach(() => {
    badge.remove();
  });

  it('shows validation badge when validationSplit > 0', () => {
    stateListener!(createState({ validationSplit: 0.2 }));
    expect(badge.classList.contains('hidden')).toBe(false);
  });

  it('hides validation badge when validationSplit is 0', () => {
    stateListener!(createState({ validationSplit: 0 }));
    expect(badge.classList.contains('hidden')).toBe(true);
  });

  it('toggles badge when validationSplit changes', () => {
    stateListener!(createState({ validationSplit: 0.3 }));
    expect(badge.classList.contains('hidden')).toBe(false);

    stateListener!(createState({ validationSplit: 0 }));
    expect(badge.classList.contains('hidden')).toBe(true);
  });
});

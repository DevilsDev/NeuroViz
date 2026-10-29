import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TrainingSession } from '../../../src/core/application/TrainingSession';
import type { TrainingEventType } from '../../../src/core/application/ITrainingSession';
import type { INeuralNetworkService } from '../../../src/core/ports/INeuralNetworkService';
import type { IVisualizerService } from '../../../src/core/ports/IVisualizerService';
import type { IDatasetRepository } from '../../../src/core/ports/IDatasetRepository';

vi.mock('../../../src/infrastructure/logging/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

function createMockNeuralNet(): INeuralNetworkService {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    updateLearningRate: vi.fn(),
    train: vi.fn().mockResolvedValue({ loss: 0.5, accuracy: 0.8 }),
    predict: vi.fn().mockResolvedValue([]),
    evaluate: vi.fn().mockResolvedValue({ loss: 0.5, accuracy: 0.8 }),
    getWeightMatrices: vi.fn().mockReturnValue([]),
    getLayerActivations: vi.fn().mockReturnValue([]),
    getStructure: vi.fn().mockReturnValue(null),
    isReady: vi.fn().mockReturnValue(true),
    dispose: vi.fn(),
    getConfig: vi.fn().mockReturnValue(null),
    getWeights: vi.fn().mockReturnValue([]),
    generateDropoutMask: vi.fn().mockReturnValue([]),
    exportModel: vi.fn().mockResolvedValue({ modelJson: new Blob(), weightsBlob: new Blob() }),
  };
}

function createMockVisualizer(): IVisualizerService {
  return {
    renderData: vi.fn(),
    renderBoundary: vi.fn(),
    setConfig: vi.fn(),
    getConfig: vi.fn().mockReturnValue({}),
    enableDrawMode: vi.fn(),
    disableDrawMode: vi.fn(),
    isDrawModeEnabled: vi.fn().mockReturnValue(false),
    clear: vi.fn(),
    highlightMisclassified: vi.fn(),
    clearMisclassifiedHighlight: vi.fn(),
    renderConfidenceCircles: vi.fn(),
    clearConfidenceCircles: vi.fn(),
    exportAsPNGWithMetadata: vi.fn(),
    dispose: vi.fn(),
    setVoronoiOverlay: vi.fn(),
    setPointPredictions: vi.fn(),
  };
}

function createMockDataRepo(): IDatasetRepository {
  const points = Array.from({ length: 20 }, (_, i) => ({ x: i / 20, y: -i / 20, label: i % 2 }));
  return { getDataset: vi.fn().mockResolvedValue(points) };
}

const flush = (ms = 30): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/** Starts the loop and resolves on the first 'stopped' event. */
function trainUntilStopped(session: TrainingSession): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('training did not stop')), 4000);
    const unsubscribe = session.onStateChange((state) => {
      if (state.eventType === 'stopped') {
        clearTimeout(timeout);
        unsubscribe();
        resolve();
      }
    });
    session.start();
  });
}

describe('TrainingSession - loop policies', () => {
  let neuralNet: INeuralNetworkService;
  let visualizer: IVisualizerService;
  let session: TrainingSession;
  let events: TrainingEventType[];

  beforeEach(async () => {
    neuralNet = createMockNeuralNet();
    visualizer = createMockVisualizer();
    session = new TrainingSession(neuralNet, visualizer, createMockDataRepo());
    await session.loadData('test');
    events = [];
    session.onStateChange((s) => { if (s.eventType) events.push(s.eventType); });
  });

  afterEach(() => {
    session.dispose();
  });

  describe('listener errors', () => {
    it('should keep training to maxEpochs when a subscriber throws', async () => {
      session.setTrainingConfig({ maxEpochs: 3, targetFps: 0, validationSplit: 0 });
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      session.onStateChange(() => {
        throw new Error('subscriber bug');
      });

      await trainUntilStopped(session);

      expect(session.getState().currentEpoch).toBe(3);
      expect(session.getState().isRunning).toBe(false);
    });
  });

  describe('stop events', () => {
    const countStopped = (): number => events.filter(e => e === 'stopped').length;

    it('should emit one stopped event and render the final boundary on early stop', async () => {
      // Constant val loss: epoch 1 sets the best, epoch 2 exhausts patience 1
      session.setTrainingConfig({ maxEpochs: 50, targetFps: 0, validationSplit: 0.5, earlyStoppingPatience: 1 });
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      const onComplete = vi.fn();
      session.onComplete(onComplete);

      await trainUntilStopped(session);
      await flush();

      expect(session.getState().currentEpoch).toBe(2);
      expect(onComplete).toHaveBeenCalledWith('earlyStopping');
      expect(countStopped()).toBe(1);
      // Epoch 1 render + final render at epoch 2 (off the render interval)
      expect(visualizer.renderBoundary).toHaveBeenCalledTimes(2);
    });

    it('should emit one stopped event when the model is not ready', async () => {
      session.setTrainingConfig({ targetFps: 0, validationSplit: 0 });
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      vi.mocked(neuralNet.isReady).mockReturnValue(false);

      await trainUntilStopped(session);
      await flush();

      expect(countStopped()).toBe(1);
      expect(neuralNet.train).not.toHaveBeenCalled();
    });

    it('should emit one stopped event when training crashes', async () => {
      session.setTrainingConfig({ targetFps: 0, validationSplit: 0 });
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      vi.mocked(neuralNet.train).mockRejectedValue(new Error('boom'));

      await trainUntilStopped(session);
      await flush();

      expect(countStopped()).toBe(1);
      expect(session.getState().isRunning).toBe(false);
    });

    it('should emit one stopped event when maxEpochs is reached', async () => {
      session.setTrainingConfig({ maxEpochs: 3, targetFps: 0, validationSplit: 0 });
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });

      await trainUntilStopped(session);
      await flush();

      expect(countStopped()).toBe(1);
    });
  });

  describe('LR schedule epoch indexing', () => {
    const recordedLRs = (): number[] => session.getHistory().records.map(r => r.learningRate ?? NaN);
    const warmup = { type: 'none' as const, warmupEpochs: 4 };

    it('should warm up over exactly W epochs starting at 1/W in the loop', async () => {
      session.setTrainingConfig({ maxEpochs: 5, targetFps: 0, validationSplit: 0, lrSchedule: warmup });
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });

      await trainUntilStopped(session);

      const lrs = recordedLRs();
      [0.025, 0.05, 0.075, 0.1, 0.1].forEach((expected, i) => expect(lrs[i]).toBeCloseTo(expected, 10));
    });

    it('should use the initial LR for the first decayed epoch', async () => {
      session.setTrainingConfig({
        maxEpochs: 2, targetFps: 0, validationSplit: 0,
        lrSchedule: { type: 'exponential', decayRate: 0.5 },
      });
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });

      await trainUntilStopped(session);

      const lrs = recordedLRs();
      expect(lrs[0]).toBeCloseTo(0.1, 10);
      expect(lrs[1]).toBeCloseTo(0.05, 10);
    });

    it('should apply the same schedule in step()', async () => {
      session.setTrainingConfig({ validationSplit: 0, lrSchedule: warmup });
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });

      for (let i = 0; i < 4; i++) await session.step();

      const lrs = recordedLRs();
      [0.025, 0.05, 0.075, 0.1].forEach((expected, i) => expect(lrs[i]).toBeCloseTo(expected, 10));
      expect(neuralNet.updateLearningRate).toHaveBeenLastCalledWith(0.1);
    });
  });

  describe('data handling', () => {
    it('should detect the number of classes in custom data', () => {
      session.setCustomData([
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 0, label: 1 },
        { x: 0, y: 1, label: 2 },
      ]);

      expect(session.getDetectedNumClasses()).toBe(3);
    });

    it('should pause a running loop before loading new data', async () => {
      session.setTrainingConfig({ maxEpochs: 0, targetFps: 0, validationSplit: 0 });
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      session.start();
      await flush();

      await session.loadData('test');
      const trainCalls = vi.mocked(neuralNet.train).mock.calls.length;
      await flush();

      expect(session.getState().isPaused).toBe(true);
      expect(session.getState().isProcessing).toBe(false);
      expect(vi.mocked(neuralNet.train).mock.calls.length).toBe(trainCalls);
    });
  });

  describe('step() policies', () => {
    it('should not train past maxEpochs', async () => {
      session.setTrainingConfig({ maxEpochs: 2, validationSplit: 0 });
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      const onComplete = vi.fn();
      session.onComplete(onComplete);

      for (let i = 0; i < 3; i++) await session.step();

      expect(session.getState().currentEpoch).toBe(2);
      expect(neuralNet.train).toHaveBeenCalledTimes(2);
      expect(onComplete).toHaveBeenCalledWith('maxEpochs');
    });

    it('should refuse to step when the model is not ready', async () => {
      session.setTrainingConfig({ validationSplit: 0 });
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      vi.mocked(neuralNet.isReady).mockReturnValue(false);

      await expect(session.step()).rejects.toThrow(/not ready/);
      expect(neuralNet.train).not.toHaveBeenCalled();
      expect(session.getState().currentEpoch).toBe(0);
    });

    it('should report early stopping from manual steps', async () => {
      session.setTrainingConfig({ validationSplit: 0.5, earlyStoppingPatience: 1 });
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      const onComplete = vi.fn();
      session.onComplete(onComplete);

      await session.step();
      await session.step();

      expect(onComplete).toHaveBeenCalledWith('earlyStopping');
      expect(visualizer.renderBoundary).toHaveBeenCalledTimes(2);
    });
  });
});

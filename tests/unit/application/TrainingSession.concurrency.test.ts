import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TrainingSession } from '../../../src/core/application/TrainingSession';
import type { INeuralNetworkService, TrainResult } from '../../../src/core/ports/INeuralNetworkService';
import type { IVisualizerService } from '../../../src/core/ports/IVisualizerService';
import type { IDatasetRepository } from '../../../src/core/ports/IDatasetRepository';

function createMockNeuralNet(): INeuralNetworkService {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    updateLearningRate: vi.fn(),
    train: vi.fn().mockResolvedValue({ loss: 0.5, accuracy: 0.8 }),
    predict: vi.fn().mockResolvedValue([]),
    evaluate: vi.fn().mockResolvedValue({ loss: 0.5, accuracy: 0.8 }),
    getWeightMatrices: vi.fn().mockReturnValue([]),
    getLayerActivations: vi.fn().mockReturnValue([]),
    loadModel: vi.fn().mockResolvedValue(undefined),
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
  return {
    getDataset: vi.fn().mockResolvedValue([
      { x: 0, y: 0, label: 0 },
      { x: 1, y: 1, label: 1 },
    ]),
  };
}

/** A train() mock whose calls stay pending until released, tracking overlap. */
function createControllableTrain(): {
  train: INeuralNetworkService['train'];
  releaseAll: () => void;
  maxConcurrent: () => number;
  pending: () => number;
} {
  const resolvers: Array<(r: TrainResult) => void> = [];
  let active = 0;
  let peak = 0;
  const train = vi.fn(() => {
    active++;
    peak = Math.max(peak, active);
    return new Promise<TrainResult>((resolve) => {
      resolvers.push((r) => {
        active--;
        resolve(r);
      });
    });
  });
  return {
    train,
    releaseAll: () => resolvers.splice(0).forEach((r) => r({ loss: 0.9, accuracy: 0.1 })),
    maxConcurrent: () => peak,
    pending: () => resolvers.length,
  };
}

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 60));

describe('TrainingSession - concurrency', () => {
  let neuralNet: INeuralNetworkService;
  let session: TrainingSession;

  beforeEach(async () => {
    neuralNet = createMockNeuralNet();
    session = new TrainingSession(neuralNet, createMockVisualizer(), createMockDataRepo());
    session.setTrainingConfig({ targetFps: 0, validationSplit: 0 });
    await session.loadData('test');
  });

  afterEach(() => {
    session.dispose();
  });

  describe('setHyperparameters', () => {
    it('should apply overlapping calls in order instead of dropping them', async () => {
      const first = session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      const second = session.setHyperparameters({ learningRate: 0.2, layers: [8] });

      await Promise.all([first, second]);

      const configs = vi.mocked(neuralNet.initialize).mock.calls.map(([c]) => c.learningRate);
      expect(configs).toEqual([0.1, 0.2]);
    });

    it('should leave the session uninitialised when initialize fails', async () => {
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      vi.mocked(neuralNet.initialize).mockRejectedValueOnce(new Error('boom'));

      await expect(session.setHyperparameters({ learningRate: 0.2, layers: [4] })).rejects.toThrow('boom');

      expect(session.getState().isInitialised).toBe(false);
      // A later call still runs after the failure
      await session.setHyperparameters({ learningRate: 0.3, layers: [4] });
      expect(session.getState().isInitialised).toBe(true);
    });

    it('should wait for an in-flight manual step before re-initialising', async () => {
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      const controllable = createControllableTrain();
      neuralNet.train = controllable.train;

      const step = session.step();
      const reinit = session.setHyperparameters({ learningRate: 0.2, layers: [4] });
      await flush();
      expect(neuralNet.initialize).toHaveBeenCalledTimes(1); // still waiting

      controllable.releaseAll();
      await Promise.all([step, reinit]);
      expect(neuralNet.initialize).toHaveBeenCalledTimes(2);
    });
  });

  describe('reset during an in-flight step', () => {
    it('should discard the stale step result instead of writing it to the fresh history', async () => {
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      const controllable = createControllableTrain();
      neuralNet.train = controllable.train;

      session.start();
      await flush();
      expect(controllable.pending()).toBe(1);

      session.reset();
      controllable.releaseAll();
      await flush();

      expect(session.getState().currentEpoch).toBe(0);
      expect(session.getHistory().records).toHaveLength(0);
    });

    it('should never run two train calls concurrently when restarted after reset', async () => {
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      const controllable = createControllableTrain();
      neuralNet.train = controllable.train;

      session.start();
      await flush();
      session.reset();
      session.start();
      await flush();

      expect(controllable.maxConcurrent()).toBe(1);

      // Once the stale step finishes, the new run proceeds
      controllable.releaseAll();
      await flush();
      expect(controllable.pending()).toBe(1);
      session.pause();
      controllable.releaseAll();
    });
  });

  describe('pause/resume during an in-flight step', () => {
    it('should keep train calls serialised across pause/resume', async () => {
      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });
      const controllable = createControllableTrain();
      neuralNet.train = controllable.train;

      session.start();
      await flush();
      session.pause();
      session.start();

      // Let several steps complete; exactly one step may be pending at a time
      for (let i = 0; i < 3; i++) {
        controllable.releaseAll();
        await flush();
      }

      expect(controllable.maxConcurrent()).toBe(1);
      expect(controllable.pending()).toBe(1);
      session.pause();
      controllable.releaseAll();
    });
  });
});

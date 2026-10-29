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
});

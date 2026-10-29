import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TrainingSession } from '../../../src/core/application/TrainingSession';
import type { INeuralNetworkService } from '../../../src/core/ports/INeuralNetworkService';
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

/** Runs the training loop until it stops on maxEpochs. */
function trainUntilStopped(session: TrainingSession): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('training did not stop')), 4000);
    session.onStateChange((state) => {
      if (state.eventType === 'stopped') {
        clearTimeout(timeout);
        resolve();
      }
    });
    session.start();
  });
}

describe('TrainingSession - LR schedule application', () => {
  let neuralNet: INeuralNetworkService;
  let session: TrainingSession;

  beforeEach(async () => {
    neuralNet = createMockNeuralNet();
    session = new TrainingSession(neuralNet, createMockVisualizer(), createMockDataRepo());
    await session.loadData('test');
  });

  afterEach(() => {
    session.dispose();
  });

  it('should apply a slow decay even when each per-epoch change is below 1%', async () => {
    session.setTrainingConfig({
      maxEpochs: 10,
      targetFps: 0,
      validationSplit: 0,
      lrSchedule: { type: 'exponential', decayRate: 0.995 },
    });
    await session.setHyperparameters({ learningRate: 0.1, layers: [4] });

    await trainUntilStopped(session);

    const calls = vi.mocked(neuralNet.updateLearningRate).mock.calls;
    const lastApplied = calls.at(-1)?.[0];
    // The optimizer must track the scheduled LR, not stay at the initial 0.1
    expect(lastApplied).toBeCloseTo(session.getCurrentLearningRate(), 10);
    expect(lastApplied).toBeLessThan(0.1);
  });

  it('should not call updateLearningRate when the schedule is constant', async () => {
    session.setTrainingConfig({
      maxEpochs: 5,
      targetFps: 0,
      validationSplit: 0,
      lrSchedule: { type: 'none' },
    });
    await session.setHyperparameters({ learningRate: 0.1, layers: [4] });

    await trainUntilStopped(session);

    expect(neuralNet.updateLearningRate).not.toHaveBeenCalled();
  });
});

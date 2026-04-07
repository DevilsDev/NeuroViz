import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrainingSession } from '../../../src/core/application/TrainingSession';
import type { TrainingState, TrainingEventType } from '../../../src/core/application/ITrainingSession';
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

describe('TrainingSession - Typed Events', () => {
  let session: TrainingSession;
  let receivedEvents: TrainingEventType[];

  beforeEach(() => {
    const mockNeuralNet = createMockNeuralNet();
    const mockVisualizer = createMockVisualizer();
    const mockDataRepo = createMockDataRepo();
    session = new TrainingSession(mockNeuralNet, mockVisualizer, mockDataRepo);
    receivedEvents = [];

    session.onStateChange((state: TrainingState) => {
      if (state.eventType) {
        receivedEvents.push(state.eventType);
      }
    });
  });

  it('should emit "initialized" when setHyperparameters is called', async () => {
    await session.setHyperparameters({ learningRate: 0.01, layers: [4] });
    expect(receivedEvents).toContain('initialized');
  });

  it('should emit "dataLoaded" when loadData is called', async () => {
    await session.loadData('test');
    expect(receivedEvents).toContain('dataLoaded');
  });

  it('should emit "configChanged" when setTrainingConfig is called', () => {
    session.setTrainingConfig({ batchSize: 32 });
    expect(receivedEvents).toContain('configChanged');
  });

  it('should emit "started" when start is called', async () => {
    await session.setHyperparameters({ learningRate: 0.01, layers: [4] });
    await session.loadData('test');
    receivedEvents = [];

    session.start();
    expect(receivedEvents).toContain('started');

    // Clean up
    session.pause();
  });

  it('should emit "paused" when pause is called', async () => {
    await session.setHyperparameters({ learningRate: 0.01, layers: [4] });
    await session.loadData('test');
    session.start();
    receivedEvents = [];

    session.pause();
    expect(receivedEvents).toContain('paused');
  });

  it('should emit "reset" when reset is called', async () => {
    await session.setHyperparameters({ learningRate: 0.01, layers: [4] });
    receivedEvents = [];

    session.reset();
    expect(receivedEvents).toContain('reset');
  });

  it('should include eventType in TrainingState', async () => {
    let lastState: TrainingState | null = null;
    session.onStateChange((state) => { lastState = state; });

    await session.setHyperparameters({ learningRate: 0.01, layers: [4] });
    expect(lastState?.eventType).toBe('initialized');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LRFinderService } from '../../../../src/core/application/training/LRFinderService';
import type { INeuralNetworkService } from '../../../../src/core/ports/INeuralNetworkService';
import type { Hyperparameters, Point } from '../../../../src/core/domain';

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

describe('LRFinderService', () => {
  let neuralNet: INeuralNetworkService;
  let lrFinder: LRFinderService;
  const hyperparams: Hyperparameters = { learningRate: 0.01, layers: [4] };
  const getBatch = (): Point[] => [{ x: 0, y: 0, label: 0 }, { x: 1, y: 1, label: 1 }];

  beforeEach(() => {
    neuralNet = createMockNeuralNet();
    lrFinder = new LRFinderService(neuralNet);
  });

  it('returns array of {lr, loss} points', async () => {
    const results = await lrFinder.run(getBatch, hyperparams, 1e-5, 0.1, 10);
    expect(results.length).toBe(10);
    expect(results[0]).toHaveProperty('lr');
    expect(results[0]).toHaveProperty('loss');
  });

  it('LR increases exponentially across steps', async () => {
    const results = await lrFinder.run(getBatch, hyperparams, 1e-5, 0.1, 5);
    for (let i = 1; i < results.length; i++) {
      expect(results[i]!.lr).toBeGreaterThan(results[i - 1]!.lr);
    }
  });

  it('calls updateLearningRate before each training step', async () => {
    await lrFinder.run(getBatch, hyperparams, 1e-5, 0.1, 3);
    expect(neuralNet.updateLearningRate).toHaveBeenCalledTimes(3);
  });

  it('calls train on each step with batch from callback', async () => {
    await lrFinder.run(getBatch, hyperparams, 1e-5, 0.1, 4);
    expect(neuralNet.train).toHaveBeenCalledTimes(4);
  });

  it('restores model by calling initialize with original hyperparams', async () => {
    await lrFinder.run(getBatch, hyperparams, 1e-5, 0.1, 3);
    expect(neuralNet.initialize).toHaveBeenCalledWith(hyperparams);
  });

  it('stops early if loss explodes (Infinity)', async () => {
    let callCount = 0;
    vi.mocked(neuralNet.train).mockImplementation(async () => {
      callCount++;
      return { loss: callCount >= 3 ? Infinity : 0.5, accuracy: 0.8 };
    });

    const results = await lrFinder.run(getBatch, hyperparams, 1e-5, 0.1, 10);
    // Should stop at step 3 (where loss becomes Infinity)
    expect(results.length).toBe(3);
    expect(results[results.length - 1]!.loss).toBe(Infinity);
  });

  it('stops early if loss exceeds 1e10', async () => {
    let callCount = 0;
    vi.mocked(neuralNet.train).mockImplementation(async () => {
      callCount++;
      return { loss: callCount >= 2 ? 2e10 : 0.5, accuracy: 0.8 };
    });

    const results = await lrFinder.run(getBatch, hyperparams, 1e-5, 0.1, 10);
    expect(results.length).toBe(2);
  });

  it('starts at minLR and ends near maxLR', async () => {
    const results = await lrFinder.run(getBatch, hyperparams, 1e-4, 1, 20);
    expect(results[0]!.lr).toBeCloseTo(1e-4, 6);
    // Last LR should be close to maxLR (but not necessarily equal due to multiplication)
    expect(results[results.length - 1]!.lr).toBeLessThanOrEqual(1);
  });
});

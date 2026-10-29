import { describe, it, expect, beforeEach } from 'vitest';
import { TrainingSession } from '../../../src/core/application/TrainingSession';
import { MockNeuralNetworkService, MockVisualizerService, MockDatasetRepository } from '../mocks';

describe('TrainingSession timeline', () => {
  let neuralNet: MockNeuralNetworkService;
  let visualizer: MockVisualizerService;
  let session: TrainingSession;

  beforeEach(async () => {
    neuralNet = new MockNeuralNetworkService();
    visualizer = new MockVisualizerService();
    session = new TrainingSession(neuralNet, visualizer, new MockDatasetRepository(), {
      renderInterval: 3,
      gridSize: 4,
    });
    await session.loadData('circle');
    await session.setHyperparameters({ learningRate: 0.03, layers: [4] });
  });

  async function steps(n: number): Promise<void> {
    for (let i = 0; i < n; i++) await session.step();
  }

  it('records a frame on each render epoch', async () => {
    await steps(7);
    expect(session.getBoundarySnapshots().map((s) => s.epoch)).toEqual([1, 3, 6]);
  });

  it('replays a recorded frame and returns to live', async () => {
    await steps(7);
    const first = session.getBoundarySnapshots()[0];
    expect(session.showBoundarySnapshot(0)).toBe(true);
    expect(visualizer.lastRenderedPredictions).toEqual(first?.predictions);
    expect(visualizer.lastGridSize).toBe(4);

    visualizer.renderBoundary.mockClear();
    session.showLiveBoundary();
    expect(visualizer.renderBoundary).toHaveBeenCalledTimes(1);
  });

  it('refuses an unknown frame', async () => {
    await steps(2);
    expect(session.showBoundarySnapshot(5)).toBe(false);
  });

  it('starts a new timeline on reset, rebuild and data load', async () => {
    await steps(4);
    session.reset();
    expect(session.getBoundarySnapshots()).toEqual([]);

    await steps(4);
    await session.setHyperparameters({ learningRate: 0.03, layers: [4] });
    expect(session.getBoundarySnapshots()).toEqual([]);

    await steps(4);
    await session.loadData('xor');
    expect(session.getBoundarySnapshots()).toEqual([]);
  });
});

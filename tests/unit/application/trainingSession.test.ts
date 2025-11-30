import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrainingSession } from '../../../src/core/application';
import type { Point } from '../../../src/core/domain';
import {
  MockNeuralNetworkService,
  MockVisualizerService,
  MockDatasetRepository,
} from '../mocks';

/**
 * TrainingSession Unit Tests
 *
 * Tests the application layer orchestrator using mocks for all infrastructure services.
 * Verifies business logic, state management, and correct service coordination.
 */

describe('TrainingSession', () => {
  let neuralNet: MockNeuralNetworkService;
  let visualizer: MockVisualizerService;
  let dataRepo: MockDatasetRepository;
  let session: TrainingSession;

  const defaultConfig = { learningRate: 0.03, layers: [8, 4] as const };

  beforeEach(() => {
    neuralNet = new MockNeuralNetworkService();
    visualizer = new MockVisualizerService();
    dataRepo = new MockDatasetRepository();

    session = new TrainingSession(neuralNet, visualizer, dataRepo, {
      renderInterval: 10,
      gridSize: 5, // Small grid for fast tests
    });
  });

  describe('Initialisation', () => {
    it('should start with correct initial state', () => {
      const state = session.getState();

      expect(state.currentEpoch).toBe(0);
      expect(state.currentLoss).toBeNull();
      expect(state.currentValLoss).toBeNull();
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.isInitialised).toBe(false);
      expect(state.datasetLoaded).toBe(false);
      expect(state.maxEpochs).toBe(0);
      expect(state.batchSize).toBe(0);
      expect(state.targetFps).toBe(60);
      expect(state.validationSplit).toBe(0.2);
    });

    it('should accept dependencies via constructor injection', () => {
      // Verify the session was created with injected dependencies
      expect(session).toBeInstanceOf(TrainingSession);
    });
  });

  describe('setHyperparameters()', () => {
    it('should call neuralNet.initialize() with correct config', async () => {
      await session.setHyperparameters(defaultConfig);

      expect(neuralNet.initialize).toHaveBeenCalledTimes(1);
      expect(neuralNet.initialize).toHaveBeenCalledWith(defaultConfig);
    });

    it('should update state to initialised after setting hyperparameters', async () => {
      await session.setHyperparameters(defaultConfig);

      const state = session.getState();
      expect(state.isInitialised).toBe(true);
    });

    it('should reset epoch and loss when re-initialising', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');
      await session.step(); // Increment epoch

      await session.setHyperparameters({ learningRate: 0.1, layers: [4] });

      const state = session.getState();
      expect(state.currentEpoch).toBe(0);
      expect(state.currentLoss).toBeNull();
    });
  });

  describe('setTrainingConfig()', () => {
    it('should update batch size in state', () => {
      session.setTrainingConfig({ batchSize: 32 });

      const state = session.getState();
      expect(state.batchSize).toBe(32);
    });

    it('should update max epochs in state', () => {
      session.setTrainingConfig({ maxEpochs: 1000 });

      const state = session.getState();
      expect(state.maxEpochs).toBe(1000);
    });

    it('should update target FPS in state', () => {
      session.setTrainingConfig({ targetFps: 30 });

      const state = session.getState();
      expect(state.targetFps).toBe(30);
    });

    it('should allow partial updates', () => {
      session.setTrainingConfig({ batchSize: 64 });
      session.setTrainingConfig({ maxEpochs: 500 });

      const state = session.getState();
      expect(state.batchSize).toBe(64);
      expect(state.maxEpochs).toBe(500);
      expect(state.targetFps).toBe(60); // Unchanged
    });

    it('should notify listeners on config change', () => {
      const listener = vi.fn();
      session.onStateChange(listener);

      session.setTrainingConfig({ batchSize: 16 });

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('loadData()', () => {
    it('should call dataRepo.getDataset() with correct type', async () => {
      await session.loadData('circle');

      expect(dataRepo.getDataset).toHaveBeenCalledTimes(1);
      expect(dataRepo.getDataset).toHaveBeenCalledWith('circle');
    });

    it('should call visualizer.renderData() with loaded points', async () => {
      const mockPoints: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
      ];
      dataRepo.setMockDataset(mockPoints);

      await session.loadData('test');

      expect(visualizer.renderData).toHaveBeenCalledTimes(1);
      expect(visualizer.renderData).toHaveBeenCalledWith(mockPoints);
    });

    it('should update state to datasetLoaded after loading', async () => {
      await session.loadData('xor');

      const state = session.getState();
      expect(state.datasetLoaded).toBe(true);
    });

    it('should load the correct number of points from repository', async () => {
      const mockPoints: Point[] = [
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
        { x: -1, y: -1, label: 0 },
      ];
      dataRepo.setMockDataset(mockPoints);

      await session.loadData('test');

      expect(visualizer.lastRenderedPoints).toHaveLength(3);
    });
  });

  describe('step()', () => {
    beforeEach(async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
      ]);
      await session.loadData('test');
    });

    it('should increment epoch on each step', async () => {
      await session.step();
      expect(session.getState().currentEpoch).toBe(1);

      await session.step();
      expect(session.getState().currentEpoch).toBe(2);

      await session.step();
      expect(session.getState().currentEpoch).toBe(3);
    });

    it('should call neuralNet.train() on each step', async () => {
      await session.step();
      await session.step();
      await session.step();

      expect(neuralNet.train).toHaveBeenCalledTimes(3);
    });

    it('should update currentLoss with value from train()', async () => {
      neuralNet.setLossSequence([0.5, 0.4, 0.3]);

      await session.step();
      expect(session.getState().currentLoss).toBe(0.5);

      await session.step();
      expect(session.getState().currentLoss).toBe(0.4);

      await session.step();
      expect(session.getState().currentLoss).toBe(0.3);
    });

    it('should show decreasing loss values over training steps', async () => {
      neuralNet.setLossSequence([0.8, 0.6, 0.4, 0.2, 0.1]);

      const losses: number[] = [];
      for (let i = 0; i < 5; i++) {
        await session.step();
        const loss = session.getState().currentLoss;
        if (loss !== null) losses.push(loss);
      }

      // Verify loss decreases
      for (let i = 1; i < losses.length; i++) {
        expect(losses[i]).toBeLessThan(losses[i - 1]!);
      }
    });

    it('should throw error if not initialised', async () => {
      const uninitSession = new TrainingSession(neuralNet, visualizer, dataRepo);

      await expect(uninitSession.step()).rejects.toThrow('Hyperparameters not set');
    });

    it('should throw error if no data loaded', async () => {
      const noDataSession = new TrainingSession(neuralNet, visualizer, dataRepo);
      await noDataSession.setHyperparameters(defaultConfig);

      await expect(noDataSession.step()).rejects.toThrow('No data loaded');
    });

    it('should update currentAccuracy with value from train()', async () => {
      neuralNet.accuracySequence = [0.5, 0.7, 0.9];

      await session.step();
      expect(session.getState().currentAccuracy).toBe(0.5);

      await session.step();
      expect(session.getState().currentAccuracy).toBe(0.7);
    });

    it('should record training history on each step', async () => {
      await session.step();
      await session.step();
      await session.step();

      const state = session.getState();
      expect(state.history.records).toHaveLength(3);
      expect(state.history.records[0]?.epoch).toBe(1);
      expect(state.history.records[1]?.epoch).toBe(2);
      expect(state.history.records[2]?.epoch).toBe(3);
    });

    it('should track best loss in history', async () => {
      neuralNet.setLossSequence([0.5, 0.3, 0.4]); // Best is 0.3 at epoch 2

      await session.step();
      await session.step();
      await session.step();

      const state = session.getState();
      expect(state.history.bestLoss).toBe(0.3);
      expect(state.history.bestEpoch).toBe(2);
    });
  });

  describe('exportHistory()', () => {
    beforeEach(async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');
    });

    it('should export history as JSON', async () => {
      await session.step();
      await session.step();

      const json = session.exportHistory('json');
      const parsed = JSON.parse(json);

      expect(parsed.records).toHaveLength(2);
      expect(parsed.summary.totalEpochs).toBe(2);
    });

    it('should export history as CSV', async () => {
      await session.step();
      await session.step();

      const csv = session.exportHistory('csv');
      const lines = csv.split('\n');

      expect(lines[0]).toBe('epoch,loss,accuracy,val_loss,val_accuracy,timestamp');
      expect(lines).toHaveLength(3); // header + 2 data rows
    });
  });

  describe('Validation Split', () => {
    it('should split data when validationSplit > 0', async () => {
      await session.setHyperparameters(defaultConfig);

      // Create 10 data points
      const mockPoints = Array.from({ length: 10 }, (_, i) => ({
        x: i,
        y: i,
        label: i % 2,
      }));
      dataRepo.setMockDataset(mockPoints);

      // Default split is 0.2 (20%)
      await session.loadData('test');
      await session.step();

      // Should call evaluate for validation
      expect(neuralNet.evaluate).toHaveBeenCalled();
    });

    it('should track validation loss in state', async () => {
      await session.setHyperparameters(defaultConfig);

      const mockPoints = Array.from({ length: 10 }, (_, i) => ({
        x: i,
        y: i,
        label: i % 2,
      }));
      dataRepo.setMockDataset(mockPoints);

      await session.loadData('test');
      await session.step();

      const state = session.getState();
      expect(state.currentValLoss).not.toBeNull();
      expect(state.currentValAccuracy).not.toBeNull();
    });

    it('should not evaluate when validationSplit is 0', async () => {
      session.setTrainingConfig({ validationSplit: 0 });
      await session.setHyperparameters(defaultConfig);

      const mockPoints = [{ x: 0, y: 0, label: 0 }];
      dataRepo.setMockDataset(mockPoints);

      await session.loadData('test');
      await session.step();

      expect(neuralNet.evaluate).not.toHaveBeenCalled();
    });

    it('should record validation metrics in history', async () => {
      await session.setHyperparameters(defaultConfig);

      const mockPoints = Array.from({ length: 10 }, (_, i) => ({
        x: i,
        y: i,
        label: i % 2,
      }));
      dataRepo.setMockDataset(mockPoints);

      await session.loadData('test');
      await session.step();

      const state = session.getState();
      expect(state.history.records[0]?.valLoss).not.toBeNull();
      expect(state.history.records[0]?.valAccuracy).not.toBeNull();
    });
  });

  describe('Render Interval Optimisation', () => {
    beforeEach(async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');
    });

    it('should NOT call renderBoundary() when epoch % 10 != 0', async () => {
      // Steps 1-9 should not trigger boundary render
      for (let i = 0; i < 9; i++) {
        await session.step();
      }

      expect(neuralNet.predict).not.toHaveBeenCalled();
      expect(visualizer.renderBoundary).not.toHaveBeenCalled();
    });

    it('should call renderBoundary() ONLY when epoch % 10 == 0', async () => {
      // Execute 10 steps to reach epoch 10
      for (let i = 0; i < 10; i++) {
        await session.step();
      }

      expect(neuralNet.predict).toHaveBeenCalledTimes(1);
      expect(visualizer.renderBoundary).toHaveBeenCalledTimes(1);
    });

    it('should call renderBoundary() at epochs 10, 20, 30...', async () => {
      // Execute 30 steps
      for (let i = 0; i < 30; i++) {
        await session.step();
      }

      // Should render at epochs 10, 20, 30
      expect(visualizer.renderBoundary).toHaveBeenCalledTimes(3);
    });

    it('should call predict() before renderBoundary()', async () => {
      const callOrder: string[] = [];

      neuralNet.predict.mockImplementation(async () => {
        callOrder.push('predict');
        return [];
      });

      visualizer.renderBoundary.mockImplementation(() => {
        callOrder.push('renderBoundary');
      });

      for (let i = 0; i < 10; i++) {
        await session.step();
      }

      expect(callOrder).toEqual(['predict', 'renderBoundary']);
    });

    it('should re-render data points after boundary render', async () => {
      const callOrder: string[] = [];

      // Set up mocks to track call order
      visualizer.renderBoundary.mockImplementation(() => {
        callOrder.push('renderBoundary');
      });

      visualizer.renderData.mockImplementation(() => {
        callOrder.push('renderData');
      });

      // Execute 10 steps to trigger boundary render
      for (let i = 0; i < 10; i++) {
        await session.step();
      }

      // Should render boundary then re-render data on top
      expect(callOrder).toContain('renderBoundary');
      expect(callOrder).toContain('renderData');
      expect(callOrder.lastIndexOf('renderData')).toBeGreaterThan(
        callOrder.indexOf('renderBoundary')
      );
    });
  });

  describe('State Change Notifications', () => {
    it('should notify listeners on state changes', async () => {
      const listener = vi.fn();
      session.onStateChange(listener);

      await session.setHyperparameters(defaultConfig);

      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ isInitialised: true })
      );
    });

    it('should allow unsubscribing from state changes', async () => {
      const listener = vi.fn();
      const unsubscribe = session.onStateChange(listener);

      unsubscribe();
      await session.setHyperparameters(defaultConfig);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should notify on each step', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');

      const listener = vi.fn();
      session.onStateChange(listener);

      await session.step();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ currentEpoch: 1 })
      );
    });
  });

  describe('reset()', () => {
    beforeEach(async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');
    });

    it('should reset epoch to 0', async () => {
      await session.step();
      await session.step();

      session.reset();

      expect(session.getState().currentEpoch).toBe(0);
    });

    it('should reset loss to null', async () => {
      await session.step();

      session.reset();

      expect(session.getState().currentLoss).toBeNull();
    });

    it('should preserve initialised and datasetLoaded state', async () => {
      await session.step();

      session.reset();

      const state = session.getState();
      expect(state.isInitialised).toBe(true);
      expect(state.datasetLoaded).toBe(true);
    });

    it('should re-render data points after reset', async () => {
      visualizer.reset();

      session.reset();

      expect(visualizer.renderData).toHaveBeenCalled();
    });
  });

  describe('dispose()', () => {
    it('should stop running state', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');

      session.start();
      session.dispose();

      expect(session.getState().isRunning).toBe(false);
    });

    it('should clear all listeners', async () => {
      const listener = vi.fn();
      session.onStateChange(listener);

      session.dispose();

      // Trigger a state change
      await session.setHyperparameters(defaultConfig);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe('TrainingSession SOLID Principles', () => {
  it('should depend on abstractions (interfaces), not concretions', () => {
    // This test documents that TrainingSession accepts interface types
    // The mocks implement the same interfaces as the real adapters
    const neuralNet = new MockNeuralNetworkService();
    const visualizer = new MockVisualizerService();
    const dataRepo = new MockDatasetRepository();

    // TrainingSession accepts any implementation of the interfaces
    const session = new TrainingSession(neuralNet, visualizer, dataRepo);

    expect(session).toBeInstanceOf(TrainingSession);
  });

  it('should not know about D3 or TensorFlow implementation details', async () => {
    const neuralNet = new MockNeuralNetworkService();
    const visualizer = new MockVisualizerService();
    const dataRepo = new MockDatasetRepository();

    const session = new TrainingSession(neuralNet, visualizer, dataRepo);

    await session.setHyperparameters({ learningRate: 0.01, layers: [4] });
    dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
    await session.loadData('test');
    await session.step();

    // Session works without any real D3 or TF.js code
    expect(session.getState().currentEpoch).toBe(1);
  });
});

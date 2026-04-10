/**
 * Characterisation Tests for TrainingSession
 *
 * These tests freeze the current behaviour of TrainingSession before
 * the Phase 5 extraction. They act as a regression gate: if any test
 * here fails after extraction, the refactor broke something.
 *
 * DO NOT MODIFY these tests during Phase 5 — they must pass with
 * zero changes to prove the extraction is safe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrainingSession } from '../../../src/core/application/TrainingSession';
import type { TrainingState, TrainingEventType } from '../../../src/core/application/ITrainingSession';
import {
  MockNeuralNetworkService,
  MockVisualizerService,
  MockDatasetRepository,
} from '../mocks';

describe('TrainingSession – Characterisation (regression gate)', () => {
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
      gridSize: 5,
    });
  });

  // ===========================================================================
  // getState() snapshot at each lifecycle transition
  // ===========================================================================

  describe('getState() snapshots', () => {
    it('fresh session: all fields match expected defaults', () => {
      const state = session.getState();
      expect(state).toMatchObject({
        currentEpoch: 0,
        currentLoss: null,
        currentAccuracy: null,
        currentValLoss: null,
        currentValAccuracy: null,
        isRunning: false,
        isPaused: false,
        isProcessing: false,
        isInitialised: false,
        datasetLoaded: false,
        maxEpochs: 0,
        batchSize: 0,
        targetFps: 60,
        validationSplit: 0.2,
      });
      expect(state.history.records).toHaveLength(0);
      expect(state.history.bestLoss).toBeNull();
      expect(state.history.bestEpoch).toBeNull();
    });

    it('after setHyperparameters: isInitialised true, epoch reset', async () => {
      await session.setHyperparameters(defaultConfig);
      const state = session.getState();
      expect(state.isInitialised).toBe(true);
      expect(state.currentEpoch).toBe(0);
      expect(state.currentLoss).toBeNull();
      expect(state.eventType).toBe('initialized');
    });

    it('after loadData: datasetLoaded true', async () => {
      await session.loadData('circle');
      const state = session.getState();
      expect(state.datasetLoaded).toBe(true);
      expect(state.eventType).toBe('dataLoaded');
    });

    it('after step: epoch 1, loss/accuracy populated', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
      ]);
      await session.loadData('test');
      await session.step();

      const state = session.getState();
      expect(state.currentEpoch).toBe(1);
      expect(state.currentLoss).toBeTypeOf('number');
      expect(state.currentAccuracy).toBeTypeOf('number');
      expect(state.eventType).toBe('trainingStep');
      expect(state.history.records).toHaveLength(1);
    });

    it('after reset: epoch 0, loss null, isInitialised preserved', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');
      await session.step();

      session.reset();
      const state = session.getState();
      expect(state.currentEpoch).toBe(0);
      expect(state.currentLoss).toBeNull();
      expect(state.currentAccuracy).toBeNull();
      expect(state.currentValLoss).toBeNull();
      expect(state.currentValAccuracy).toBeNull();
      expect(state.isInitialised).toBe(true);
      expect(state.datasetLoaded).toBe(true);
      expect(state.history.records).toHaveLength(0);
      expect(state.eventType).toBe('reset');
    });

    it('after clearAll: everything cleared', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');
      await session.step();

      session.clearAll();
      const state = session.getState();
      expect(state.currentEpoch).toBe(0);
      expect(state.currentLoss).toBeNull();
      expect(state.isInitialised).toBe(false);
      expect(state.datasetLoaded).toBe(false);
      expect(state.history.records).toHaveLength(0);
      expect(state.eventType).toBe('reset');
    });

    it('after setTrainingConfig: config values updated', () => {
      session.setTrainingConfig({ batchSize: 32, maxEpochs: 100, targetFps: 30 });
      const state = session.getState();
      expect(state.batchSize).toBe(32);
      expect(state.maxEpochs).toBe(100);
      expect(state.targetFps).toBe(30);
      expect(state.eventType).toBe('configChanged');
    });
  });

  // ===========================================================================
  // Listener call counts per event type
  // ===========================================================================

  describe('listener event counts', () => {
    it('setHyperparameters emits exactly 1 initialized event', async () => {
      const events: TrainingEventType[] = [];
      session.onStateChange((s: TrainingState) => { if (s.eventType) events.push(s.eventType); });

      await session.setHyperparameters(defaultConfig);
      expect(events).toEqual(['initialized']);
    });

    it('loadData emits exactly 1 dataLoaded event', async () => {
      const events: TrainingEventType[] = [];
      session.onStateChange((s: TrainingState) => { if (s.eventType) events.push(s.eventType); });

      await session.loadData('circle');
      expect(events).toEqual(['dataLoaded']);
    });

    it('step emits exactly 1 trainingStep event', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');

      const events: TrainingEventType[] = [];
      session.onStateChange((s: TrainingState) => { if (s.eventType) events.push(s.eventType); });

      await session.step();
      expect(events).toEqual(['trainingStep']);
    });

    it('start emits exactly 1 started event synchronously', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');

      const events: TrainingEventType[] = [];
      session.onStateChange((s: TrainingState) => { if (s.eventType) events.push(s.eventType); });

      session.start();
      // Started is emitted synchronously before the loop kicks off
      expect(events[0]).toBe('started');
      session.pause();
    });

    it('pause emits exactly 1 paused event', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');
      session.start();

      const events: TrainingEventType[] = [];
      session.onStateChange((s: TrainingState) => { if (s.eventType) events.push(s.eventType); });

      session.pause();
      expect(events.filter(e => e === 'paused')).toHaveLength(1);
    });

    it('reset emits exactly 1 reset event', () => {
      const events: TrainingEventType[] = [];
      session.onStateChange((s: TrainingState) => { if (s.eventType) events.push(s.eventType); });

      session.reset();
      expect(events).toEqual(['reset']);
    });

    it('setTrainingConfig emits exactly 1 configChanged event', () => {
      const events: TrainingEventType[] = [];
      session.onStateChange((s: TrainingState) => { if (s.eventType) events.push(s.eventType); });

      session.setTrainingConfig({ batchSize: 16 });
      expect(events).toEqual(['configChanged']);
    });

    it('unsubscribe prevents further notifications', async () => {
      const events: TrainingEventType[] = [];
      const unsub = session.onStateChange((s: TrainingState) => { if (s.eventType) events.push(s.eventType); });

      unsub();
      await session.setHyperparameters(defaultConfig);
      expect(events).toHaveLength(0);
    });
  });

  // ===========================================================================
  // History tracking
  // ===========================================================================

  describe('history tracking', () => {
    beforeEach(async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
        { x: 0.5, y: 0.5, label: 0 },
        { x: -0.5, y: -0.5, label: 1 },
        { x: 0.2, y: 0.8, label: 0 },
      ]);
      await session.loadData('test');
    });

    it('history length equals number of steps', async () => {
      for (let i = 0; i < 5; i++) await session.step();
      expect(session.getState().history.records).toHaveLength(5);
    });

    it('each record has correct epoch number', async () => {
      for (let i = 0; i < 3; i++) await session.step();
      const records = session.getState().history.records;
      expect(records[0]?.epoch).toBe(1);
      expect(records[1]?.epoch).toBe(2);
      expect(records[2]?.epoch).toBe(3);
    });

    it('best loss tracks minimum', async () => {
      neuralNet.setLossSequence([0.5, 0.3, 0.7]);
      for (let i = 0; i < 3; i++) await session.step();

      const history = session.getState().history;
      expect(history.bestLoss).toBe(0.3);
      expect(history.bestEpoch).toBe(2);
    });

    it('getHistory() returns same object as state.history', async () => {
      await session.step();
      expect(session.getHistory()).toBe(session.getState().history);
    });

    it('records include learning rate', async () => {
      await session.step();
      const record = session.getState().history.records[0];
      expect(record?.learningRate).toBeTypeOf('number');
      expect(record?.learningRate).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Custom data
  // ===========================================================================

  describe('custom data', () => {
    it('setCustomData makes dataset loaded', () => {
      session.setCustomData([{ x: 0, y: 0, label: 0 }]);
      expect(session.getState().datasetLoaded).toBe(true);
    });

    it('setCustomData with empty array clears dataset', () => {
      session.setCustomData([{ x: 0, y: 0, label: 0 }]);
      session.setCustomData([]);
      expect(session.getState().datasetLoaded).toBe(false);
    });

    it('getData returns copy of current data', async () => {
      const points = [{ x: 1, y: 2, label: 0 }, { x: 3, y: 4, label: 1 }];
      session.setCustomData(points);
      const data = session.getData();
      expect(data).toHaveLength(2);
      // Should be a copy, not the same reference
      expect(data).not.toBe(points);
    });

    it('getTrainingData returns training split', async () => {
      const points = Array.from({ length: 10 }, (_, i) => ({
        x: i, y: i, label: i % 2,
      }));
      session.setCustomData(points);
      const training = session.getTrainingData();
      // With 20% validation split, should have ~8 training points
      expect(training.length).toBeGreaterThan(0);
      expect(training.length).toBeLessThan(points.length);
    });
  });

  // ===========================================================================
  // Config undo/redo
  // ===========================================================================

  describe('config undo/redo', () => {
    it('canUndo is false initially', () => {
      expect(session.canUndo()).toBe(false);
    });

    it('canUndo is true after two configs', async () => {
      await session.setHyperparameters({ learningRate: 0.01, layers: [4] });
      await session.setHyperparameters({ learningRate: 0.02, layers: [8] });
      expect(session.canUndo()).toBe(true);
    });

    it('undoConfig restores previous config', async () => {
      await session.setHyperparameters({ learningRate: 0.01, layers: [4] });
      await session.setHyperparameters({ learningRate: 0.02, layers: [8] });

      const result = await session.undoConfig();
      expect(result).toBe(true);
      // neuralNet.initialize should have been called with original config
      expect(neuralNet.initialize).toHaveBeenLastCalledWith(
        expect.objectContaining({ learningRate: 0.01 })
      );
    });

    it('redoConfig restores next config', async () => {
      await session.setHyperparameters({ learningRate: 0.01, layers: [4] });
      await session.setHyperparameters({ learningRate: 0.02, layers: [8] });
      await session.undoConfig();

      const result = await session.redoConfig();
      expect(result).toBe(true);
      expect(neuralNet.initialize).toHaveBeenLastCalledWith(
        expect.objectContaining({ learningRate: 0.02 })
      );
    });

    it('canRedo is false when at latest config', async () => {
      await session.setHyperparameters({ learningRate: 0.01, layers: [4] });
      expect(session.canRedo()).toBe(false);
    });
  });

  // ===========================================================================
  // Boundary recording
  // ===========================================================================

  describe('boundary recording', () => {
    it('getBoundarySnapshots returns empty array initially', () => {
      expect(session.getBoundarySnapshots()).toEqual([]);
    });

    it('clearBoundarySnapshots empties the array', () => {
      session.setRecording(true, 1);
      session.clearBoundarySnapshots();
      expect(session.getBoundarySnapshots()).toEqual([]);
    });

    it('setRecording clears snapshots when enabling', () => {
      session.setRecording(true, 5);
      expect(session.getBoundarySnapshots()).toEqual([]);
    });
  });

  // ===========================================================================
  // Completion callback
  // ===========================================================================

  describe('onComplete callback', () => {
    it('onComplete is called with maxEpochs when epoch limit reached in loop', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }, { x: 1, y: 1, label: 1 }]);
      await session.loadData('test');
      session.setTrainingConfig({ maxEpochs: 3 });

      const completionReason = vi.fn();
      session.onComplete(completionReason);

      session.start();

      // Wait for loop to finish (3 epochs at ~60fps)
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(completionReason).toHaveBeenCalledWith('maxEpochs');
    });
  });

  // ===========================================================================
  // getCurrentLearningRate
  // ===========================================================================

  describe('getCurrentLearningRate', () => {
    it('returns initial LR after setHyperparameters', async () => {
      await session.setHyperparameters({ learningRate: 0.05, layers: [4] });
      expect(session.getCurrentLearningRate()).toBe(0.05);
    });
  });

  // ===========================================================================
  // getDetectedNumClasses
  // ===========================================================================

  describe('getDetectedNumClasses', () => {
    it('defaults to 2', () => {
      expect(session.getDetectedNumClasses()).toBe(2);
    });

    it('detects correct number of classes from data', async () => {
      dataRepo.setMockDataset([
        { x: 0, y: 0, label: 0 },
        { x: 1, y: 1, label: 1 },
        { x: 2, y: 2, label: 2 },
      ]);
      await session.loadData('test');
      expect(session.getDetectedNumClasses()).toBe(3);
    });
  });

  // ===========================================================================
  // exportHistory
  // ===========================================================================

  describe('exportHistory', () => {
    it('JSON export includes summary with totalEpochs', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');
      await session.step();
      await session.step();

      const json = JSON.parse(session.exportHistory('json'));
      expect(json.records).toHaveLength(2);
      expect(json.summary.totalEpochs).toBe(2);
    });

    it('CSV export has header + data rows', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');
      await session.step();

      const csv = session.exportHistory('csv');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('epoch,loss,accuracy,val_loss,val_accuracy,learning_rate,timestamp');
      expect(lines).toHaveLength(2); // header + 1 row
    });
  });

  // ===========================================================================
  // LR Finder
  // ===========================================================================

  describe('runLRFinder', () => {
    it('returns array of {lr, loss} points', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }, { x: 1, y: 1, label: 1 }]);
      await session.loadData('test');

      const results = await session.runLRFinder(1e-5, 0.1, 10);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('lr');
      expect(results[0]).toHaveProperty('loss');
    });

    it('restores model after LR finder completes', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }, { x: 1, y: 1, label: 1 }]);
      await session.loadData('test');

      const initCallsBefore = neuralNet.initialize.mock.calls.length;
      await session.runLRFinder(1e-5, 0.1, 5);

      // Should re-initialize with original config to restore model
      expect(neuralNet.initialize.mock.calls.length).toBe(initCallsBefore + 1);
      expect(neuralNet.initialize).toHaveBeenLastCalledWith(defaultConfig);
    });
  });

  // ===========================================================================
  // dispose
  // ===========================================================================

  describe('dispose', () => {
    it('stops training and clears listeners', async () => {
      await session.setHyperparameters(defaultConfig);
      dataRepo.setMockDataset([{ x: 0, y: 0, label: 0 }]);
      await session.loadData('test');

      const listener = vi.fn();
      session.onStateChange(listener);
      session.start();
      session.dispose();

      expect(session.getState().isRunning).toBe(false);

      listener.mockClear();
      session.reset(); // Should not notify disposed listeners
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

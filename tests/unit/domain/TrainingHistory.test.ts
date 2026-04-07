import { describe, it, expect } from 'vitest';
import { createEmptyHistory, addHistoryRecord, exportHistory, type TrainingRecord } from '../../../src/core/domain/TrainingHistory';

function makeRecord(epoch: number, overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  return {
    epoch,
    loss: 1 / (epoch + 1),
    accuracy: epoch / 10,
    valLoss: null,
    valAccuracy: null,
    timestamp: 1000 + epoch * 100,
    learningRate: 0.01,
    ...overrides,
  };
}

describe('TrainingHistory', () => {
  describe('createEmptyHistory', () => {
    it('should create empty history with null metrics', () => {
      const history = createEmptyHistory();
      expect(history.records).toHaveLength(0);
      expect(history.bestLoss).toBeNull();
      expect(history.bestEpoch).toBeNull();
      expect(history.bestValLoss).toBeNull();
      expect(history.bestValEpoch).toBeNull();
      expect(history.totalTimeMs).toBe(0);
    });
  });

  describe('addHistoryRecord', () => {
    it('should add record and track best loss', () => {
      let history = createEmptyHistory();
      history = addHistoryRecord(history, makeRecord(1, { loss: 0.5 }));
      expect(history.records).toHaveLength(1);
      expect(history.bestLoss).toBe(0.5);
      expect(history.bestEpoch).toBe(1);
    });

    it('should update best loss when lower loss is found', () => {
      let history = createEmptyHistory();
      history = addHistoryRecord(history, makeRecord(1, { loss: 0.5 }));
      history = addHistoryRecord(history, makeRecord(2, { loss: 0.3 }));
      expect(history.bestLoss).toBe(0.3);
      expect(history.bestEpoch).toBe(2);
    });

    it('should not update best loss when higher loss is found', () => {
      let history = createEmptyHistory();
      history = addHistoryRecord(history, makeRecord(1, { loss: 0.3 }));
      history = addHistoryRecord(history, makeRecord(2, { loss: 0.5 }));
      expect(history.bestLoss).toBe(0.3);
      expect(history.bestEpoch).toBe(1);
    });

    it('should track best validation loss', () => {
      let history = createEmptyHistory();
      history = addHistoryRecord(history, makeRecord(1, { valLoss: 0.6 }));
      history = addHistoryRecord(history, makeRecord(2, { valLoss: 0.4 }));
      expect(history.bestValLoss).toBe(0.4);
      expect(history.bestValEpoch).toBe(2);
    });

    it('should use O(1) amortized push instead of O(n) spread copy', () => {
      let history = createEmptyHistory();
      const recordsRef = history.records;

      // Add a record — the same array reference should be reused (push, not spread)
      history = addHistoryRecord(history, makeRecord(1));
      expect(history.records).toBe(recordsRef);
      expect(history.records).toHaveLength(1);

      // Add another
      history = addHistoryRecord(history, makeRecord(2));
      expect(history.records).toBe(recordsRef);
      expect(history.records).toHaveLength(2);
    });

    it('should handle large number of records efficiently', () => {
      let history = createEmptyHistory();
      const n = 10000;
      const start = performance.now();

      for (let i = 0; i < n; i++) {
        history = addHistoryRecord(history, makeRecord(i + 1));
      }

      const elapsed = performance.now() - start;
      expect(history.records).toHaveLength(n);
      // With O(1) push, 10k records should take well under 100ms
      expect(elapsed).toBeLessThan(500);
    });

    it('should calculate totalTimeMs from first to latest record', () => {
      let history = createEmptyHistory();
      history = addHistoryRecord(history, makeRecord(1, { timestamp: 1000 }));
      history = addHistoryRecord(history, makeRecord(2, { timestamp: 2000 }));
      history = addHistoryRecord(history, makeRecord(3, { timestamp: 3000 }));
      expect(history.totalTimeMs).toBe(2000);
    });
  });

  describe('exportHistory', () => {
    it('should export as JSON with summary', () => {
      let history = createEmptyHistory();
      history = addHistoryRecord(history, makeRecord(1, { loss: 0.5, accuracy: 0.8 }));
      const json = exportHistory(history, 'json');
      const parsed = JSON.parse(json);
      expect(parsed.records).toHaveLength(1);
      expect(parsed.summary.totalEpochs).toBe(1);
      expect(parsed.summary.finalLoss).toBe(0.5);
    });

    it('should export as CSV with header', () => {
      let history = createEmptyHistory();
      history = addHistoryRecord(history, makeRecord(1));
      const csv = exportHistory(history, 'csv');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('epoch,loss,accuracy,val_loss,val_accuracy,learning_rate,timestamp');
      expect(lines).toHaveLength(2);
    });
  });
});

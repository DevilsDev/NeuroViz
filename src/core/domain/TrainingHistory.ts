/**
 * A single record in the training history.
 */
export interface TrainingRecord {
  /** Epoch number (1-indexed) */
  readonly epoch: number;
  /** Training loss at this epoch */
  readonly loss: number;
  /** Training accuracy at this epoch (0-1) */
  readonly accuracy: number;
  /** Validation loss at this epoch (null if no validation) */
  readonly valLoss: number | null;
  /** Validation accuracy at this epoch (null if no validation) */
  readonly valAccuracy: number | null;
  /** Timestamp when this epoch completed */
  readonly timestamp: number;
}

/**
 * Complete training history for a session.
 */
export interface TrainingHistory {
  /** All training records */
  readonly records: readonly TrainingRecord[];
  /** Best (lowest) training loss achieved */
  readonly bestLoss: number | null;
  /** Epoch where best training loss was achieved */
  readonly bestEpoch: number | null;
  /** Best (lowest) validation loss achieved */
  readonly bestValLoss: number | null;
  /** Epoch where best validation loss was achieved */
  readonly bestValEpoch: number | null;
  /** Total training time in milliseconds */
  readonly totalTimeMs: number;
}

/**
 * Creates an empty training history.
 */
export function createEmptyHistory(): TrainingHistory {
  return {
    records: [],
    bestLoss: null,
    bestEpoch: null,
    bestValLoss: null,
    bestValEpoch: null,
    totalTimeMs: 0,
  };
}

/**
 * Adds a record to the training history and updates best metrics.
 */
export function addHistoryRecord(
  history: TrainingHistory,
  record: TrainingRecord
): TrainingHistory {
  const records = [...history.records, record];

  const isBestLoss = history.bestLoss === null || record.loss < history.bestLoss;
  const isBestValLoss =
    record.valLoss !== null &&
    (history.bestValLoss === null || record.valLoss < history.bestValLoss);

  return {
    records,
    bestLoss: isBestLoss ? record.loss : history.bestLoss,
    bestEpoch: isBestLoss ? record.epoch : history.bestEpoch,
    bestValLoss: isBestValLoss ? record.valLoss : history.bestValLoss,
    bestValEpoch: isBestValLoss ? record.epoch : history.bestValEpoch,
    totalTimeMs: record.timestamp - (history.records[0]?.timestamp ?? record.timestamp),
  };
}

/**
 * Export format options for training history.
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Exports training history to the specified format.
 */
export function exportHistory(history: TrainingHistory, format: ExportFormat): string {
  const lastRecord = history.records[history.records.length - 1];

  if (format === 'json') {
    return JSON.stringify(
      {
        records: history.records,
        summary: {
          totalEpochs: history.records.length,
          bestLoss: history.bestLoss,
          bestEpoch: history.bestEpoch,
          bestValLoss: history.bestValLoss,
          bestValEpoch: history.bestValEpoch,
          totalTimeMs: history.totalTimeMs,
          finalLoss: lastRecord?.loss ?? null,
          finalAccuracy: lastRecord?.accuracy ?? null,
          finalValLoss: lastRecord?.valLoss ?? null,
          finalValAccuracy: lastRecord?.valAccuracy ?? null,
        },
      },
      null,
      2
    );
  }

  // CSV format
  const header = 'epoch,loss,accuracy,val_loss,val_accuracy,timestamp';
  const rows = history.records.map(
    (r) =>
      `${r.epoch},${r.loss.toFixed(6)},${r.accuracy.toFixed(4)},${r.valLoss?.toFixed(6) ?? ''},${r.valAccuracy?.toFixed(4) ?? ''},${r.timestamp}`
  );
  return [header, ...rows].join('\n');
}

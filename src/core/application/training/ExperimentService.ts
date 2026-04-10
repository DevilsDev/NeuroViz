import type { Hyperparameters, Prediction } from '../../domain';
import { ConfigHistory } from '../../domain/ConfigHistory';

/**
 * Owns configuration undo/redo, boundary snapshots, and completion callbacks.
 *
 * Single responsibility: experiment lifecycle management.
 */
export class ExperimentService {
  private readonly configHistory: ConfigHistory = new ConfigHistory();
  private boundarySnapshots: Array<{ epoch: number; predictions: Prediction[] }> = [];
  private recordingEnabled = false;
  private snapshotInterval = 10;
  private onCompleteCallback: ((reason: 'maxEpochs' | 'earlyStopping' | 'manual') => void) | null = null;

  // ===========================================================================
  // Config history (undo/redo)
  // ===========================================================================

  pushConfig(config: Hyperparameters, description = 'Configuration updated'): void {
    this.configHistory.push(config, description);
  }

  undoConfig(): Hyperparameters | null {
    return this.configHistory.undo();
  }

  redoConfig(): Hyperparameters | null {
    return this.configHistory.redo();
  }

  canUndo(): boolean {
    return this.configHistory.canUndo();
  }

  canRedo(): boolean {
    return this.configHistory.canRedo();
  }

  // ===========================================================================
  // Boundary recording
  // ===========================================================================

  setRecording(enabled: boolean, interval = 10): void {
    this.recordingEnabled = enabled;
    this.snapshotInterval = interval;
    if (enabled) {
      this.boundarySnapshots = [];
    }
  }

  maybeRecordSnapshot(epoch: number, predictions: Prediction[]): void {
    if (this.recordingEnabled && epoch % this.snapshotInterval === 0) {
      this.boundarySnapshots.push({
        epoch,
        predictions: [...predictions],
      });
    }
  }

  getBoundarySnapshots(): Array<{ epoch: number; predictions: Prediction[] }> {
    return [...this.boundarySnapshots];
  }

  clearBoundarySnapshots(): void {
    this.boundarySnapshots = [];
  }

  // ===========================================================================
  // Completion callback
  // ===========================================================================

  onComplete(callback: (reason: 'maxEpochs' | 'earlyStopping' | 'manual') => void): void {
    this.onCompleteCallback = callback;
  }

  notifyComplete(reason: 'maxEpochs' | 'earlyStopping' | 'manual'): void {
    this.onCompleteCallback?.(reason);
  }
}

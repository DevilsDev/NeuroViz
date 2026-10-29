import type { Hyperparameters, Prediction } from '../../domain';
import { ConfigHistory } from '../../domain/ConfigHistory';

/** Most boundary snapshots kept for the timeline; older ones are thinned out */
export const MAX_SNAPSHOTS = 60;

export interface BoundarySnapshot {
  epoch: number;
  predictions: Prediction[];
}

/**
 * Owns configuration undo/redo, boundary snapshots, and completion callbacks.
 *
 * Single responsibility: experiment lifecycle management.
 */
export class ExperimentService {
  private readonly configHistory: ConfigHistory = new ConfigHistory();
  private boundarySnapshots: BoundarySnapshot[] = [];
  private recordingEnabled = true;
  /** Record every `baseStride`-th rendered epoch; doubles each time the cap is hit */
  private baseStride = 1;
  private stride = 1;
  private sinceLast = 0;
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

  /**
   * @param interval - record every `interval`-th call to recordSnapshot()
   */
  setRecording(enabled: boolean, interval = 1): void {
    this.recordingEnabled = enabled;
    this.baseStride = Math.max(1, Math.floor(interval));
    if (enabled) {
      this.clearBoundarySnapshots();
    }
  }

  /**
   * Called on epochs where the boundary was recomputed. Keeps at most
   * MAX_SNAPSHOTS evenly thinned frames; `force` always records (final epoch).
   */
  recordSnapshot(epoch: number, predictions: Prediction[], force = false): void {
    if (!this.recordingEnabled || predictions.length === 0) return;
    this.sinceLast++;
    if (!force && this.sinceLast < this.stride) return;
    this.sinceLast = 0;

    const snapshot = { epoch, predictions: [...predictions] };
    const last = this.boundarySnapshots[this.boundarySnapshots.length - 1];
    if (last?.epoch === epoch) {
      this.boundarySnapshots[this.boundarySnapshots.length - 1] = snapshot;
    } else {
      this.boundarySnapshots.push(snapshot);
    }

    if (this.boundarySnapshots.length > MAX_SNAPSHOTS) {
      const newest = this.boundarySnapshots[this.boundarySnapshots.length - 1] as BoundarySnapshot;
      this.boundarySnapshots = this.boundarySnapshots.filter((_, i) => i % 2 === 0);
      if (this.boundarySnapshots[this.boundarySnapshots.length - 1] !== newest) {
        this.boundarySnapshots.push(newest);
      }
      this.stride *= 2;
    }
  }

  getBoundarySnapshots(): BoundarySnapshot[] {
    return [...this.boundarySnapshots];
  }

  clearBoundarySnapshots(): void {
    this.boundarySnapshots = [];
    this.stride = this.baseStride;
    this.sinceLast = 0;
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

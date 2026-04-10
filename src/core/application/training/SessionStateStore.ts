import type { TrainingConfig, TrainingHistory } from '../../domain';
import { createEmptyHistory, addHistoryRecord } from '../../domain';
import type { TrainingState, TrainingEventType } from '../ITrainingSession';

/**
 * Owns the mutable training state and the observer/listener mechanism.
 *
 * Single responsibility: state storage + notification.
 * All state mutations go through typed setter methods.
 * getState() returns an immutable snapshot.
 */
export class SessionStateStore {
  private readonly listeners: Set<(state: TrainingState) => void> = new Set();

  // Training progress
  private currentEpoch = 0;
  private currentLoss: number | null = null;
  private currentAccuracy: number | null = null;
  private currentValLoss: number | null = null;
  private currentValAccuracy: number | null = null;

  // Lifecycle flags
  private isInitialised = false;
  private datasetLoaded = false;

  // Loop control flags
  private isTraining = false;
  private isPaused = false;
  private isProcessingStep = false;

  // History
  private history: TrainingHistory = createEmptyHistory();

  // Event type for the most recent notification
  private lastEventType: TrainingEventType | undefined;

  // Runtime training config reference (set externally, read for snapshots)
  private trainingConfig: Required<TrainingConfig>;

  constructor(initialConfig: Required<TrainingConfig>) {
    this.trainingConfig = initialConfig;
  }

  // ===========================================================================
  // Snapshot
  // ===========================================================================

  getState(): TrainingState {
    return {
      eventType: this.lastEventType,
      currentEpoch: this.currentEpoch,
      currentLoss: this.currentLoss,
      currentAccuracy: this.currentAccuracy,
      currentValLoss: this.currentValLoss,
      currentValAccuracy: this.currentValAccuracy,
      isRunning: this.isTraining,
      isPaused: this.isPaused,
      isProcessing: this.isProcessingStep,
      isInitialised: this.isInitialised,
      datasetLoaded: this.datasetLoaded,
      maxEpochs: this.trainingConfig.maxEpochs,
      batchSize: this.trainingConfig.batchSize,
      targetFps: this.trainingConfig.targetFps,
      validationSplit: this.trainingConfig.validationSplit,
      history: this.history,
    };
  }

  // ===========================================================================
  // Listeners
  // ===========================================================================

  addListener(callback: (state: TrainingState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(eventType?: TrainingEventType): void {
    this.lastEventType = eventType;
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  clearListeners(): void {
    this.listeners.clear();
  }

  // ===========================================================================
  // Epoch / metrics setters
  // ===========================================================================

  incrementEpoch(): number {
    return ++this.currentEpoch;
  }

  getEpoch(): number {
    return this.currentEpoch;
  }

  setMetrics(loss: number, accuracy: number): void {
    this.currentLoss = loss;
    this.currentAccuracy = accuracy;
  }

  setValidationMetrics(valLoss: number, valAccuracy: number): void {
    this.currentValLoss = valLoss;
    this.currentValAccuracy = valAccuracy;
  }

  // ===========================================================================
  // Flag setters / getters
  // ===========================================================================

  setInitialised(value: boolean): void {
    this.isInitialised = value;
  }

  getIsInitialised(): boolean {
    return this.isInitialised;
  }

  setDatasetLoaded(value: boolean): void {
    this.datasetLoaded = value;
  }

  getDatasetLoaded(): boolean {
    return this.datasetLoaded;
  }

  setTraining(value: boolean): void {
    this.isTraining = value;
  }

  getIsTraining(): boolean {
    return this.isTraining;
  }

  setPaused(value: boolean): void {
    this.isPaused = value;
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }

  setProcessingStep(value: boolean): void {
    this.isProcessingStep = value;
  }

  getIsProcessingStep(): boolean {
    return this.isProcessingStep;
  }

  // ===========================================================================
  // History
  // ===========================================================================

  getHistory(): TrainingHistory {
    return this.history;
  }

  addHistoryRecord(record: Parameters<typeof addHistoryRecord>[1]): void {
    this.history = addHistoryRecord(this.history, record);
  }

  // ===========================================================================
  // Config
  // ===========================================================================

  setTrainingConfig(config: Required<TrainingConfig>): void {
    this.trainingConfig = config;
  }

  getTrainingConfig(): Required<TrainingConfig> {
    return this.trainingConfig;
  }

  // ===========================================================================
  // Reset
  // ===========================================================================

  resetProgress(): void {
    this.currentEpoch = 0;
    this.currentLoss = null;
    this.currentAccuracy = null;
    this.currentValLoss = null;
    this.currentValAccuracy = null;
    this.history = createEmptyHistory();
  }

  resetAll(): void {
    this.resetProgress();
    this.isTraining = false;
    this.isPaused = false;
    this.isProcessingStep = false;
  }

  clearAll(): void {
    this.resetAll();
    this.datasetLoaded = false;
    this.isInitialised = false;
  }
}

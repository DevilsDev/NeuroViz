import type { TrainingHistory } from '../domain';

/**
 * Common interface for disposable chart services.
 */
export interface IDisposable {
  dispose(): void;
}

/**
 * Port for loss/accuracy chart rendering.
 */
export interface ILossChartService extends IDisposable {
  update(history: TrainingHistory): void;
  clear(): void;
}

/**
 * Port for learning rate chart rendering.
 */
export interface ILearningRateChartService extends IDisposable {
  render(history: TrainingHistory): void;
  clear(): void;
}

/**
 * Port for network architecture diagram rendering.
 */
export interface INetworkDiagramService extends IDisposable {
  render(
    layers: number[],
    activations: string[],
    weights: number[][][],
    dropoutMask?: boolean[][]
  ): void;
  clear(): void;
}

/**
 * Port for confusion matrix rendering.
 */
export interface IConfusionMatrixService extends IDisposable {
  render(data: { matrix: number[][]; labels: string[]; total: number }): void;
  clear(): void;
}

/**
 * Port for weight histogram rendering.
 */
export interface IWeightHistogramService extends IDisposable {
  update(weights: number[]): void;
  clear(): void;
}

/**
 * Port for activation histogram rendering.
 */
export interface IActivationHistogramService extends IDisposable {
  update(layersData: Array<{ layerIndex: number; layerName: string; activations: number[] }>): void;
  clear(): void;
}

/**
 * Manages Web Worker for offloading heavy computations.
 */

import type { WorkerMessage, WorkerResponse } from './training.worker';

type MessageHandler = (payload: unknown) => void;

export class WorkerManager {
  private worker: Worker | null = null;
  private handlers: Map<string, MessageHandler> = new Map();
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof Worker !== 'undefined';
  }

  /**
   * Initializes the worker.
   */
  async init(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Web Workers not supported');
      return false;
    }

    try {
      // Create worker from module
      this.worker = new Worker(
        new URL('./training.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, payload } = event.data;
        const handler = this.handlers.get(type);
        if (handler) {
          handler(payload);
        }
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
      };

      return true;
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      return false;
    }
  }

  /**
   * Sends a message to the worker.
   */
  postMessage(message: WorkerMessage): void {
    if (this.worker) {
      this.worker.postMessage(message);
    }
  }

  /**
   * Registers a handler for a response type.
   */
  on(type: string, handler: MessageHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Removes a handler.
   */
  off(type: string): void {
    this.handlers.delete(type);
  }

  /**
   * Sends a message and waits for response.
   */
  async request<T>(message: WorkerMessage, responseType: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        this.handlers.delete(responseType);
        reject(new Error('Worker request timeout'));
      }, 10000);

      this.handlers.set(responseType, (payload) => {
        clearTimeout(timeout);
        this.handlers.delete(responseType);
        resolve(payload as T);
      });

      this.handlers.set('error', (payload) => {
        clearTimeout(timeout);
        this.handlers.delete(responseType);
        this.handlers.delete('error');
        reject(new Error((payload as { message: string }).message));
      });

      this.worker.postMessage(message);
    });
  }

  /**
   * Processes a batch using the worker.
   */
  async processBatch(
    data: Array<{ x: number; y: number; label: number }>,
    batchSize: number
  ): Promise<Array<{ x: number; y: number; label: number }>> {
    if (!this.worker) {
      // Fallback: process on main thread
      return this.processBatchSync(data, batchSize);
    }

    const result = await this.request<{ batch: Array<{ x: number; y: number; label: number }> }>(
      { type: 'process_batch', payload: { data, batchSize } },
      'batch_ready'
    );
    return result.batch;
  }

  /**
   * Synchronous batch processing fallback.
   */
  private processBatchSync(
    data: Array<{ x: number; y: number; label: number }>,
    batchSize: number
  ): Array<{ x: number; y: number; label: number }> {
    const shuffled = [...data];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return batchSize > 0 && batchSize < shuffled.length
      ? shuffled.slice(0, batchSize)
      : shuffled;
  }

  /**
   * Calculates metrics using the worker.
   */
  async calculateMetrics(
    predictions: number[],
    labels: number[],
    numClasses: number
  ): Promise<{
    matrix: number[][];
    classMetrics: Array<{ precision: number; recall: number; f1: number }>;
    macro: { precision: number; recall: number; f1: number };
  }> {
    if (!this.worker) {
      // Fallback would go here
      throw new Error('Worker not available for metrics calculation');
    }

    return this.request(
      { type: 'calculate_metrics', payload: { predictions, labels, numClasses } },
      'metrics_ready'
    );
  }

  /**
   * Generates grid points using the worker.
   */
  async generateGrid(
    gridSize: number,
    xRange: [number, number],
    yRange: [number, number]
  ): Promise<Array<{ x: number; y: number }>> {
    if (!this.worker) {
      // Fallback: generate on main thread
      return this.generateGridSync(gridSize, xRange, yRange);
    }

    const result = await this.request<{ grid: Array<{ x: number; y: number }> }>(
      { type: 'generate_grid', payload: { gridSize, xRange, yRange } },
      'grid_ready'
    );
    return result.grid;
  }

  /**
   * Synchronous grid generation fallback.
   */
  private generateGridSync(
    gridSize: number,
    xRange: [number, number],
    yRange: [number, number]
  ): Array<{ x: number; y: number }> {
    const grid: Array<{ x: number; y: number }> = [];
    const xStep = (xRange[1] - xRange[0]) / (gridSize - 1);
    const yStep = (yRange[1] - yRange[0]) / (gridSize - 1);

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        grid.push({
          x: xRange[0] + j * xStep,
          y: yRange[0] + i * yStep,
        });
      }
    }
    return grid;
  }

  /**
   * Terminates the worker.
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.handlers.clear();
  }

  /**
   * Returns whether the worker is available.
   */
  get available(): boolean {
    return this.worker !== null;
  }
}

// Singleton instance
export const workerManager = new WorkerManager();

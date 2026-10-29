/**
 * Training Web Worker
 * Handles heavy computations off the main thread.
 * Note: TensorFlow.js must run on main thread, but we can offload
 * data processing and coordinate training batches.
 */

export interface WorkerMessage {
  type: 'process_batch' | 'calculate_metrics' | 'generate_grid';
  payload: unknown;
}

export interface WorkerResponse {
  type: 'batch_ready' | 'metrics_ready' | 'grid_ready' | 'error';
  payload: unknown;
}

// Handle messages from main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'process_batch':
        handleProcessBatch(payload as BatchPayload);
        break;
      case 'calculate_metrics':
        handleCalculateMetrics(payload as MetricsPayload);
        break;
      case 'generate_grid':
        handleGenerateGrid(payload as GridPayload);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: { message: error instanceof Error ? error.message : 'Unknown error' },
    } as WorkerResponse);
  }
};

interface BatchPayload {
  data: Array<{ x: number; y: number; label: number }>;
  batchSize: number;
}

interface MetricsPayload {
  predictions: number[];
  labels: number[];
  numClasses: number;
}

interface GridPayload {
  gridSize: number;
  xRange: [number, number];
  yRange: [number, number];
}

/**
 * Shuffles and batches data for training.
 */
function handleProcessBatch(payload: BatchPayload): void {
  const { data, batchSize } = payload;
  
  // Shuffle data
  const shuffled = [...data];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }

  // Create batch
  const batch = batchSize > 0 && batchSize < shuffled.length
    ? shuffled.slice(0, batchSize)
    : shuffled;

  self.postMessage({
    type: 'batch_ready',
    payload: { batch },
  } as WorkerResponse);
}

/**
 * Calculates confusion matrix and metrics.
 */
function handleCalculateMetrics(payload: MetricsPayload): void {
  const { predictions, labels, numClasses } = payload;
  
  // Build confusion matrix
  const matrix: number[][] = Array(numClasses)
    .fill(null)
    .map(() => Array(numClasses).fill(0) as number[]);

  for (let i = 0; i < predictions.length; i++) {
    const actual = labels[i] ?? 0;
    const predicted = predictions[i] ?? 0;
    if (matrix[actual]) {
      matrix[actual][predicted] = (matrix[actual][predicted] ?? 0) + 1;
    }
  }

  // Calculate per-class metrics
  const classMetrics: Array<{ precision: number; recall: number; f1: number }> = [];
  
  for (let c = 0; c < numClasses; c++) {
    let tp = 0, fp = 0, fn = 0;
    
    for (let i = 0; i < numClasses; i++) {
      for (let j = 0; j < numClasses; j++) {
        const count = matrix[i]?.[j] ?? 0;
        if (i === c && j === c) tp += count;
        else if (j === c) fp += count;
        else if (i === c) fn += count;
      }
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    
    classMetrics.push({ precision, recall, f1 });
  }

  // Macro averages
  const macroPrecision = classMetrics.reduce((sum, m) => sum + m.precision, 0) / numClasses;
  const macroRecall = classMetrics.reduce((sum, m) => sum + m.recall, 0) / numClasses;
  const macroF1 = classMetrics.reduce((sum, m) => sum + m.f1, 0) / numClasses;

  self.postMessage({
    type: 'metrics_ready',
    payload: {
      matrix,
      classMetrics,
      macro: { precision: macroPrecision, recall: macroRecall, f1: macroF1 },
    },
  } as WorkerResponse);
}

/**
 * Generates prediction grid points.
 */
function handleGenerateGrid(payload: GridPayload): void {
  const { gridSize, xRange, yRange } = payload;
  
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

  self.postMessage({
    type: 'grid_ready',
    payload: { grid },
  } as WorkerResponse);
}

export {};

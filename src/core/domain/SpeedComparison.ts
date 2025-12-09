import type { TrainingHistory } from './TrainingHistory';

/**
 * Speed metrics for training performance
 */
export interface SpeedMetrics {
  /** Epochs per second */
  readonly epochsPerSecond: number;
  /** Average epoch duration in milliseconds */
  readonly avgEpochDurationMs: number;
  /** Total epochs */
  readonly totalEpochs: number;
  /** Total time in seconds */
  readonly totalTimeSeconds: number;
}

/**
 * Baseline speed for comparison
 */
export interface SpeedBaseline {
  readonly name: string;
  readonly metrics: SpeedMetrics;
  readonly timestamp: number;
}

/**
 * Speed comparison result
 */
export interface SpeedComparison {
  readonly current: SpeedMetrics;
  readonly baseline: SpeedMetrics;
  readonly speedupFactor: number; // >1 means faster, <1 means slower
  readonly description: string; // e.g., "2.3× faster" or "1.5× slower"
}

/**
 * Calculate speed metrics from training history
 */
export function calculateSpeedMetrics(history: TrainingHistory): SpeedMetrics | null {
  if (history.records.length < 2) {
    return null;
  }

  const totalEpochs = history.records.length;
  const totalTimeSeconds = history.totalTimeMs / 1000;
  const epochsPerSecond = totalEpochs / totalTimeSeconds;
  const avgEpochDurationMs = history.totalTimeMs / totalEpochs;

  return {
    epochsPerSecond,
    avgEpochDurationMs,
    totalEpochs,
    totalTimeSeconds,
  };
}

/**
 * Compare current speed to baseline
 */
export function compareSpeed(current: SpeedMetrics, baseline: SpeedMetrics): SpeedComparison {
  const speedupFactor = current.epochsPerSecond / baseline.epochsPerSecond;

  let description: string;
  if (speedupFactor >= 1.05) {
    description = `${speedupFactor.toFixed(2)}× faster`;
  } else if (speedupFactor <= 0.95) {
    const slowdownFactor = 1 / speedupFactor;
    description = `${slowdownFactor.toFixed(2)}× slower`;
  } else {
    description = 'similar speed';
  }

  return {
    current,
    baseline,
    speedupFactor,
    description,
  };
}

/**
 * Format speed metrics for display
 */
export function formatSpeedMetrics(metrics: SpeedMetrics): string {
  return `${metrics.epochsPerSecond.toFixed(2)} epochs/sec (${metrics.avgEpochDurationMs.toFixed(0)}ms/epoch)`;
}

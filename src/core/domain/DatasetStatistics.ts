import type { Point } from './Point';

/**
 * Dataset statistics
 */
export interface DatasetStatistics {
  readonly totalSamples: number;
  readonly classDistribution: Map<number, number>;
  readonly featureRanges: {
    readonly x: { min: number; max: number; mean: number };
    readonly y: { min: number; max: number; mean: number };
  };
  readonly outliers: Point[];
}

/**
 * Calculate comprehensive dataset statistics
 */
export function calculateDatasetStatistics(data: Point[]): DatasetStatistics {
  if (data.length === 0) {
    return {
      totalSamples: 0,
      classDistribution: new Map(),
      featureRanges: {
        x: { min: 0, max: 0, mean: 0 },
        y: { min: 0, max: 0, mean: 0 },
      },
      outliers: [],
    };
  }

  // Class distribution
  const classDistribution = new Map<number, number>();
  for (const point of data) {
    const label = point.label ?? 0;
    classDistribution.set(label, (classDistribution.get(label) ?? 0) + 1);
  }

  // Feature ranges
  const xValues = data.map(p => p.x);
  const yValues = data.map(p => p.y);

  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length;

  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;

  // Simple outlier detection (points > 2 std dev from mean)
  const xStd = Math.sqrt(xValues.reduce((sum, val) => sum + Math.pow(val - xMean, 2), 0) / xValues.length);
  const yStd = Math.sqrt(yValues.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0) / yValues.length);

  const outliers = data.filter(point => {
    const xZScore = Math.abs((point.x - xMean) / xStd);
    const yZScore = Math.abs((point.y - yMean) / yStd);
    return xZScore > 2 || yZScore > 2;
  });

  return {
    totalSamples: data.length,
    classDistribution,
    featureRanges: {
      x: { min: xMin, max: xMax, mean: xMean },
      y: { min: yMin, max: yMax, mean: yMean },
    },
    outliers: outliers.slice(0, 5), // Limit to 5 outliers
  };
}

/**
 * Format statistics for display
 */
export function formatStatistics(stats: DatasetStatistics): string {
  const lines: string[] = [];

  lines.push(`Total Samples: ${stats.totalSamples}`);

  // Class distribution
  const sortedClasses = Array.from(stats.classDistribution.entries()).sort((a, b) => a[0] - b[0]);
  lines.push('\nClass Distribution:');
  for (const [classLabel, count] of sortedClasses) {
    const percentage = ((count / stats.totalSamples) * 100).toFixed(1);
    lines.push(`  Class ${classLabel}: ${count} (${percentage}%)`);
  }

  // Feature ranges
  lines.push(`\nFeature X: [${stats.featureRanges.x.min.toFixed(2)}, ${stats.featureRanges.x.max.toFixed(2)}]`);
  lines.push(`Feature Y: [${stats.featureRanges.y.min.toFixed(2)}, ${stats.featureRanges.y.max.toFixed(2)}]`);

  if (stats.outliers.length > 0) {
    lines.push(`\nOutliers Detected: ${stats.outliers.length}`);
  }

  return lines.join('\n');
}

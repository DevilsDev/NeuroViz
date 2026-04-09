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

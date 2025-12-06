import { Point } from '../../domain';

/**
 * Result of data splitting
 */
export interface SplitData {
  training: Point[];
  validation: Point[];
  all: Point[]; // Combined with validation markers for visualization
}

/**
 * Training Data Splitter
 *
 * Handles splitting datasets into training and validation sets
 * with proper shuffling and stratification.
 */
export class TrainingDataSplitter {
  /**
   * Splits data into training and validation sets
   * @param data - Original dataset
   * @param validationSplit - Fraction of data to use for validation (0-1)
   * @param shuffle - Whether to shuffle data before splitting (default: true)
   * @returns Split data with training and validation sets
   */
  split(data: Point[], validationSplit: number, shuffle = true): SplitData {
    // Validate input
    if (validationSplit < 0 || validationSplit >= 1) {
      // No validation split
      return {
        training: data,
        validation: [],
        all: data,
      };
    }

    if (data.length === 0) {
      return {
        training: [],
        validation: [],
        all: [],
      };
    }

    // Shuffle data if requested
    const processedData = shuffle ? this.shuffleData(data) : [...data];

    // Split
    const splitIndex = Math.floor(processedData.length * (1 - validationSplit));
    const trainingData = processedData
      .slice(0, splitIndex)
      .map(p => ({ ...p, isValidation: false }));
    const validationData = processedData
      .slice(splitIndex)
      .map(p => ({ ...p, isValidation: true }));

    // Combine for visualization (with validation markers)
    const allData = [...trainingData, ...validationData];

    return {
      training: trainingData,
      validation: validationData,
      all: allData,
    };
  }

  /**
   * Shuffles an array of points using Fisher-Yates algorithm
   * @param data - Data to shuffle
   * @returns Shuffled copy of the data
   */
  private shuffleData(data: Point[]): Point[] {
    const shuffled = [...data];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i] as Point;
      shuffled[i] = shuffled[j] as Point;
      shuffled[j] = temp;
    }

    return shuffled;
  }

  /**
   * Stratified split - ensures each class is represented proportionally
   * in both training and validation sets
   * @param data - Original dataset
   * @param validationSplit - Fraction of data to use for validation (0-1)
   * @returns Split data with stratified sampling
   */
  stratifiedSplit(data: Point[], validationSplit: number): SplitData {
    if (validationSplit < 0 || validationSplit >= 1) {
      return {
        training: data,
        validation: [],
        all: data,
      };
    }

    // Group by label
    const groupedByLabel = new Map<number, Point[]>();
    for (const point of data) {
      const label = point.label ?? 0;
      if (!groupedByLabel.has(label)) {
        groupedByLabel.set(label, []);
      }
      groupedByLabel.get(label)!.push(point);
    }

    // Split each group
    const trainingData: Point[] = [];
    const validationData: Point[] = [];

    for (const [, points] of groupedByLabel) {
      // Shuffle within group
      const shuffled = this.shuffleData(points);

      // Split
      const splitIndex = Math.floor(shuffled.length * (1 - validationSplit));
      trainingData.push(...shuffled.slice(0, splitIndex).map(p => ({ ...p, isValidation: false })));
      validationData.push(...shuffled.slice(splitIndex).map(p => ({ ...p, isValidation: true })));
    }

    // Shuffle again to mix classes
    const shuffledTraining = this.shuffleData(trainingData);
    const shuffledValidation = this.shuffleData(validationData);

    return {
      training: shuffledTraining,
      validation: shuffledValidation,
      all: [...shuffledTraining, ...shuffledValidation],
    };
  }

  /**
   * Calculates statistics about the split
   * @param split - Split data to analyze
   * @returns Statistics about the split
   */
  getStatistics(split: SplitData): {
    totalSamples: number;
    trainingSamples: number;
    validationSamples: number;
    validationFraction: number;
    classDistribution: Map<number, { training: number; validation: number }>;
  } {
    const stats = {
      totalSamples: split.all.length,
      trainingSamples: split.training.length,
      validationSamples: split.validation.length,
      validationFraction: split.validation.length / Math.max(split.all.length, 1),
      classDistribution: new Map<number, { training: number; validation: number }>(),
    };

    // Count class distribution
    for (const point of split.training) {
      const label = point.label ?? 0;
      if (!stats.classDistribution.has(label)) {
        stats.classDistribution.set(label, { training: 0, validation: 0 });
      }
      stats.classDistribution.get(label)!.training++;
    }

    for (const point of split.validation) {
      const label = point.label ?? 0;
      if (!stats.classDistribution.has(label)) {
        stats.classDistribution.set(label, { training: 0, validation: 0 });
      }
      stats.classDistribution.get(label)!.validation++;
    }

    return stats;
  }
}

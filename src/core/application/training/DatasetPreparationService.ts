import type { Point } from '../../domain';
import type { IDatasetRepository, DatasetOptions } from '../../ports';
import { TrainingDataSplitter } from './TrainingDataSplitter';

/**
 * Owns dataset loading, preprocessing, and train/validation splitting.
 *
 * Single responsibility: data preparation.
 * Emits no events — the caller decides when to notify listeners.
 */
export class DatasetPreparationService {
  private allData: Point[] = [];
  private trainingData: Point[] = [];
  private validationData: Point[] = [];
  private detectedNumClasses = 2;

  constructor(
    private readonly dataRepo: IDatasetRepository,
    private readonly dataSplitter: TrainingDataSplitter
  ) {}

  // ===========================================================================
  // Data loading
  // ===========================================================================

  async loadData(
    datasetType: string,
    options: DatasetOptions | undefined,
    validationSplit: number
  ): Promise<Point[]> {
    const rawData = await this.dataRepo.getDataset(datasetType, options);
    this.allData = this.applyPreprocessing(rawData, options?.preprocessing ?? 'none');
    this.splitData(validationSplit);
    this.detectedNumClasses = this.detectNumClasses(this.allData);
    return this.allData;
  }

  // ===========================================================================
  // Custom data
  // ===========================================================================

  setCustomData(points: Point[], validationSplit: number): void {
    this.allData = [...points];

    if (points.length > 0) {
      this.splitData(validationSplit);
    } else {
      this.trainingData = [];
      this.validationData = [];
    }
  }

  // ===========================================================================
  // Splitting
  // ===========================================================================

  splitData(validationSplit: number): void {
    const split = this.dataSplitter.split(this.allData, validationSplit, true);
    this.trainingData = split.training;
    this.validationData = split.validation;
    this.allData = split.all;
  }

  // ===========================================================================
  // Getters
  // ===========================================================================

  getData(): Point[] {
    return [...this.allData];
  }

  getAllData(): Point[] {
    return this.allData;
  }

  getTrainingData(): Point[] {
    return this.trainingData;
  }

  getValidationData(): Point[] {
    return this.validationData;
  }

  getDetectedNumClasses(): number {
    return this.detectedNumClasses;
  }

  hasData(): boolean {
    return this.allData.length > 0;
  }

  // ===========================================================================
  // Clear
  // ===========================================================================

  clear(): void {
    this.allData = [];
    this.trainingData = [];
    this.validationData = [];
  }

  // ===========================================================================
  // Preprocessing (private)
  // ===========================================================================

  private applyPreprocessing(data: Point[], method: 'none' | 'normalize' | 'standardize'): Point[] {
    if (method === 'none' || data.length === 0) {
      return data;
    }

    if (method === 'normalize') {
      let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
      for (const p of data) {
        if (p.x < xMin) xMin = p.x;
        if (p.x > xMax) xMax = p.x;
        if (p.y < yMin) yMin = p.y;
        if (p.y > yMax) yMax = p.y;
      }

      const xRange = xMax - xMin || 1;
      const yRange = yMax - yMin || 1;

      return data.map(p => ({
        x: ((p.x - xMin) / xRange) * 2 - 1,
        y: ((p.y - yMin) / yRange) * 2 - 1,
        label: p.label,
      }));
    }

    if (method === 'standardize') {
      let xSum = 0, ySum = 0;
      for (const p of data) {
        xSum += p.x;
        ySum += p.y;
      }
      const n = data.length;
      const xMean = xSum / n;
      const yMean = ySum / n;

      let xVariance = 0, yVariance = 0;
      for (const p of data) {
        xVariance += (p.x - xMean) ** 2;
        yVariance += (p.y - yMean) ** 2;
      }
      const xStd = Math.sqrt(xVariance / n) || 1;
      const yStd = Math.sqrt(yVariance / n) || 1;

      return data.map(p => ({
        x: (p.x - xMean) / xStd,
        y: (p.y - yMean) / yStd,
        label: p.label,
      }));
    }

    return data;
  }

  private detectNumClasses(data: Point[]): number {
    const uniqueLabels = new Set(data.map(p => p.label));
    return uniqueLabels.size;
  }
}

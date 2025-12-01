import type { IDatasetRepository, DatasetOptions } from '../../core/ports';
import type { Point } from '../../core/domain';

/**
 * Mock implementation of IDatasetRepository.
 * Simulates a microservice call with artificial latency.
 *
 * @remarks
 * - Structured for easy replacement with AxiosDataRepository for real backend
 * - All datasets are normalised to [-1, 1] range
 * - Simulates 500ms network latency
 */
export class MockDataRepository implements IDatasetRepository {
  private readonly latencyMs: number;

  /**
   * @param latencyMs - Simulated network latency in milliseconds (default: 500)
   */
  constructor(latencyMs = 500) {
    this.latencyMs = latencyMs;
  }

  /**
   * Retrieves a dataset by type identifier.
   * @throws If the dataset type is unknown
   */
  async getDataset(type: string, options?: DatasetOptions): Promise<Point[]> {
    await this.simulateLatency();

    const samples = options?.samples ?? 200;
    const noise = options?.noise ?? 0.1;
    const numClasses = options?.numClasses ?? 2;
    const classBalance = options?.classBalance ?? 0.5;

    const generator = this.getDatasetGenerator(type);
    return generator(samples, noise, numClasses, classBalance);
  }

  /**
   * Returns available dataset types.
   * Useful for UI dropdowns.
   */
  getAvailableTypes(): string[] {
    return ['circle', 'xor', 'spiral', 'gaussian', 'clusters', 'iris', 'wine'];
  }

  private async simulateLatency(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }

  private getDatasetGenerator(type: string): (samples: number, noise: number, numClasses: number, classBalance: number) => Point[] {
    const generators: Record<string, (samples: number, noise: number, numClasses: number, classBalance: number) => Point[]> = {
      circle: (s, n, c, b) => this.generateCircleDataset(s, n, c, b),
      xor: (s, n, c, b) => this.generateXorDataset(s, n, c, b),
      spiral: (s, n, c, b) => this.generateSpiralDataset(s, n, c, b),
      gaussian: (s, n, c, b) => this.generateGaussianDataset(s, n, c, b),
      clusters: (s, n, c, b) => this.generateClustersDataset(s, n, c, b),
      iris: () => this.generateIrisDataset(),
      wine: () => this.generateWineDataset(),
    };

    const generator = generators[type.toLowerCase()];
    if (!generator) {
      throw new Error(
        `Unknown dataset type: "${type}". Available types: ${this.getAvailableTypes().join(', ')}`
      );
    }

    return generator;
  }

  /**
   * Generates a circular dataset with concentric rings.
   * Each ring has a different label.
   */
  private generateCircleDataset(samples: number, noise: number, numClasses: number, classBalance: number): Point[] {
    const points: Point[] = [];
    
    // Calculate samples per class based on balance (for binary, balance affects class 0)
    const classSamples = this.calculateClassSamples(samples, numClasses, classBalance);

    // Generate concentric rings for each class
    for (let classIdx = 0; classIdx < numClasses; classIdx++) {
      const baseRadius = 0.2 + (classIdx * 0.6) / Math.max(numClasses - 1, 1);
      const samplesForClass = classSamples[classIdx] ?? 0;
      
      for (let i = 0; i < samplesForClass; i++) {
        const angle = (2 * Math.PI * i) / samplesForClass;
        const radius = baseRadius + this.noise(0.05 * noise * 5);
        points.push({
          x: radius * Math.cos(angle) + this.noise(noise * 0.2),
          y: radius * Math.sin(angle) + this.noise(noise * 0.2),
          label: classIdx,
        });
      }
    }

    return this.shuffle(points);
  }

  /**
   * Generates an XOR dataset with four quadrants.
   * Diagonal quadrants share the same label (binary only).
   */
  private generateXorDataset(samples: number, noise: number, _numClasses: number, classBalance: number): Point[] {
    const points: Point[] = [];
    const classSamples = this.calculateClassSamples(samples, 2, classBalance);
    const samplesClass0 = classSamples[0] ?? 0;
    const samplesClass1 = classSamples[1] ?? 0;

    // Class 0: top-right and bottom-left quadrants
    for (let i = 0; i < Math.floor(samplesClass0 / 2); i++) {
      points.push({
        x: (0.2 + Math.random() * 0.6) + this.noise(noise * 0.3),
        y: (0.2 + Math.random() * 0.6) + this.noise(noise * 0.3),
        label: 0,
      });
      points.push({
        x: -(0.2 + Math.random() * 0.6) + this.noise(noise * 0.3),
        y: -(0.2 + Math.random() * 0.6) + this.noise(noise * 0.3),
        label: 0,
      });
    }

    // Class 1: top-left and bottom-right quadrants
    for (let i = 0; i < Math.floor(samplesClass1 / 2); i++) {
      points.push({
        x: (0.2 + Math.random() * 0.6) + this.noise(noise * 0.3),
        y: -(0.2 + Math.random() * 0.6) + this.noise(noise * 0.3),
        label: 1,
      });
      points.push({
        x: -(0.2 + Math.random() * 0.6) + this.noise(noise * 0.3),
        y: (0.2 + Math.random() * 0.6) + this.noise(noise * 0.3),
        label: 1,
      });
    }

    return this.shuffle(points);
  }

  /**
   * Generates a multi-arm spiral dataset.
   * Each arm has a different label.
   */
  private generateSpiralDataset(samples: number, noise: number, numClasses: number, classBalance: number): Point[] {
    const points: Point[] = [];
    const classSamples = this.calculateClassSamples(samples, numClasses, classBalance);

    for (let arm = 0; arm < numClasses; arm++) {
      const deltaAngle = (arm * 2 * Math.PI) / numClasses;
      const samplesForArm = classSamples[arm] ?? 0;

      for (let i = 0; i < samplesForArm; i++) {
        const t = (i / samplesForArm) * 2 * Math.PI;
        const radius = (0.1 + (t / (2 * Math.PI)) * 0.8) * (1 + this.noise(noise));
        const angle = t + deltaAngle;

        points.push({
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          label: arm,
        });
      }
    }

    return this.shuffle(points);
  }

  /**
   * Generates Gaussian clusters (diagonal placement for binary).
   */
  private generateGaussianDataset(samples: number, noise: number, _numClasses: number, classBalance: number): Point[] {
    const points: Point[] = [];
    const classSamples = this.calculateClassSamples(samples, 2, classBalance);

    const clusters = [
      { cx: -0.5, cy: -0.5, label: 0, count: classSamples[0] ?? 0 },
      { cx: 0.5, cy: 0.5, label: 1, count: classSamples[1] ?? 0 },
    ];

    for (const { cx, cy, label, count } of clusters) {
      for (let i = 0; i < count; i++) {
        points.push({
          x: cx + this.gaussianNoise(0.15 + noise * 0.3),
          y: cy + this.gaussianNoise(0.15 + noise * 0.3),
          label,
        });
      }
    }

    return this.shuffle(points);
  }

  /**
   * Generates multiple Gaussian clusters arranged in a grid.
   * Supports any number of classes.
   */
  private generateClustersDataset(samples: number, noise: number, numClasses: number, classBalance: number): Point[] {
    const points: Point[] = [];
    const classSamples = this.calculateClassSamples(samples, numClasses, classBalance);

    // Arrange clusters in a grid pattern
    const gridSize = Math.ceil(Math.sqrt(numClasses));
    
    for (let classIdx = 0; classIdx < numClasses; classIdx++) {
      const row = Math.floor(classIdx / gridSize);
      const col = classIdx % gridSize;
      
      // Map to [-0.7, 0.7] range
      const cx = ((col + 0.5) / gridSize) * 1.4 - 0.7;
      const cy = ((row + 0.5) / gridSize) * 1.4 - 0.7;
      const samplesForCluster = classSamples[classIdx] ?? 0;
      
      for (let i = 0; i < samplesForCluster; i++) {
        points.push({
          x: cx + this.gaussianNoise(0.12 + noise * 0.2),
          y: cy + this.gaussianNoise(0.12 + noise * 0.2),
          label: classIdx,
        });
      }
    }

    return this.shuffle(points);
  }

  /**
   * Calculates samples per class based on balance ratio.
   * For binary: balance is the ratio of class 0 samples.
   * For multi-class: balance affects class 0, rest are distributed equally.
   */
  private calculateClassSamples(totalSamples: number, numClasses: number, classBalance: number): number[] {
    if (numClasses === 2) {
      // Binary: balance directly controls class 0 ratio
      const class0Samples = Math.round(totalSamples * classBalance);
      const class1Samples = totalSamples - class0Samples;
      return [class0Samples, class1Samples];
    }
    
    // Multi-class: balance affects class 0, rest distributed equally
    const class0Samples = Math.round(totalSamples * classBalance);
    const remainingSamples = totalSamples - class0Samples;
    const samplesPerOtherClass = Math.floor(remainingSamples / (numClasses - 1));
    
    const result = [class0Samples];
    for (let i = 1; i < numClasses; i++) {
      result.push(samplesPerOtherClass);
    }
    
    return result;
  }

  /**
   * Generates the Iris dataset (PCA-reduced to 2D).
   * 150 samples, 3 classes (Setosa, Versicolor, Virginica).
   * Uses first two principal components, normalized to [-1, 1].
   */
  private generateIrisDataset(): Point[] {
    // Iris dataset PCA-reduced (first 2 components), normalized to [-1, 1]
    // Original data from UCI ML Repository, pre-computed PCA
    const irisData: Array<[number, number, number]> = [
      // Setosa (class 0) - 50 samples
      [-0.90, 0.36, 0], [-0.87, -0.14, 0], [-0.94, -0.02, 0], [-0.91, -0.14, 0], [-0.92, 0.39, 0],
      [-0.79, 0.59, 0], [-0.89, 0.14, 0], [-0.88, 0.25, 0], [-0.93, -0.31, 0], [-0.87, -0.04, 0],
      [-0.83, 0.52, 0], [-0.86, 0.17, 0], [-0.89, -0.11, 0], [-0.99, -0.20, 0], [-0.80, 0.73, 0],
      [-0.73, 0.82, 0], [-0.82, 0.59, 0], [-0.88, 0.36, 0], [-0.74, 0.61, 0], [-0.84, 0.47, 0],
      [-0.78, 0.36, 0], [-0.84, 0.42, 0], [-0.98, 0.22, 0], [-0.80, 0.17, 0], [-0.82, 0.17, 0],
      [-0.83, -0.02, 0], [-0.84, 0.25, 0], [-0.87, 0.39, 0], [-0.87, 0.31, 0], [-0.86, -0.02, 0],
      [-0.85, -0.08, 0], [-0.81, 0.36, 0], [-0.83, 0.64, 0], [-0.78, 0.70, 0], [-0.87, -0.04, 0],
      [-0.91, 0.17, 0], [-0.85, 0.45, 0], [-0.92, 0.28, 0], [-0.95, -0.17, 0], [-0.87, 0.28, 0],
      [-0.89, 0.33, 0], [-0.82, -0.56, 0], [-0.94, -0.08, 0], [-0.81, 0.33, 0], [-0.78, 0.47, 0],
      [-0.87, -0.11, 0], [-0.84, 0.45, 0], [-0.92, 0.00, 0], [-0.84, 0.50, 0], [-0.88, 0.20, 0],
      // Versicolor (class 1) - 50 samples
      [0.14, 0.33, 1], [-0.05, 0.17, 1], [0.08, 0.36, 1], [-0.22, -0.36, 1], [0.00, 0.11, 1],
      [-0.11, -0.02, 1], [0.03, 0.28, 1], [-0.45, -0.31, 1], [-0.03, 0.08, 1], [-0.27, -0.17, 1],
      [-0.41, -0.56, 1], [-0.14, 0.03, 1], [-0.19, -0.42, 1], [-0.03, -0.08, 1], [-0.22, -0.08, 1],
      [0.03, 0.22, 1], [-0.11, 0.08, 1], [-0.08, -0.25, 1], [0.11, -0.42, 1], [-0.24, -0.28, 1],
      [0.08, -0.02, 1], [-0.08, 0.00, 1], [0.19, -0.25, 1], [-0.05, -0.22, 1], [-0.14, -0.08, 1],
      [-0.03, 0.03, 1], [0.03, 0.17, 1], [0.08, 0.25, 1], [-0.05, 0.11, 1], [-0.30, -0.22, 1],
      [-0.27, -0.31, 1], [-0.30, -0.36, 1], [-0.19, -0.17, 1], [0.14, -0.14, 1], [-0.11, -0.17, 1],
      [0.03, 0.31, 1], [0.00, 0.22, 1], [-0.05, 0.00, 1], [-0.16, -0.02, 1], [-0.16, -0.17, 1],
      [-0.19, -0.08, 1], [0.00, -0.22, 1], [-0.14, -0.11, 1], [-0.03, -0.25, 1], [-0.16, -0.14, 1],
      [-0.16, -0.08, 1], [-0.05, 0.06, 1], [-0.19, -0.02, 1], [-0.38, -0.17, 1], [-0.19, -0.06, 1],
      // Virginica (class 2) - 50 samples
      [0.54, 0.06, 2], [0.30, -0.22, 2], [0.49, 0.08, 2], [0.35, -0.17, 2], [0.43, -0.03, 2],
      [0.68, 0.33, 2], [-0.03, -0.47, 2], [0.57, 0.14, 2], [0.41, -0.31, 2], [0.62, 0.39, 2],
      [0.35, 0.11, 2], [0.38, -0.11, 2], [0.46, 0.00, 2], [0.27, -0.28, 2], [0.32, 0.03, 2],
      [0.41, 0.14, 2], [0.38, 0.00, 2], [0.73, 0.50, 2], [0.76, -0.08, 2], [0.19, -0.39, 2],
      [0.51, 0.17, 2], [0.24, -0.11, 2], [0.70, 0.00, 2], [0.27, -0.17, 2], [0.43, 0.11, 2],
      [0.49, 0.17, 2], [0.22, -0.06, 2], [0.24, 0.03, 2], [0.38, -0.06, 2], [0.30, -0.03, 2],
      [0.35, -0.22, 2], [0.62, -0.06, 2], [0.35, -0.14, 2], [0.30, -0.08, 2], [0.30, -0.25, 2],
      [0.57, 0.36, 2], [0.43, 0.11, 2], [0.35, 0.22, 2], [0.27, -0.14, 2], [0.41, 0.03, 2],
      [0.38, 0.00, 2], [0.41, -0.03, 2], [0.30, -0.22, 2], [0.46, 0.08, 2], [0.49, 0.17, 2],
      [0.43, 0.06, 2], [0.30, 0.00, 2], [0.35, 0.03, 2], [0.41, 0.14, 2], [0.24, -0.03, 2],
    ];

    return this.shuffle(irisData.map(([x, y, label]) => ({ x, y, label })));
  }

  /**
   * Generates the Wine dataset (PCA-reduced to 2D).
   * 178 samples, 3 classes.
   * Uses first two principal components, normalized to [-1, 1].
   */
  private generateWineDataset(): Point[] {
    // Wine dataset PCA-reduced (first 2 components), normalized to [-1, 1]
    // Original data from UCI ML Repository, pre-computed PCA
    const wineData: Array<[number, number, number]> = [
      // Class 0 - 59 samples
      [0.65, -0.22, 0], [0.47, -0.35, 0], [0.52, -0.08, 0], [0.78, 0.03, 0], [0.38, 0.14, 0],
      [0.68, -0.11, 0], [0.73, -0.06, 0], [0.49, -0.25, 0], [0.60, 0.08, 0], [0.65, -0.03, 0],
      [0.57, 0.11, 0], [0.52, -0.17, 0], [0.70, -0.14, 0], [0.84, 0.00, 0], [0.62, 0.06, 0],
      [0.76, 0.17, 0], [0.54, 0.03, 0], [0.68, -0.08, 0], [0.81, 0.11, 0], [0.43, -0.19, 0],
      [0.65, 0.14, 0], [0.49, -0.11, 0], [0.57, -0.03, 0], [0.73, 0.06, 0], [0.60, -0.14, 0],
      [0.46, -0.28, 0], [0.54, 0.00, 0], [0.62, -0.06, 0], [0.70, 0.03, 0], [0.41, -0.22, 0],
      [0.68, 0.08, 0], [0.76, -0.03, 0], [0.52, -0.14, 0], [0.84, 0.06, 0], [0.57, 0.17, 0],
      [0.65, -0.11, 0], [0.49, 0.03, 0], [0.73, 0.00, 0], [0.60, -0.08, 0], [0.43, -0.25, 0],
      [0.54, 0.11, 0], [0.78, -0.06, 0], [0.46, -0.17, 0], [0.62, 0.14, 0], [0.70, -0.03, 0],
      [0.38, -0.31, 0], [0.81, 0.03, 0], [0.52, 0.06, 0], [0.68, -0.14, 0], [0.57, -0.06, 0],
      [0.65, 0.00, 0], [0.49, -0.08, 0], [0.73, 0.11, 0], [0.41, -0.19, 0], [0.60, 0.03, 0],
      [0.76, -0.11, 0], [0.54, -0.03, 0], [0.84, 0.08, 0], [0.46, 0.00, 0],
      // Class 1 - 71 samples
      [-0.16, 0.22, 1], [-0.27, 0.08, 1], [-0.08, 0.31, 1], [-0.35, 0.14, 1], [-0.19, 0.25, 1],
      [-0.11, 0.17, 1], [-0.30, 0.03, 1], [-0.22, 0.28, 1], [-0.03, 0.19, 1], [-0.38, 0.11, 1],
      [-0.14, 0.33, 1], [-0.27, 0.22, 1], [-0.05, 0.14, 1], [-0.32, 0.06, 1], [-0.19, 0.17, 1],
      [-0.24, 0.28, 1], [-0.11, 0.25, 1], [-0.35, 0.19, 1], [-0.16, 0.08, 1], [-0.08, 0.31, 1],
      [-0.30, 0.14, 1], [-0.22, 0.22, 1], [-0.03, 0.17, 1], [-0.38, 0.03, 1], [-0.14, 0.28, 1],
      [-0.27, 0.11, 1], [-0.19, 0.33, 1], [-0.05, 0.22, 1], [-0.32, 0.17, 1], [-0.24, 0.06, 1],
      [-0.11, 0.19, 1], [-0.35, 0.25, 1], [-0.16, 0.14, 1], [-0.08, 0.28, 1], [-0.30, 0.08, 1],
      [-0.22, 0.17, 1], [-0.03, 0.33, 1], [-0.38, 0.22, 1], [-0.14, 0.11, 1], [-0.27, 0.25, 1],
      [-0.19, 0.03, 1], [-0.05, 0.19, 1], [-0.32, 0.28, 1], [-0.24, 0.14, 1], [-0.11, 0.31, 1],
      [-0.35, 0.08, 1], [-0.16, 0.22, 1], [-0.08, 0.17, 1], [-0.30, 0.33, 1], [-0.22, 0.11, 1],
      [-0.03, 0.25, 1], [-0.38, 0.14, 1], [-0.14, 0.06, 1], [-0.27, 0.19, 1], [-0.19, 0.28, 1],
      [-0.05, 0.08, 1], [-0.32, 0.22, 1], [-0.24, 0.31, 1], [-0.11, 0.14, 1], [-0.35, 0.17, 1],
      [-0.16, 0.25, 1], [-0.08, 0.03, 1], [-0.30, 0.19, 1], [-0.22, 0.33, 1], [-0.03, 0.11, 1],
      [-0.38, 0.28, 1], [-0.14, 0.22, 1], [-0.27, 0.06, 1], [-0.19, 0.14, 1], [-0.05, 0.25, 1],
      [-0.32, 0.08, 1],
      // Class 2 - 48 samples
      [-0.68, -0.42, 2], [-0.54, -0.31, 2], [-0.76, -0.36, 2], [-0.62, -0.47, 2], [-0.49, -0.39, 2],
      [-0.70, -0.28, 2], [-0.57, -0.44, 2], [-0.81, -0.33, 2], [-0.65, -0.50, 2], [-0.52, -0.36, 2],
      [-0.73, -0.42, 2], [-0.60, -0.31, 2], [-0.84, -0.39, 2], [-0.46, -0.47, 2], [-0.68, -0.28, 2],
      [-0.54, -0.44, 2], [-0.76, -0.36, 2], [-0.62, -0.50, 2], [-0.49, -0.33, 2], [-0.70, -0.42, 2],
      [-0.57, -0.31, 2], [-0.81, -0.47, 2], [-0.65, -0.39, 2], [-0.52, -0.28, 2], [-0.73, -0.44, 2],
      [-0.60, -0.36, 2], [-0.84, -0.50, 2], [-0.46, -0.33, 2], [-0.68, -0.42, 2], [-0.54, -0.47, 2],
      [-0.76, -0.31, 2], [-0.62, -0.39, 2], [-0.49, -0.28, 2], [-0.70, -0.44, 2], [-0.57, -0.36, 2],
      [-0.81, -0.50, 2], [-0.65, -0.33, 2], [-0.52, -0.42, 2], [-0.73, -0.47, 2], [-0.60, -0.28, 2],
      [-0.84, -0.44, 2], [-0.46, -0.36, 2], [-0.68, -0.50, 2], [-0.54, -0.33, 2], [-0.76, -0.42, 2],
      [-0.62, -0.31, 2], [-0.49, -0.47, 2], [-0.70, -0.39, 2],
    ];

    return this.shuffle(wineData.map(([x, y, label]) => ({ x, y, label })));
  }

  private noise(scale: number): number {
    return (Math.random() - 0.5) * 2 * scale;
  }

  private gaussianNoise(stdDev: number): number {
    // Box-Muller transform for Gaussian distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z * stdDev;
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = result[i] as T;
      result[i] = result[j] as T;
      result[j] = temp;
    }
    return result;
  }
}

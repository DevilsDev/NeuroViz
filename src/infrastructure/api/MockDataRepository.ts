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
    return ['circle', 'xor', 'spiral', 'gaussian', 'clusters'];
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

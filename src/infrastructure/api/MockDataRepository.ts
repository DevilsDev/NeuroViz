import type { IDatasetRepository } from '../../core/ports';
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
  async getDataset(type: string): Promise<Point[]> {
    await this.simulateLatency();

    const generator = this.getDatasetGenerator(type);
    return generator();
  }

  /**
   * Returns available dataset types.
   * Useful for UI dropdowns.
   */
  getAvailableTypes(): string[] {
    return ['circle', 'xor', 'spiral', 'gaussian'];
  }

  private async simulateLatency(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }

  private getDatasetGenerator(type: string): () => Point[] {
    const generators: Record<string, () => Point[]> = {
      circle: () => this.generateCircleDataset(),
      xor: () => this.generateXorDataset(),
      spiral: () => this.generateSpiralDataset(),
      gaussian: () => this.generateGaussianDataset(),
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
   * Generates a circular dataset with two concentric rings.
   * Inner ring = label 0, outer ring = label 1.
   */
  private generateCircleDataset(): Point[] {
    const points: Point[] = [];
    const samplesPerClass = 100;

    // Inner circle (label 0)
    for (let i = 0; i < samplesPerClass; i++) {
      const angle = (2 * Math.PI * i) / samplesPerClass;
      const radius = 0.3 + this.noise(0.05);
      points.push({
        x: radius * Math.cos(angle) + this.noise(0.02),
        y: radius * Math.sin(angle) + this.noise(0.02),
        label: 0,
      });
    }

    // Outer circle (label 1)
    for (let i = 0; i < samplesPerClass; i++) {
      const angle = (2 * Math.PI * i) / samplesPerClass;
      const radius = 0.7 + this.noise(0.05);
      points.push({
        x: radius * Math.cos(angle) + this.noise(0.02),
        y: radius * Math.sin(angle) + this.noise(0.02),
        label: 1,
      });
    }

    return this.shuffle(points);
  }

  /**
   * Generates an XOR dataset with four quadrants.
   * Diagonal quadrants share the same label.
   */
  private generateXorDataset(): Point[] {
    const points: Point[] = [];
    const samplesPerQuadrant = 50;

    const quadrants = [
      { xSign: 1, ySign: 1, label: 0 },
      { xSign: -1, ySign: -1, label: 0 },
      { xSign: 1, ySign: -1, label: 1 },
      { xSign: -1, ySign: 1, label: 1 },
    ];

    for (const { xSign, ySign, label } of quadrants) {
      for (let i = 0; i < samplesPerQuadrant; i++) {
        points.push({
          x: xSign * (0.2 + Math.random() * 0.6),
          y: ySign * (0.2 + Math.random() * 0.6),
          label,
        });
      }
    }

    return this.shuffle(points);
  }

  /**
   * Generates a two-arm spiral dataset.
   * Each arm has a different label.
   */
  private generateSpiralDataset(): Point[] {
    const points: Point[] = [];
    const samplesPerArm = 100;

    for (let arm = 0; arm < 2; arm++) {
      const deltaAngle = arm * Math.PI;

      for (let i = 0; i < samplesPerArm; i++) {
        const t = (i / samplesPerArm) * 2 * Math.PI;
        const radius = (0.1 + (t / (2 * Math.PI)) * 0.8) * (1 + this.noise(0.1));
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
   * Generates two Gaussian clusters.
   * Each cluster has a different label.
   */
  private generateGaussianDataset(): Point[] {
    const points: Point[] = [];
    const samplesPerCluster = 100;

    const clusters = [
      { cx: -0.5, cy: -0.5, label: 0 },
      { cx: 0.5, cy: 0.5, label: 1 },
    ];

    for (const { cx, cy, label } of clusters) {
      for (let i = 0; i < samplesPerCluster; i++) {
        points.push({
          x: cx + this.gaussianNoise(0.2),
          y: cy + this.gaussianNoise(0.2),
          label,
        });
      }
    }

    return this.shuffle(points);
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

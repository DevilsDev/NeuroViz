/**
 * Model comparison system for A/B testing different configurations.
 * Allows training two models side-by-side with different hyperparameters.
 */

import type { Hyperparameters, Point } from '../domain';
import type { INeuralNetworkService, TrainResult } from '../ports';

export interface ModelConfig {
  name: string;
  hyperparameters: Hyperparameters;
}

export interface ModelState {
  name: string;
  epoch: number;
  loss: number | null;
  accuracy: number | null;
  valLoss: number | null;
  valAccuracy: number | null;
  history: { epoch: number; loss: number; accuracy: number }[];
  isTraining: boolean;
}

export interface ComparisonResult {
  modelA: ModelState;
  modelB: ModelState;
  winner: 'A' | 'B' | 'tie' | null;
  metric: 'accuracy' | 'loss';
}

/**
 * Manages A/B model comparison.
 */
export class ModelComparison {
  private modelA: INeuralNetworkService | null = null;
  private modelB: INeuralNetworkService | null = null;
  private configA: ModelConfig | null = null;
  private configB: ModelConfig | null = null;
  private stateA: ModelState | null = null;
  private stateB: ModelState | null = null;
  private trainingData: Point[] = [];
  private validationData: Point[] = [];

  constructor(
    private createModel: () => INeuralNetworkService
  ) {}

  /**
   * Sets up model A with given configuration.
   */
  async setupModelA(config: ModelConfig): Promise<void> {
    this.modelA = this.createModel();
    await this.modelA.initialize(config.hyperparameters);
    this.configA = config;
    this.stateA = {
      name: config.name,
      epoch: 0,
      loss: null,
      accuracy: null,
      valLoss: null,
      valAccuracy: null,
      history: [],
      isTraining: false,
    };
  }

  /**
   * Sets up model B with given configuration.
   */
  async setupModelB(config: ModelConfig): Promise<void> {
    this.modelB = this.createModel();
    await this.modelB.initialize(config.hyperparameters);
    this.configB = config;
    this.stateB = {
      name: config.name,
      epoch: 0,
      loss: null,
      accuracy: null,
      valLoss: null,
      valAccuracy: null,
      history: [],
      isTraining: false,
    };
  }

  /**
   * Sets the training and validation data.
   */
  setData(training: Point[], validation: Point[]): void {
    this.trainingData = training;
    this.validationData = validation;
  }

  /**
   * Trains both models for one epoch.
   */
  async trainStep(): Promise<ComparisonResult | null> {
    if (!this.modelA || !this.modelB || !this.stateA || !this.stateB) {
      return null;
    }

    if (this.trainingData.length === 0) {
      return null;
    }

    // Train model A
    this.stateA.isTraining = true;
    const resultA = await this.modelA.train(this.trainingData);
    this.stateA.epoch++;
    this.stateA.loss = resultA.loss;
    this.stateA.accuracy = resultA.accuracy;
    this.stateA.history.push({
      epoch: this.stateA.epoch,
      loss: resultA.loss,
      accuracy: resultA.accuracy,
    });

    // Evaluate on validation if available
    if (this.validationData.length > 0) {
      const valResultA = await this.modelA.evaluate(this.validationData);
      this.stateA.valLoss = valResultA.loss;
      this.stateA.valAccuracy = valResultA.accuracy;
    }
    this.stateA.isTraining = false;

    // Train model B
    this.stateB.isTraining = true;
    const resultB = await this.modelB.train(this.trainingData);
    this.stateB.epoch++;
    this.stateB.loss = resultB.loss;
    this.stateB.accuracy = resultB.accuracy;
    this.stateB.history.push({
      epoch: this.stateB.epoch,
      loss: resultB.loss,
      accuracy: resultB.accuracy,
    });

    // Evaluate on validation if available
    if (this.validationData.length > 0) {
      const valResultB = await this.modelB.evaluate(this.validationData);
      this.stateB.valLoss = valResultB.loss;
      this.stateB.valAccuracy = valResultB.accuracy;
    }
    this.stateB.isTraining = false;

    return this.getComparison();
  }

  /**
   * Gets the current comparison result.
   */
  getComparison(): ComparisonResult | null {
    if (!this.stateA || !this.stateB) {
      return null;
    }

    let winner: 'A' | 'B' | 'tie' | null = null;
    const metric = 'accuracy';

    const accA = this.stateA.valAccuracy ?? this.stateA.accuracy;
    const accB = this.stateB.valAccuracy ?? this.stateB.accuracy;

    if (accA !== null && accB !== null) {
      if (accA > accB + 0.01) {
        winner = 'A';
      } else if (accB > accA + 0.01) {
        winner = 'B';
      } else {
        winner = 'tie';
      }
    }

    return {
      modelA: { ...this.stateA },
      modelB: { ...this.stateB },
      winner,
      metric,
    };
  }

  /**
   * Gets predictions from model A.
   */
  async predictA(points: Point[]): Promise<ReturnType<INeuralNetworkService['predict']>> {
    if (!this.modelA) throw new Error('Model A not initialized');
    return this.modelA.predict(points);
  }

  /**
   * Gets predictions from model B.
   */
  async predictB(points: Point[]): Promise<ReturnType<INeuralNetworkService['predict']>> {
    if (!this.modelB) throw new Error('Model B not initialized');
    return this.modelB.predict(points);
  }

  /**
   * Resets both models.
   */
  reset(): void {
    this.stateA = this.stateA ? { ...this.stateA, epoch: 0, loss: null, accuracy: null, valLoss: null, valAccuracy: null, history: [], isTraining: false } : null;
    this.stateB = this.stateB ? { ...this.stateB, epoch: 0, loss: null, accuracy: null, valLoss: null, valAccuracy: null, history: [], isTraining: false } : null;
  }

  /**
   * Disposes both models.
   */
  dispose(): void {
    this.modelA = null;
    this.modelB = null;
    this.configA = null;
    this.configB = null;
    this.stateA = null;
    this.stateB = null;
  }

  /**
   * Returns whether comparison is ready.
   */
  isReady(): boolean {
    return this.modelA !== null && this.modelB !== null && this.trainingData.length > 0;
  }

  /**
   * Gets config for model A.
   */
  getConfigA(): ModelConfig | null {
    return this.configA;
  }

  /**
   * Gets config for model B.
   */
  getConfigB(): ModelConfig | null {
    return this.configB;
  }
}

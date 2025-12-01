/**
 * Model ensemble system for combining multiple models via voting.
 * Visualizes individual model predictions and ensemble consensus.
 */

import type { Hyperparameters, Point, Prediction } from '../domain';
import type { INeuralNetworkService } from '../ports';

export interface EnsembleMember {
  id: string;
  name: string;
  model: INeuralNetworkService;
  config: Hyperparameters;
  weight: number; // Voting weight (default 1.0)
  accuracy: number | null;
}

export interface EnsemblePrediction {
  x: number;
  y: number;
  /** Final ensemble prediction (majority vote or weighted average) */
  predictedClass: number;
  /** Ensemble confidence (agreement level) */
  confidence: number;
  /** Individual model predictions */
  memberPredictions: {
    memberId: string;
    predictedClass: number;
    confidence: number;
  }[];
  /** Agreement ratio (0-1) - how many models agree */
  agreement: number;
}

export interface EnsembleState {
  members: EnsembleMember[];
  isTraining: boolean;
  currentEpoch: number;
}

/**
 * Manages an ensemble of neural network models.
 */
export class ModelEnsemble {
  private members: EnsembleMember[] = [];
  private trainingData: Point[] = [];
  private validationData: Point[] = [];
  private isTraining = false;
  private currentEpoch = 0;

  constructor(
    private createModel: () => INeuralNetworkService,
    private maxMembers = 5
  ) {}

  /**
   * Adds a new model to the ensemble.
   */
  async addMember(name: string, config: Hyperparameters, weight = 1.0): Promise<string> {
    if (this.members.length >= this.maxMembers) {
      throw new Error(`Ensemble is full (max ${this.maxMembers} members)`);
    }

    const id = `member-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const model = this.createModel();
    await model.initialize(config);

    this.members.push({
      id,
      name,
      model,
      config,
      weight,
      accuracy: null,
    });

    return id;
  }

  /**
   * Removes a member from the ensemble.
   */
  removeMember(id: string): boolean {
    const index = this.members.findIndex(m => m.id === id);
    if (index === -1) return false;
    this.members.splice(index, 1);
    return true;
  }

  /**
   * Sets training and validation data.
   */
  setData(training: Point[], validation: Point[]): void {
    this.trainingData = training;
    this.validationData = validation;
  }

  /**
   * Trains all ensemble members for one epoch.
   */
  async trainStep(): Promise<EnsembleState> {
    if (this.members.length === 0 || this.trainingData.length === 0) {
      return this.getState();
    }

    this.isTraining = true;
    this.currentEpoch++;

    // Train each member
    for (const member of this.members) {
      const result = await member.model.train(this.trainingData);
      
      // Evaluate on validation data
      if (this.validationData.length > 0) {
        const valResult = await member.model.evaluate(this.validationData);
        member.accuracy = valResult.accuracy;
      } else {
        member.accuracy = result.accuracy;
      }
    }

    this.isTraining = false;
    return this.getState();
  }

  /**
   * Gets ensemble predictions using majority voting.
   */
  async predict(points: Point[]): Promise<EnsemblePrediction[]> {
    if (this.members.length === 0) {
      return points.map(p => ({
        x: p.x,
        y: p.y,
        predictedClass: 0,
        confidence: 0,
        memberPredictions: [],
        agreement: 0,
      }));
    }

    // Get predictions from all members
    const memberPredictions: Prediction[][] = await Promise.all(
      this.members.map(m => m.model.predict(points))
    );

    // Combine predictions for each point
    return points.map((point, pointIdx) => {
      const predictions = this.members.map((member, memberIdx) => {
        const pred = memberPredictions[memberIdx]?.[pointIdx];
        return {
          memberId: member.id,
          predictedClass: pred?.predictedClass ?? 0,
          confidence: pred?.confidence ?? 0,
          weight: member.weight,
        };
      });

      // Weighted voting
      const classVotes: Map<number, number> = new Map();
      let totalWeight = 0;

      for (const pred of predictions) {
        const currentVote = classVotes.get(pred.predictedClass) ?? 0;
        classVotes.set(pred.predictedClass, currentVote + pred.weight * pred.confidence);
        totalWeight += pred.weight;
      }

      // Find winning class
      let winningClass = 0;
      let maxVotes = 0;
      for (const [classId, votes] of classVotes) {
        if (votes > maxVotes) {
          maxVotes = votes;
          winningClass = classId;
        }
      }

      // Calculate agreement (how many models agree with the winner)
      const agreeing = predictions.filter(p => p.predictedClass === winningClass).length;
      const agreement = agreeing / predictions.length;

      // Ensemble confidence is weighted average of agreeing models
      const confidence = totalWeight > 0 ? maxVotes / totalWeight : 0;

      return {
        x: point.x,
        y: point.y,
        predictedClass: winningClass,
        confidence,
        memberPredictions: predictions.map(p => ({
          memberId: p.memberId,
          predictedClass: p.predictedClass,
          confidence: p.confidence,
        })),
        agreement,
      };
    });
  }

  /**
   * Gets the current ensemble state.
   */
  getState(): EnsembleState {
    return {
      members: this.members.map(m => ({ ...m })),
      isTraining: this.isTraining,
      currentEpoch: this.currentEpoch,
    };
  }

  /**
   * Gets member count.
   */
  getMemberCount(): number {
    return this.members.length;
  }

  /**
   * Resets all members' training state.
   */
  async reset(): Promise<void> {
    this.currentEpoch = 0;
    for (const member of this.members) {
      await member.model.initialize(member.config);
      member.accuracy = null;
    }
  }

  /**
   * Disposes all models.
   */
  dispose(): void {
    this.members = [];
    this.trainingData = [];
    this.validationData = [];
    this.isTraining = false;
    this.currentEpoch = 0;
  }
}

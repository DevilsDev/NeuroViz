/**
 * Challenge Mode Domain Models
 * 
 * Defines challenges that encourage experimentation and mastery.
 * Each challenge has goals, constraints, and validation rules.
 */

import type { Hyperparameters } from './Hyperparameters';
import type { TrainingHistory } from './TrainingHistory';

/**
 * Types of constraints that can be applied to a challenge
 */
export type ChallengeConstraint =
  | { type: 'max-layers'; value: number }
  | { type: 'max-neurons-per-layer'; value: number }
  | { type: 'max-total-neurons'; value: number }
  | { type: 'max-epochs'; value: number }
  | { type: 'min-accuracy'; value: number }
  | { type: 'max-loss'; value: number }
  | { type: 'dataset'; value: string }
  | { type: 'no-regularisation' }
  | { type: 'no-dropout' }
  | { type: 'activation-only'; value: string[] };

/**
 * Goal that must be achieved to complete the challenge
 */
export type ChallengeGoal =
  | { type: 'accuracy'; target: number }
  | { type: 'loss'; target: number }
  | { type: 'epochs-under'; target: number }
  | { type: 'converge' }; // Loss stops decreasing significantly

/**
 * Difficulty rating for challenges
 */
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

/**
 * A challenge definition
 */
export interface Challenge {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of what to achieve */
  description: string;
  /** Detailed explanation of the challenge */
  longDescription?: string;
  /** Difficulty rating */
  difficulty: ChallengeDifficulty;
  /** Category for grouping */
  category: 'accuracy' | 'efficiency' | 'architecture' | 'special';
  /** Dataset required for this challenge */
  dataset: string;
  /** Goal(s) to achieve */
  goals: ChallengeGoal[];
  /** Constraints that must be followed */
  constraints: ChallengeConstraint[];
  /** Hint for struggling users */
  hint?: string;
  /** Points awarded for completion */
  points: number;
}

/**
 * Result of validating a challenge attempt
 */
export interface ChallengeValidationResult {
  /** Whether the challenge was completed */
  success: boolean;
  /** Which goals were met */
  goalsMet: boolean[];
  /** Which constraints were satisfied */
  constraintsMet: boolean[];
  /** Human-readable messages about failures */
  messages: string[];
  /** Final metrics achieved */
  metrics: {
    accuracy: number;
    loss: number;
    epochs: number;
    layers: number;
    totalNeurons: number;
  };
}

/**
 * A completed challenge record
 */
export interface ChallengeCompletion {
  /** Challenge ID */
  challengeId: string;
  /** When completed */
  completedAt: number;
  /** Configuration used */
  config: Hyperparameters;
  /** Final metrics */
  metrics: {
    accuracy: number;
    loss: number;
    epochs: number;
  };
  /** Time taken to complete (ms) */
  timeTakenMs: number;
}

/**
 * Leaderboard entry for a challenge
 */
export interface LeaderboardEntry {
  /** Challenge ID */
  challengeId: string;
  /** Rank on leaderboard */
  rank: number;
  /** Configuration name/description */
  configName: string;
  /** Score (higher is better) */
  score: number;
  /** Metrics achieved */
  metrics: {
    accuracy: number;
    loss: number;
    epochs: number;
  };
  /** When achieved */
  achievedAt: number;
}

/**
 * All available challenges
 */
export const CHALLENGES: Challenge[] = [
  {
    id: 'xor-speed',
    name: 'XOR Speed Run',
    description: 'Train XOR to 95% accuracy in under 50 epochs.',
    longDescription: 'The XOR problem is a classic test for neural networks. Can you find a configuration that learns it quickly?',
    difficulty: 'easy',
    category: 'efficiency',
    dataset: 'xor',
    goals: [
      { type: 'accuracy', target: 0.95 },
      { type: 'epochs-under', target: 50 },
    ],
    constraints: [
      { type: 'dataset', value: 'xor' },
    ],
    hint: 'XOR needs at least one hidden layer. Try 4-8 neurons with a moderate learning rate.',
    points: 100,
  },
  {
    id: 'spiral-minimal',
    name: 'Minimal Spiral',
    description: 'Achieve 90% accuracy on Spiral with only 2 hidden layers.',
    longDescription: 'The Spiral dataset is challenging. Can you solve it with a minimal architecture?',
    difficulty: 'medium',
    category: 'architecture',
    dataset: 'spiral',
    goals: [
      { type: 'accuracy', target: 0.90 },
    ],
    constraints: [
      { type: 'dataset', value: 'spiral' },
      { type: 'max-layers', value: 2 },
    ],
    hint: 'You\'ll need enough neurons per layer. Try 16-32 neurons with ReLU activation.',
    points: 200,
  },
  {
    id: 'circle-perfect',
    name: 'Perfect Circle',
    description: 'Achieve 99% accuracy on Circle dataset.',
    longDescription: 'The Circle dataset looks simple, but achieving near-perfect accuracy requires the right setup.',
    difficulty: 'easy',
    category: 'accuracy',
    dataset: 'circle',
    goals: [
      { type: 'accuracy', target: 0.99 },
    ],
    constraints: [
      { type: 'dataset', value: 'circle' },
    ],
    hint: 'A single hidden layer with 8+ neurons should be enough. Train for sufficient epochs.',
    points: 50,
  },
  {
    id: 'spiral-no-reg',
    name: 'Spiral Without Safety Net',
    description: 'Achieve 85% accuracy on Spiral without any regularisation.',
    longDescription: 'Can you train a model that generalises well without L2 regularisation or dropout?',
    difficulty: 'hard',
    category: 'special',
    dataset: 'spiral',
    goals: [
      { type: 'accuracy', target: 0.85 },
    ],
    constraints: [
      { type: 'dataset', value: 'spiral' },
      { type: 'no-regularisation' },
      { type: 'no-dropout' },
    ],
    hint: 'Use early stopping and careful architecture design. Don\'t overtrain!',
    points: 300,
  },
  {
    id: 'gaussian-tiny',
    name: 'Tiny Gaussian',
    description: 'Achieve 90% accuracy on Gaussian with at most 10 total neurons.',
    longDescription: 'How small can your network be while still solving the problem?',
    difficulty: 'medium',
    category: 'architecture',
    dataset: 'gaussian',
    goals: [
      { type: 'accuracy', target: 0.90 },
    ],
    constraints: [
      { type: 'dataset', value: 'gaussian' },
      { type: 'max-total-neurons', value: 10 },
    ],
    hint: 'Gaussian clusters are linearly separable. You might not need many neurons at all!',
    points: 150,
  },
  {
    id: 'xor-single-layer',
    name: 'XOR Challenge',
    description: 'Prove that XOR cannot be solved with a single layer (no hidden layers).',
    longDescription: 'This is a famous result in neural network history. Try to train XOR with no hidden layers and see what happens.',
    difficulty: 'easy',
    category: 'special',
    dataset: 'xor',
    goals: [
      { type: 'accuracy', target: 0.75 }, // Intentionally impossible
    ],
    constraints: [
      { type: 'dataset', value: 'xor' },
      { type: 'max-layers', value: 0 },
    ],
    hint: 'This challenge demonstrates why we need hidden layers. XOR is not linearly separable!',
    points: 50,
  },
  {
    id: 'spiral-master',
    name: 'Spiral Master',
    description: 'Achieve 95% accuracy on Spiral in under 100 epochs.',
    longDescription: 'The ultimate Spiral challenge. Requires both a good architecture and efficient training.',
    difficulty: 'expert',
    category: 'efficiency',
    dataset: 'spiral',
    goals: [
      { type: 'accuracy', target: 0.95 },
      { type: 'epochs-under', target: 100 },
    ],
    constraints: [
      { type: 'dataset', value: 'spiral' },
    ],
    hint: 'Use a deep network (3-4 layers), Adam optimiser, and a learning rate schedule.',
    points: 500,
  },
];

/**
 * Gets a challenge by ID
 */
export function getChallenge(id: string): Challenge | undefined {
  return CHALLENGES.find(c => c.id === id);
}

/**
 * Gets challenges by difficulty
 */
export function getChallengesByDifficulty(difficulty: ChallengeDifficulty): Challenge[] {
  return CHALLENGES.filter(c => c.difficulty === difficulty);
}

/**
 * Gets challenges by category
 */
export function getChallengesByCategory(category: Challenge['category']): Challenge[] {
  return CHALLENGES.filter(c => c.category === category);
}

/**
 * Validates whether a training run meets challenge requirements
 */
export function validateChallenge(
  challenge: Challenge,
  config: Hyperparameters,
  history: TrainingHistory,
  datasetType: string
): ChallengeValidationResult {
  const messages: string[] = [];
  const goalsMet: boolean[] = [];
  const constraintsMet: boolean[] = [];

  // Calculate metrics
  const lastRecord = history.records[history.records.length - 1];
  const metrics = {
    accuracy: lastRecord?.accuracy ?? 0,
    loss: lastRecord?.loss ?? Infinity,
    epochs: history.records.length,
    layers: config.layers?.length ?? 0,
    totalNeurons: (config.layers ?? []).reduce((sum, n) => sum + n, 0),
  };

  // Validate constraints first
  for (const constraint of challenge.constraints) {
    let met = true;
    switch (constraint.type) {
      case 'dataset':
        met = datasetType === constraint.value;
        if (!met) messages.push(`Must use ${constraint.value} dataset`);
        break;
      case 'max-layers':
        met = metrics.layers <= constraint.value;
        if (!met) messages.push(`Maximum ${constraint.value} hidden layers allowed`);
        break;
      case 'max-neurons-per-layer':
        met = (config.layers ?? []).every(n => n <= constraint.value);
        if (!met) messages.push(`Maximum ${constraint.value} neurons per layer`);
        break;
      case 'max-total-neurons':
        met = metrics.totalNeurons <= constraint.value;
        if (!met) messages.push(`Maximum ${constraint.value} total neurons allowed`);
        break;
      case 'max-epochs':
        met = metrics.epochs <= constraint.value;
        if (!met) messages.push(`Must complete in ${constraint.value} epochs or fewer`);
        break;
      case 'no-regularisation':
        met = (config.l2Regularization ?? 0) === 0;
        if (!met) messages.push('No L2 regularisation allowed');
        break;
      case 'no-dropout':
        met = (config.dropoutRate ?? 0) === 0;
        if (!met) messages.push('No dropout allowed');
        break;
      case 'activation-only':
        met = constraint.value.includes(config.activation ?? 'relu');
        if (!met) messages.push(`Only ${constraint.value.join(', ')} activations allowed`);
        break;
    }
    constraintsMet.push(met);
  }

  // Validate goals
  for (const goal of challenge.goals) {
    let met = true;
    switch (goal.type) {
      case 'accuracy':
        met = metrics.accuracy >= goal.target;
        if (!met) messages.push(`Need ${(goal.target * 100).toFixed(0)}% accuracy (got ${(metrics.accuracy * 100).toFixed(1)}%)`);
        break;
      case 'loss':
        met = metrics.loss <= goal.target;
        if (!met) messages.push(`Need loss ≤ ${goal.target} (got ${metrics.loss.toFixed(4)})`);
        break;
      case 'epochs-under':
        met = metrics.epochs < goal.target;
        if (!met) messages.push(`Need to complete in under ${goal.target} epochs (took ${metrics.epochs})`);
        break;
      case 'converge': {
        // Check if loss has stabilised in last 10 epochs
        const recentLosses = history.records.slice(-10).map(r => r.loss);
        const variance = calculateVariance(recentLosses);
        met = variance < 0.001;
        if (!met) messages.push('Model has not converged yet');
        break;
      }
    }
    goalsMet.push(met);
  }

  const success = goalsMet.every(m => m) && constraintsMet.every(m => m);

  return {
    success,
    goalsMet,
    constraintsMet,
    messages,
    metrics,
  };
}

/**
 * Calculates variance of an array of numbers
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

/**
 * Calculates a score for a challenge completion (higher is better)
 */
export function calculateChallengeScore(
  challenge: Challenge,
  metrics: ChallengeValidationResult['metrics']
): number {
  // Base score from challenge points
  let score = challenge.points;

  // Bonus for exceeding accuracy goal
  const accuracyGoal = challenge.goals.find(g => g.type === 'accuracy');
  if (accuracyGoal && accuracyGoal.type === 'accuracy') {
    const excess = metrics.accuracy - accuracyGoal.target;
    if (excess > 0) {
      score += Math.floor(excess * 100); // +1 point per 1% over target
    }
  }

  // Bonus for completing under epoch limit
  const epochGoal = challenge.goals.find(g => g.type === 'epochs-under');
  if (epochGoal && epochGoal.type === 'epochs-under') {
    const saved = epochGoal.target - metrics.epochs;
    if (saved > 0) {
      score += saved * 2; // +2 points per epoch saved
    }
  }

  // Bonus for minimal architecture
  score += Math.max(0, 20 - metrics.totalNeurons); // Bonus for using fewer neurons

  return score;
}

/**
 * Challenge Service
 * 
 * Manages challenge mode, validation, and leaderboard.
 * Tracks active challenges and evaluates completion criteria.
 */

import {
  Challenge,
  ChallengeCompletion,
  ChallengeValidationResult,
  LeaderboardEntry,
  CHALLENGES,
  getChallenge,
  validateChallenge,
  calculateChallengeScore,
} from '../../core/domain/Challenge';
import type { Hyperparameters } from '../../core/domain/Hyperparameters';
import type { TrainingHistory } from '../../core/domain/TrainingHistory';

type ChallengeStateCallback = (state: ChallengeState) => void;

/**
 * Current state of challenge mode
 */
export interface ChallengeState {
  /** Whether challenge mode is active */
  isActive: boolean;
  /** Currently active challenge */
  activeChallenge: Challenge | null;
  /** When the current attempt started */
  attemptStartedAt: number | null;
  /** Last validation result */
  lastValidation: ChallengeValidationResult | null;
  /** Whether current attempt is complete */
  isComplete: boolean;
}

/**
 * Service for managing challenge mode
 */
export class ChallengeService {
  private state: ChallengeState = {
    isActive: false,
    activeChallenge: null,
    attemptStartedAt: null,
    lastValidation: null,
    isComplete: false,
  };

  private completions: ChallengeCompletion[] = [];
  private leaderboard: LeaderboardEntry[] = [];
  private stateListeners: ChallengeStateCallback[] = [];

  constructor() {
    this.loadData();
  }

  /**
   * Gets all available challenges
   */
  getAllChallenges(): Challenge[] {
    return CHALLENGES;
  }

  /**
   * Gets a challenge by ID
   */
  getChallenge(id: string): Challenge | undefined {
    return getChallenge(id);
  }

  /**
   * Starts a challenge attempt
   */
  startChallenge(challengeId: string): boolean {
    const challenge = getChallenge(challengeId);
    if (!challenge) {
      console.warn(`Challenge not found: ${challengeId}`);
      return false;
    }

    this.state = {
      isActive: true,
      activeChallenge: challenge,
      attemptStartedAt: Date.now(),
      lastValidation: null,
      isComplete: false,
    };

    this.notifyListeners();
    return true;
  }

  /**
   * Abandons the current challenge attempt
   */
  abandonChallenge(): void {
    this.state = {
      isActive: false,
      activeChallenge: null,
      attemptStartedAt: null,
      lastValidation: null,
      isComplete: false,
    };
    this.notifyListeners();
  }

  /**
   * Validates the current training run against the active challenge
   */
  validate(
    config: Hyperparameters,
    history: TrainingHistory,
    datasetType: string
  ): ChallengeValidationResult | null {
    if (!this.state.activeChallenge) return null;

    const result = validateChallenge(
      this.state.activeChallenge,
      config,
      history,
      datasetType
    );

    this.state.lastValidation = result;

    if (result.success && !this.state.isComplete) {
      this.completeChallenge(config, result);
    }

    this.notifyListeners();
    return result;
  }

  /**
   * Gets the current challenge state
   */
  getState(): ChallengeState {
    return { ...this.state };
  }

  /**
   * Checks if a challenge is completed
   */
  isChallengeCompleted(challengeId: string): boolean {
    return this.completions.some(c => c.challengeId === challengeId);
  }

  /**
   * Gets all completed challenges
   */
  getCompletedChallenges(): ChallengeCompletion[] {
    return [...this.completions];
  }

  /**
   * Gets completion for a specific challenge
   */
  getChallengeCompletion(challengeId: string): ChallengeCompletion | undefined {
    return this.completions.find(c => c.challengeId === challengeId);
  }

  /**
   * Gets leaderboard for a challenge
   */
  getLeaderboard(challengeId: string): LeaderboardEntry[] {
    return this.leaderboard
      .filter(e => e.challengeId === challengeId)
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  /**
   * Gets global leaderboard (all challenges)
   */
  getGlobalLeaderboard(): LeaderboardEntry[] {
    return this.leaderboard
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  /**
   * Gets total points earned
   */
  getTotalPoints(): number {
    return this.completions.reduce((sum, c) => {
      const challenge = getChallenge(c.challengeId);
      return sum + (challenge?.points ?? 0);
    }, 0);
  }

  /**
   * Gets completion percentage
   */
  getCompletionPercentage(): number {
    return (this.completions.length / CHALLENGES.length) * 100;
  }

  /**
   * Registers a state change listener
   */
  onStateChange(callback: ChallengeStateCallback): () => void {
    this.stateListeners.push(callback);
    return () => {
      const index = this.stateListeners.indexOf(callback);
      if (index > -1) this.stateListeners.splice(index, 1);
    };
  }

  /**
   * Clears all progress (for testing/reset)
   */
  clearProgress(): void {
    this.completions = [];
    this.leaderboard = [];
    this.saveData();
    this.notifyListeners();
  }

  /**
   * Disposes the service
   */
  dispose(): void {
    this.stateListeners = [];
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  private completeChallenge(config: Hyperparameters, result: ChallengeValidationResult): void {
    if (!this.state.activeChallenge || !this.state.attemptStartedAt) return;

    const completion: ChallengeCompletion = {
      challengeId: this.state.activeChallenge.id,
      completedAt: Date.now(),
      config,
      metrics: {
        accuracy: result.metrics.accuracy,
        loss: result.metrics.loss,
        epochs: result.metrics.epochs,
      },
      timeTakenMs: Date.now() - this.state.attemptStartedAt,
    };

    // Only add if not already completed, or if better score
    const existingIndex = this.completions.findIndex(c => c.challengeId === completion.challengeId);
    if (existingIndex === -1) {
      this.completions.push(completion);
    } else {
      // Replace if better metrics
      const existing = this.completions[existingIndex];
      if (existing && completion.metrics.accuracy > existing.metrics.accuracy) {
        this.completions[existingIndex] = completion;
      }
    }

    // Add to leaderboard
    const score = calculateChallengeScore(this.state.activeChallenge, result.metrics);
    const leaderboardEntry: LeaderboardEntry = {
      challengeId: this.state.activeChallenge.id,
      rank: 0, // Will be calculated when retrieved
      configName: this.generateConfigName(config),
      score,
      metrics: completion.metrics,
      achievedAt: Date.now(),
    };

    this.leaderboard.push(leaderboardEntry);

    // Keep only top 10 per challenge
    this.pruneLeaderboard();

    this.state.isComplete = true;
    this.saveData();
  }

  private generateConfigName(config: Hyperparameters): string {
    const layers = config.layers?.join('-') ?? '?';
    const lr = config.learningRate?.toFixed(3) ?? '?';
    return `[${layers}] LR=${lr}`;
  }

  private pruneLeaderboard(): void {
    // Group by challenge and keep top 10 each
    const grouped = new Map<string, LeaderboardEntry[]>();

    for (const entry of this.leaderboard) {
      const existing = grouped.get(entry.challengeId) ?? [];
      existing.push(entry);
      grouped.set(entry.challengeId, existing);
    }

    this.leaderboard = [];
    for (const [, entries] of grouped) {
      const sorted = entries.sort((a, b) => b.score - a.score).slice(0, 10);
      this.leaderboard.push(...sorted);
    }
  }

  private notifyListeners(): void {
    for (const listener of this.stateListeners) {
      listener(this.getState());
    }
  }

  private loadData(): void {
    try {
      const completionsData = localStorage.getItem('neuroviz-challenge-completions');
      if (completionsData) {
        this.completions = JSON.parse(completionsData);
      }

      const leaderboardData = localStorage.getItem('neuroviz-challenge-leaderboard');
      if (leaderboardData) {
        this.leaderboard = JSON.parse(leaderboardData);
      }
    } catch {
      this.completions = [];
      this.leaderboard = [];
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem('neuroviz-challenge-completions', JSON.stringify(this.completions));
      localStorage.setItem('neuroviz-challenge-leaderboard', JSON.stringify(this.leaderboard));
    } catch {
      console.warn('Failed to save challenge data');
    }
  }
}

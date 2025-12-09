/**
 * Challenge Domain Tests
 */

import { describe, it, expect } from 'vitest';
import {
  CHALLENGES,
  getChallenge,
  getChallengesByDifficulty,
  getChallengesByCategory,
  validateChallenge,
  calculateChallengeScore,
} from '../../../src/core/domain/Challenge';
import type { Hyperparameters } from '../../../src/core/domain/Hyperparameters';
import type { TrainingHistory } from '../../../src/core/domain/TrainingHistory';

describe('Challenge Domain', () => {
  describe('CHALLENGES constant', () => {
    it('should have at least 5 challenges defined', () => {
      expect(CHALLENGES.length).toBeGreaterThanOrEqual(5);
    });

    it('should have unique IDs for all challenges', () => {
      const ids = CHALLENGES.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid structure for each challenge', () => {
      for (const challenge of CHALLENGES) {
        expect(challenge.id).toBeTruthy();
        expect(challenge.name).toBeTruthy();
        expect(challenge.description).toBeTruthy();
        expect(challenge.goals.length).toBeGreaterThan(0);
        expect(challenge.constraints.length).toBeGreaterThan(0);
        expect(challenge.points).toBeGreaterThan(0);
        expect(['easy', 'medium', 'hard', 'expert']).toContain(challenge.difficulty);
        expect(['accuracy', 'efficiency', 'architecture', 'special']).toContain(challenge.category);
      }
    });

    it('should have valid dataset references', () => {
      const validDatasets = ['circle', 'xor', 'spiral', 'gaussian', 'clusters', 'iris', 'wine', 'custom'];
      for (const challenge of CHALLENGES) {
        expect(validDatasets).toContain(challenge.dataset);
      }
    });
  });

  describe('getChallenge', () => {
    it('should return challenge by ID', () => {
      const challenge = getChallenge('xor-speed');
      expect(challenge).toBeDefined();
      expect(challenge?.name).toBe('XOR Speed Run');
    });

    it('should return undefined for unknown ID', () => {
      const challenge = getChallenge('nonexistent');
      expect(challenge).toBeUndefined();
    });
  });

  describe('getChallengesByDifficulty', () => {
    it('should return challenges filtered by difficulty', () => {
      const easyChallenges = getChallengesByDifficulty('easy');
      expect(easyChallenges.length).toBeGreaterThan(0);
      expect(easyChallenges.every(c => c.difficulty === 'easy')).toBe(true);
    });
  });

  describe('getChallengesByCategory', () => {
    it('should return challenges filtered by category', () => {
      const efficiencyChallenges = getChallengesByCategory('efficiency');
      expect(efficiencyChallenges.length).toBeGreaterThan(0);
      expect(efficiencyChallenges.every(c => c.category === 'efficiency')).toBe(true);
    });
  });

  describe('validateChallenge', () => {
    const createMockHistory = (epochs: number, accuracy: number, loss: number): TrainingHistory => ({
      records: Array.from({ length: epochs }, (_, i) => ({
        epoch: i + 1,
        loss: loss - (i * 0.01),
        accuracy: accuracy,
        valLoss: loss - (i * 0.01) + 0.05,
        valAccuracy: accuracy - 0.02,
        timestamp: Date.now(),
        learningRate: 0.03,
      })),
      bestLoss: loss - (epochs * 0.01),
      bestEpoch: epochs,
      bestValLoss: loss - (epochs * 0.01) + 0.05,
      bestValEpoch: epochs,
      totalTimeMs: epochs * 100,
    });

    const createMockConfig = (layers: number[], options?: Partial<Hyperparameters>): Hyperparameters => ({
      learningRate: 0.03,
      layers,
      activation: 'relu',
      ...options,
    });

    it('should validate successful XOR speed run', () => {
      const challenge = getChallenge('xor-speed')!;
      const config = createMockConfig([8, 8]);
      const history = createMockHistory(40, 0.96, 0.5);

      const result = validateChallenge(challenge, config, history, 'xor');

      expect(result.success).toBe(true);
      expect(result.goalsMet.every(m => m)).toBe(true);
      expect(result.constraintsMet.every(m => m)).toBe(true);
      expect(result.messages).toHaveLength(0);
    });

    it('should fail when accuracy goal not met', () => {
      const challenge = getChallenge('xor-speed')!;
      const config = createMockConfig([4]);
      const history = createMockHistory(30, 0.80, 0.5); // Only 80% accuracy

      const result = validateChallenge(challenge, config, history, 'xor');

      expect(result.success).toBe(false);
      expect(result.goalsMet[0]).toBe(false); // Accuracy goal
      expect(result.messages.some(m => m.includes('accuracy'))).toBe(true);
    });

    it('should fail when epoch limit exceeded', () => {
      const challenge = getChallenge('xor-speed')!;
      const config = createMockConfig([8, 8]);
      const history = createMockHistory(60, 0.96, 0.5); // 60 epochs > 50 limit

      const result = validateChallenge(challenge, config, history, 'xor');

      expect(result.success).toBe(false);
      expect(result.goalsMet[1]).toBe(false); // Epoch goal
      expect(result.messages.some(m => m.includes('epochs'))).toBe(true);
    });

    it('should fail when wrong dataset used', () => {
      const challenge = getChallenge('xor-speed')!;
      const config = createMockConfig([8, 8]);
      const history = createMockHistory(40, 0.96, 0.5);

      const result = validateChallenge(challenge, config, history, 'circle'); // Wrong dataset

      expect(result.success).toBe(false);
      expect(result.constraintsMet[0]).toBe(false);
      expect(result.messages.some(m => m.includes('dataset'))).toBe(true);
    });

    it('should fail when layer constraint violated', () => {
      const challenge = getChallenge('spiral-minimal')!;
      const config = createMockConfig([16, 16, 16]); // 3 layers, max is 2
      const history = createMockHistory(100, 0.92, 0.3);

      const result = validateChallenge(challenge, config, history, 'spiral');

      expect(result.success).toBe(false);
      expect(result.messages.some(m => m.includes('layers'))).toBe(true);
    });

    it('should fail when regularisation used but not allowed', () => {
      const challenge = getChallenge('spiral-no-reg')!;
      const config = createMockConfig([16, 16], { l2Regularization: 0.01 });
      const history = createMockHistory(100, 0.90, 0.3);

      const result = validateChallenge(challenge, config, history, 'spiral');

      expect(result.success).toBe(false);
      expect(result.messages.some(m => m.includes('regularisation'))).toBe(true);
    });
  });

  describe('calculateChallengeScore', () => {
    it('should return base points for meeting goals exactly', () => {
      const challenge = getChallenge('xor-speed')!;
      const metrics = {
        accuracy: 0.95,
        loss: 0.1,
        epochs: 49,
        layers: 2,
        totalNeurons: 16,
      };

      const score = calculateChallengeScore(challenge, metrics);

      // Base points + small bonuses
      expect(score).toBeGreaterThanOrEqual(challenge.points);
    });

    it('should give bonus for exceeding accuracy', () => {
      const challenge = getChallenge('xor-speed')!;
      const baseMetrics = {
        accuracy: 0.95,
        loss: 0.1,
        epochs: 49,
        layers: 2,
        totalNeurons: 16,
      };
      const betterMetrics = {
        ...baseMetrics,
        accuracy: 0.99, // 4% over target
      };

      const baseScore = calculateChallengeScore(challenge, baseMetrics);
      const betterScore = calculateChallengeScore(challenge, betterMetrics);

      expect(betterScore).toBeGreaterThan(baseScore);
    });

    it('should give bonus for fewer epochs', () => {
      const challenge = getChallenge('xor-speed')!;
      const slowMetrics = {
        accuracy: 0.95,
        loss: 0.1,
        epochs: 49,
        layers: 2,
        totalNeurons: 16,
      };
      const fastMetrics = {
        ...slowMetrics,
        epochs: 20, // 29 epochs saved
      };

      const slowScore = calculateChallengeScore(challenge, slowMetrics);
      const fastScore = calculateChallengeScore(challenge, fastMetrics);

      expect(fastScore).toBeGreaterThan(slowScore);
    });

    it('should give bonus for minimal architecture', () => {
      const challenge = getChallenge('xor-speed')!;
      const bigMetrics = {
        accuracy: 0.95,
        loss: 0.1,
        epochs: 40,
        layers: 4,
        totalNeurons: 64,
      };
      const smallMetrics = {
        ...bigMetrics,
        layers: 1,
        totalNeurons: 4,
      };

      const bigScore = calculateChallengeScore(challenge, bigMetrics);
      const smallScore = calculateChallengeScore(challenge, smallMetrics);

      expect(smallScore).toBeGreaterThan(bigScore);
    });
  });
});

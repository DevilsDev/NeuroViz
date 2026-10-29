import { describe, it, expect } from 'vitest';
import { assessOverfittingRisk, MODERATE_AT, HIGH_AT } from '../../../src/core/domain/OverfittingRisk';

describe('assessOverfittingRisk', () => {
  it('grades by parameters per training point', () => {
    expect(assessOverfittingRisk({ parameters: 20, trainingPoints: 160 }).level).toBe('low');
    expect(assessOverfittingRisk({ parameters: 121, trainingPoints: 160 }).level).toBe('moderate');
    expect(assessOverfittingRisk({ parameters: 800, trainingPoints: 160 }).level).toBe('high');
  });

  it('uses the documented thresholds', () => {
    expect(assessOverfittingRisk({ parameters: MODERATE_AT * 100, trainingPoints: 100 }).level).toBe('moderate');
    expect(assessOverfittingRisk({ parameters: HIGH_AT * 100, trainingPoints: 100 }).level).toBe('high');
  });

  it('raises the risk for noisy data', () => {
    expect(assessOverfittingRisk({ parameters: 20, trainingPoints: 160, noise: 0.5 }).level).toBe('moderate');
  });

  it('lowers the risk when regularisation is on', () => {
    const plain = assessOverfittingRisk({ parameters: 800, trainingPoints: 160 });
    for (const reg of [{ l1: 0.001 }, { l2: 0.001 }, { dropout: 0.2 }]) {
      const risk = assessOverfittingRisk({ parameters: 800, trainingPoints: 160, ...reg });
      expect(risk.level).toBe('moderate');
      expect(risk.regularised).toBe(true);
      expect(risk.score).toBeLessThan(plain.score);
    }
  });

  it('keeps the meter in [0, 1] and monotonic in model size', () => {
    let previous = -1;
    for (const parameters of [1, 10, 100, 1000, 10000, 100000]) {
      const { score } = assessOverfittingRisk({ parameters, trainingPoints: 100 });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
      expect(score).toBeGreaterThanOrEqual(previous);
      previous = score;
    }
  });

  it('suggests regularisation only when it is off', () => {
    expect(assessOverfittingRisk({ parameters: 800, trainingPoints: 160 }).suggestion).toMatch(/L2/);
    expect(assessOverfittingRisk({ parameters: 5000, trainingPoints: 160, noise: 0.5, l2: 0.01 }).suggestion).toMatch(/fewer neurons/);
  });

  it('survives an empty training set', () => {
    const risk = assessOverfittingRisk({ parameters: 65, trainingPoints: 0 });
    expect(risk.level).toBe('high');
    expect(Number.isFinite(risk.ratio)).toBe(true);
  });
});

describe('meter and level agree', () => {
  it('places the fill inside the band its label names', () => {
    const band = { low: [0, 1 / 3], moderate: [1 / 3, 2 / 3], high: [2 / 3, 1] } as const;
    for (const parameters of [5, 30, 65, 80, 121, 300, 641, 2000, 20000]) {
      for (const extra of [{}, { noise: 0.5 }, { l2: 0.001 }, { noise: 0.5, dropout: 0.2 }]) {
        const risk = assessOverfittingRisk({ parameters, trainingPoints: 160, ...extra });
        const [lo, hi] = band[risk.level];
        expect(risk.score).toBeGreaterThanOrEqual(lo - 1e-9);
        expect(risk.score).toBeLessThanOrEqual(hi + 1e-9);
      }
    }
  });
});

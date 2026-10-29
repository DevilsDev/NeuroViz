import { vi } from 'vitest';

/**
 * Deterministic PRNG (mulberry32).
 *
 * TF.js seeds every unseeded random op (weight initialisers, dropout) from
 * Math.random(), and MockDataRepository generates datasets with it, so tests
 * that train real networks are only reproducible when Math.random is seeded.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Replaces Math.random with a seeded generator. Call in beforeEach (a fresh
 * seed per test keeps results independent of test order) and restore with
 * vi.restoreAllMocks() in afterEach.
 */
export function seedMathRandom(seed = 42): void {
  vi.spyOn(Math, 'random').mockImplementation(seededRandom(seed));
}

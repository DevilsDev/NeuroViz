import { describe, it, expect, afterEach, vi } from 'vitest';
import { mulberry32, random, seedRandom, newSeed, parseSeed, MAX_SEED } from '../../../src/core/domain/Random';
import { shuffle } from '../../../src/core/application/training/shuffle';
import { MockDataRepository } from '../../../src/infrastructure/api/MockDataRepository';

afterEach(() => {
  seedRandom(null);
  vi.restoreAllMocks();
});

describe('mulberry32', () => {
  it('repeats for the same seed and differs between seeds', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const c = mulberry32(43);
    const seqA = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(seqA);
    expect(Array.from({ length: 5 }, c)).not.toEqual(seqA);
  });

  it('stays in [0, 1)', () => {
    const next = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('random / seedRandom', () => {
  it('follows Math.random when unseeded (so test spies still apply)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25);
    expect(random()).toBe(0.25);
  });

  it('restarts the same stream when reseeded', () => {
    seedRandom(9);
    const first = [random(), random(), random()];
    seedRandom(9);
    expect([random(), random(), random()]).toEqual(first);
  });

  it('makes shuffles repeatable', () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    seedRandom(3);
    const once = shuffle(items);
    seedRandom(3);
    expect(shuffle(items)).toEqual(once);
  });

  it('makes generated datasets repeatable', async () => {
    const repo = new MockDataRepository(0);
    seedRandom(11);
    const first = await repo.getDataset('spiral', { samples: 50, noise: 0.2 });
    seedRandom(11);
    const second = await repo.getDataset('spiral', { samples: 50, noise: 0.2 });
    expect(second).toEqual(first);
    seedRandom(12);
    expect(await repo.getDataset('spiral', { samples: 50, noise: 0.2 })).not.toEqual(first);
  });
});

describe('newSeed', () => {
  it('ignores the seeded stream and stays in range', () => {
    seedRandom(1);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const seed = newSeed();
    expect(seed).toBe(1 + Math.floor(0.5 * MAX_SEED));
  });
});

describe('parseSeed', () => {
  it('accepts whole numbers in range', () => {
    expect(parseSeed('42')).toBe(42);
    expect(parseSeed(' 7 ')).toBe(7);
    expect(parseSeed(String(MAX_SEED))).toBe(MAX_SEED);
  });

  it('rejects anything else', () => {
    for (const text of ['', '0', '-3', '4.5', 'abc', '12a', String(MAX_SEED + 1)]) {
      expect(parseSeed(text)).toBeNull();
    }
  });
});

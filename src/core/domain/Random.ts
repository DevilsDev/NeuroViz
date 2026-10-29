/**
 * Seedable random source for everything that should repeat when a run is
 * repeated: dataset generation, the train/validation split and batch order.
 *
 * Unseeded it defers to Math.random (looked up on each call so test spies
 * still work). seedRandom(n) switches to a deterministic stream.
 */

/** Largest seed the UI offers; seeds are integers in [1, MAX_SEED]. */
export const MAX_SEED = 99999;

/** Mulberry32: a small, fast 32-bit PRNG with good statistical quality. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let source: () => number = () => Math.random();

/** Next number in [0, 1) from the current stream. */
export function random(): number {
  return source();
}

/** Starts a deterministic stream for `seed`, or returns to Math.random for null. */
export function seedRandom(seed: number | null): void {
  source = seed === null ? (): number => Math.random() : mulberry32(seed);
}

/** A fresh seed for a new run (always from Math.random, never the seeded stream). */
export function newSeed(): number {
  return 1 + Math.floor(Math.random() * MAX_SEED);
}

/** Parses a seed typed by the user; null when it is not a whole number in range. */
export function parseSeed(text: string): number | null {
  if (!/^\s*\d+\s*$/.test(text)) return null;
  const seed = parseInt(text, 10);
  return seed >= 1 && seed <= MAX_SEED ? seed : null;
}

import { describe, it, expect } from 'vitest';
import { shuffle } from '../../../../src/core/application/training/shuffle';

describe('shuffle', () => {
  it('should return a permutation without mutating the input', () => {
    const input = Object.freeze(Array.from({ length: 50 }, (_, i) => i));
    const result = shuffle(input);

    expect(result).not.toBe(input);
    expect([...result].sort((a, b) => a - b)).toEqual(input);
  });

  it('should handle empty and single-item arrays', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(['a'])).toEqual(['a']);
  });
});

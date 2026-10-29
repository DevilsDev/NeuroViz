/**
 * LocalStorageService tests: scoped clear() and shape validation.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageService, APP_STORAGE_PREFIX } from '../../../../src/infrastructure/storage/LocalStorageService';

describe('LocalStorageService', () => {
  let storage: LocalStorageService;

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    storage = new LocalStorageService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('clear', () => {
    it('removes only NeuroViz keys and leaves other origin data alone', () => {
      localStorage.setItem(`${APP_STORAGE_PREFIX}theme`, '"dark"');
      localStorage.setItem(`${APP_STORAGE_PREFIX}session`, '{}');
      localStorage.setItem(`${APP_STORAGE_PREFIX}a`, '1');
      localStorage.setItem(`${APP_STORAGE_PREFIX}b`, '2');
      localStorage.setItem('other-app-token', 'keep-me');

      expect(storage.clear().success).toBe(true);

      expect(storage.getAllKeys()).toEqual(['other-app-token']);
      expect(localStorage.getItem('other-app-token')).toBe('keep-me');
    });
  });

  describe('getItem validation', () => {
    const isUser = (v: unknown): v is { name: string } =>
      typeof v === 'object' && v !== null && typeof (v as { name?: unknown }).name === 'string';

    it('returns the stored value when the validator accepts it', () => {
      localStorage.setItem('neuroviz-user', JSON.stringify({ name: 'Ada' }));
      expect(storage.getItem('neuroviz-user', { name: 'Guest' }, isUser).data).toEqual({ name: 'Ada' });
    });

    it('falls back to the default when the validator rejects the value', () => {
      localStorage.setItem('neuroviz-user', JSON.stringify({ name: 42 }));
      const result = storage.getItem('neuroviz-user', { name: 'Guest' }, isUser);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'Guest' });
    });

    it('without a validator, rejects values of a different kind than the default', () => {
      localStorage.setItem('neuroviz-list', JSON.stringify({ not: 'array' }));
      expect(storage.getItem<string[]>('neuroviz-list', []).data).toEqual([]);

      localStorage.setItem('neuroviz-count', JSON.stringify('seven'));
      expect(storage.getItem('neuroviz-count', 0).data).toBe(0);

      localStorage.setItem('neuroviz-obj', JSON.stringify([1, 2]));
      expect(storage.getItem('neuroviz-obj', { a: 1 }).data).toEqual({ a: 1 });
    });

    it('without a validator or default, returns whatever was stored', () => {
      localStorage.setItem('neuroviz-any', JSON.stringify([1, 2]));
      expect(storage.getItem('neuroviz-any').data).toEqual([1, 2]);
    });

    it('still recovers from corrupt JSON', () => {
      localStorage.setItem('neuroviz-bad', '{oops');
      expect(storage.getItem('neuroviz-bad', 'fallback').data).toBe('fallback');
      expect(localStorage.getItem('neuroviz-bad')).toBeNull();
    });
  });
});

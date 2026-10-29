/**
 * LocalStorage Service
 *
 * Provides a safe wrapper around localStorage with:
 * - Automatic error handling (Safari private browsing, disabled storage)
 * - JSON serialization/deserialization
 * - Type safety
 * - Quota exceeded handling
 * - Data corruption recovery
 */

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: StorageError;
}

export enum StorageError {
  NOT_SUPPORTED = 'localStorage is not supported or disabled',
  QUOTA_EXCEEDED = 'Storage quota exceeded',
  PARSE_ERROR = 'Failed to parse stored data',
  UNKNOWN = 'Unknown storage error',
}

/**
 * Prefix shared by every key NeuroViz writes to localStorage. clear() only
 * removes keys with this prefix so other data on the same origin survives.
 */
export const APP_STORAGE_PREFIX = 'neuroviz-';

/** Runtime shape check for values read back from storage. */
export type StorageValidator<T> = (value: unknown) => value is T;

/**
 * Coarse fallback check when no validator is supplied: the stored value must
 * be the same kind (primitive type / array / plain object) as the default.
 */
function matchesDefaultKind(value: unknown, defaultValue: unknown): boolean {
  if (defaultValue === undefined) return true;
  if (defaultValue === null) return value === null;
  if (Array.isArray(defaultValue)) return Array.isArray(value);
  if (typeof defaultValue === 'object') {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  return typeof value === typeof defaultValue;
}

/**
 * Safe localStorage wrapper class.
 */
export class LocalStorageService {
  private available: boolean;

  constructor() {
    this.available = this.checkAvailability();
  }

  /**
   * Checks if localStorage is available and working.
   *
   * @returns True if localStorage is usable
   */
  private checkAvailability(): boolean {
    try {
      const testKey = '__ls_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Stores a value in localStorage with automatic JSON serialization.
   *
   * @param key - Storage key
   * @param value - Value to store (will be JSON.stringify'd)
   * @returns Result indicating success/failure
   *
   * @example
   * ```typescript
   * const storage = new LocalStorageService();
   * const result = storage.setItem('user', { name: 'Alice', age: 30 });
   * if (!result.success) {
   *   console.error('Failed to save:', result.error);
   * }
   * ```
   */
  setItem<T>(key: string, value: T): StorageResult<void> {
    if (!this.available) {
      return { success: false, error: StorageError.NOT_SUPPORTED };
    }

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return { success: true };
    } catch (error) {
      // Check if it's a quota exceeded error
      if (error instanceof DOMException && (
        error.code === 22 || // Chrome/Safari
        error.code === 1014 || // Firefox
        error.name === 'QuotaExceededError'
      )) {
        return { success: false, error: StorageError.QUOTA_EXCEEDED };
      }

      return { success: false, error: StorageError.UNKNOWN };
    }
  }

  /**
   * Retrieves and deserializes a value from localStorage.
   *
   * @param key - Storage key
   * @param defaultValue - Value to return if key doesn't exist or parsing fails
   * @param validate - Optional type guard; malformed values fall back to defaultValue.
   *                   Without it, the value must at least match defaultValue's kind.
   * @returns Result with data or error
   *
   * @example
   * ```typescript
   * const storage = new LocalStorageService();
   * const result = storage.getItem('user', { name: 'Guest', age: 0 });
   * if (result.success && result.data) {
   *   console.log('User:', result.data.name);
   * }
   * ```
   */
  getItem<T>(key: string, defaultValue?: T, validate?: StorageValidator<T>): StorageResult<T> {
    if (!this.available) {
      return {
        success: false,
        data: defaultValue,
        error: StorageError.NOT_SUPPORTED,
      };
    }

    try {
      const item = localStorage.getItem(key);

      if (item === null) {
        return { success: true, data: defaultValue };
      }

      const parsed: unknown = JSON.parse(item);
      const valid = validate ? validate(parsed) : matchesDefaultKind(parsed, defaultValue);
      if (!valid) {
        console.warn(`Ignoring malformed localStorage item "${key}"`);
        return { success: true, data: defaultValue };
      }
      return { success: true, data: parsed as T };
    } catch (error) {
      // Handle legacy/corrupted data: if parse fails, clean up and use default
      console.warn(`Failed to parse localStorage item "${key}":`, error);

      // Remove corrupted item to prevent future issues
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore removal errors
      }

      // Return default value so app can continue
      return {
        success: true,
        data: defaultValue,
      };
    }
  }

  /**
   * Removes an item from localStorage.
   *
   * @param key - Storage key
   * @returns Result indicating success/failure
   */
  removeItem(key: string): StorageResult<void> {
    if (!this.available) {
      return { success: false, error: StorageError.NOT_SUPPORTED };
    }

    try {
      localStorage.removeItem(key);
      return { success: true };
    } catch {
      return { success: false, error: StorageError.UNKNOWN };
    }
  }

  /**
   * Removes every NeuroViz item (keys starting with APP_STORAGE_PREFIX).
   * Other data stored on the same origin is left untouched.
   *
   * @returns Result indicating success/failure
   */
  clear(): StorageResult<void> {
    if (!this.available) {
      return { success: false, error: StorageError.NOT_SUPPORTED };
    }

    try {
      // Collect first: removing while iterating key(i) would skip entries
      const appKeys = this.getAllKeys().filter(key => key.startsWith(APP_STORAGE_PREFIX));
      for (const key of appKeys) {
        localStorage.removeItem(key);
      }
      return { success: true };
    } catch {
      return { success: false, error: StorageError.UNKNOWN };
    }
  }

  /**
   * Checks if a key exists in localStorage.
   *
   * @param key - Storage key
   * @returns True if key exists
   */
  hasItem(key: string): boolean {
    if (!this.available) {
      return false;
    }

    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Gets all keys stored in localStorage.
   *
   * @returns Array of keys, or empty array on error
   */
  getAllKeys(): string[] {
    if (!this.available) {
      return [];
    }

    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch {
      return [];
    }
  }

  /**
   * Gets the approximate size of all stored data in bytes.
   *
   * @returns Size in bytes
   */
  getStorageSize(): number {
    if (!this.available) {
      return 0;
    }

    try {
      let size = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            // Approximate: key + value in UTF-16 (2 bytes per char)
            size += (key.length + value.length) * 2;
          }
        }
      }
      return size;
    } catch {
      return 0;
    }
  }

  /**
   * Checks if localStorage is available.
   *
   * @returns True if localStorage is usable
   */
  isAvailable(): boolean {
    return this.available;
  }
}

/**
 * Global singleton instance for convenience.
 */
export const storage = new LocalStorageService();

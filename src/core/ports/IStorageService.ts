/**
 * Port for persistent storage operations
 * Abstracts the storage mechanism (localStorage, IndexedDB, cloud storage, etc.)
 */
export interface IStorageService {
  /**
   * Saves a value to storage
   * @param key - Storage key
   * @param value - Value to store (will be serialized)
   */
  save<T>(key: string, value: T): void;

  /**
   * Loads a value from storage
   * @param key - Storage key
   * @returns The stored value or null if not found
   */
  load<T>(key: string): T | null;

  /**
   * Deletes a value from storage
   * @param key - Storage key
   */
  delete(key: string): void;

  /**
   * Clears all stored values
   */
  clear(): void;

  /**
   * Checks if a key exists in storage
   * @param key - Storage key
   * @returns true if the key exists
   */
  has(key: string): boolean;

  /**
   * Gets all keys in storage
   * @returns Array of all storage keys
   */
  keys(): string[];
}

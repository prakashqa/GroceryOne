/**
 * Storage Adapter Interface
 * Platform-agnostic storage abstraction.
 * Mobile: implements with AsyncStorage
 * Web: implements with localStorage
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiGet?(keys: string[]): Promise<[string, string | null][]>;
  multiSet?(entries: [string, string][]): Promise<void>;
  multiRemove?(keys: string[]): Promise<void>;
}

/**
 * Global storage instance set by the platform at startup.
 * Must be initialized before store creation.
 */
let _storageAdapter: StorageAdapter | null = null;

export function setStorageAdapter(adapter: StorageAdapter): void {
  _storageAdapter = adapter;
}

export function getStorageAdapter(): StorageAdapter {
  if (!_storageAdapter) {
    throw new Error(
      'StorageAdapter not initialized. Call setStorageAdapter() before creating the store.'
    );
  }
  return _storageAdapter;
}

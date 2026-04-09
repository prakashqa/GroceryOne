/**
 * Web localStorage adapter implementing StorageAdapter interface
 */
import type { StorageAdapter } from '@groceryone/store';

export const webStorageAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    if (typeof window === 'undefined') return keys.map((k) => [k, null]);
    return keys.map((key) => [key, localStorage.getItem(key)]);
  },

  async multiSet(entries: [string, string][]): Promise<void> {
    if (typeof window === 'undefined') return;
    entries.forEach(([key, value]) => localStorage.setItem(key, value));
  },

  async multiRemove(keys: string[]): Promise<void> {
    if (typeof window === 'undefined') return;
    keys.forEach((key) => localStorage.removeItem(key));
  },
};

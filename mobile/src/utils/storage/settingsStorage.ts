/**
 * Settings Storage Utility
 * Handles AsyncStorage operations for persisting settings
 * All storage is tenant-scoped to ensure data isolation between tenants
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsState, ThemeMode } from '../../store/slices/settingsSlice';

// Legacy storage key constants (used for one-time migration only)
/** @deprecated Use getTenantSettingsKey(tenantId) for tenant-scoped storage */
export const STORAGE_KEYS = {
  SETTINGS: '@groceryone/settings',
} as const;

/**
 * Get tenant-scoped settings storage key
 */
export const getTenantSettingsKey = (tenantId: string): string =>
  `@groceryone/settings/${tenantId}`;

/**
 * Save settings to AsyncStorage (tenant-scoped)
 */
export const saveSettings = async (
  settings: Partial<SettingsState>,
  tenantId: string
): Promise<void> => {
  try {
    const key = getTenantSettingsKey(tenantId);
    const existingData = await AsyncStorage.getItem(key);
    const existing = existingData ? JSON.parse(existingData) : {};
    const merged = { ...existing, ...settings };
    await AsyncStorage.setItem(key, JSON.stringify(merged));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
};

/**
 * Load settings from AsyncStorage (tenant-scoped)
 */
export const loadSettings = async (
  tenantId: string
): Promise<Partial<SettingsState> | null> => {
  try {
    const data = await AsyncStorage.getItem(getTenantSettingsKey(tenantId));
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return null;
  }
};

/**
 * Clear all settings from AsyncStorage (tenant-scoped)
 */
export const clearSettings = async (tenantId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(getTenantSettingsKey(tenantId));
  } catch (error) {
    console.error('Failed to clear settings:', error);
    throw error;
  }
};

/**
 * Save theme mode (tenant-scoped)
 */
export const saveThemeMode = async (mode: ThemeMode, tenantId: string): Promise<void> => {
  await saveSettings({ themeMode: mode }, tenantId);
};

/**
 * Save language (tenant-scoped)
 */
export const saveLanguage = async (language: string, tenantId: string): Promise<void> => {
  await saveSettings({ language }, tenantId);
};

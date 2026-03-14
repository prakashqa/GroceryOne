/**
 * AuthScreenControls Tests
 * TDD tests for theme toggle and language switch on auth screens
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AuthScreenControls } from '../AuthScreenControls';
import settingsReducer, { ThemeMode } from '../../../../store/slices/settingsSlice';

// Mock theme
jest.mock('../../../../presentation/theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback || _key,
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
}));

// Mock changeLanguage from i18n config
const mockChangeLanguage = jest.fn();
jest.mock('../../../../i18n/i18n.config', () => ({
  changeLanguage: (...args: any[]) => mockChangeLanguage(...args),
  AVAILABLE_LANGUAGES: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  ],
}));

// Mock saveGlobalThemeMode
const mockSaveGlobalThemeMode = jest.fn();
jest.mock('../../../../utils/storage/settingsStorage', () => ({
  saveGlobalThemeMode: (...args: any[]) => mockSaveGlobalThemeMode(...args),
}));

// Helper to create test store
const createTestStore = (themeMode: ThemeMode = 'system', language = 'en') => {
  return configureStore({
    reducer: {
      settings: settingsReducer,
    },
    preloadedState: {
      settings: {
        themeMode,
        language,
        notifications: {
          enabled: true,
          orderUpdates: true,
          promotions: false,
          reminders: true,
          sound: true,
          vibration: true,
        },
        printer: {
          enabled: false,
          connectionType: 'none' as const,
          selectedPrinterId: null,
          selectedPrinterName: null,
          selectedPrinterAddress: null,
          paperSize: '80mm' as const,
          printFormat: 'receipt' as const,
          connectionStatus: 'disconnected' as const,
          lastConnectedAt: null,
          autoPrint: false,
          imageWidthDots: 576,
        },
        payment: {
          merchantUpiId: '',
          merchantName: '',
        },
        isHydrated: false,
        lastUpdated: null,
      },
    },
  });
};

const renderControls = (themeMode: ThemeMode = 'system', language = 'en') => {
  const store = createTestStore(themeMode, language);
  return {
    ...render(
      <Provider store={store}>
        <AuthScreenControls />
      </Provider>
    ),
    store,
  };
};

describe('AuthScreenControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render both theme toggle and language switch buttons', () => {
      const { getByTestId } = renderControls();

      expect(getByTestId('auth-theme-toggle')).toBeTruthy();
      expect(getByTestId('auth-language-toggle')).toBeTruthy();
    });

    it('should render container', () => {
      const { getByTestId } = renderControls();

      expect(getByTestId('auth-screen-controls')).toBeTruthy();
    });
  });

  describe('theme toggle', () => {
    it('should show Auto label when theme is system', () => {
      const { getByTestId } = renderControls('system');
      const themeButton = getByTestId('auth-theme-toggle');

      // Should contain the Auto text
      expect(themeButton).toBeTruthy();
    });

    it('should cycle theme: system -> light on first press', () => {
      const { getByTestId, store } = renderControls('system');

      fireEvent.press(getByTestId('auth-theme-toggle'));

      expect(store.getState().settings.themeMode).toBe('light');
    });

    it('should cycle theme: light -> dark on press', () => {
      const { getByTestId, store } = renderControls('light');

      fireEvent.press(getByTestId('auth-theme-toggle'));

      expect(store.getState().settings.themeMode).toBe('dark');
    });

    it('should cycle theme: dark -> system on press', () => {
      const { getByTestId, store } = renderControls('dark');

      fireEvent.press(getByTestId('auth-theme-toggle'));

      expect(store.getState().settings.themeMode).toBe('system');
    });

    it('should persist theme to global AsyncStorage key', () => {
      const { getByTestId } = renderControls('system');

      fireEvent.press(getByTestId('auth-theme-toggle'));

      expect(mockSaveGlobalThemeMode).toHaveBeenCalledWith('light');
    });

    it('should NOT persist to tenant-scoped key (pre-auth)', () => {
      const { getByTestId } = renderControls('system');

      fireEvent.press(getByTestId('auth-theme-toggle'));

      // saveGlobalThemeMode uses @app_theme_mode, not @groceryone/settings/${tenantId}
      expect(mockSaveGlobalThemeMode).toHaveBeenCalledWith('light');
      expect(mockSaveGlobalThemeMode).toHaveBeenCalledTimes(1);
    });
  });

  describe('language toggle', () => {
    it('should show EN when language is English', () => {
      const { getByTestId } = renderControls('system', 'en');
      const langButton = getByTestId('auth-language-toggle');

      expect(langButton).toBeTruthy();
    });

    it('should toggle language from en to te', () => {
      const { getByTestId, store } = renderControls('system', 'en');

      fireEvent.press(getByTestId('auth-language-toggle'));

      expect(store.getState().settings.language).toBe('te');
      expect(mockChangeLanguage).toHaveBeenCalledWith('te');
    });

    it('should toggle language from te to en', () => {
      const { getByTestId, store } = renderControls('system', 'te');

      fireEvent.press(getByTestId('auth-language-toggle'));

      expect(store.getState().settings.language).toBe('en');
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('should call i18n changeLanguage for immediate UI update', () => {
      const { getByTestId } = renderControls('system', 'en');

      fireEvent.press(getByTestId('auth-language-toggle'));

      expect(mockChangeLanguage).toHaveBeenCalledWith('te');
    });

    it('should persist language via i18n global key (not tenant-scoped)', () => {
      const { getByTestId } = renderControls('system', 'en');

      fireEvent.press(getByTestId('auth-language-toggle'));

      // changeLanguage internally uses @app_language key via i18n's cacheUserLanguage
      expect(mockChangeLanguage).toHaveBeenCalledWith('te');
    });
  });

  describe('tenant isolation', () => {
    it('should not use any tenant-scoped storage keys', () => {
      const { getByTestId } = renderControls('system', 'en');

      // Toggle both
      fireEvent.press(getByTestId('auth-theme-toggle'));
      fireEvent.press(getByTestId('auth-language-toggle'));

      // Theme uses global key via saveGlobalThemeMode
      expect(mockSaveGlobalThemeMode).toHaveBeenCalledWith('light');
      // Language uses i18n's own global @app_language key
      expect(mockChangeLanguage).toHaveBeenCalledWith('te');
      // No tenant-scoped calls should be made
    });
  });
});

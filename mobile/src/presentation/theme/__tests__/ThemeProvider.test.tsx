/**
 * ThemeProvider Tests
 */

import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../ThemeProvider';
import { useTheme, useIsDarkMode } from '../useTheme';
import settingsReducer from '../../../store/slices/settingsSlice';

// Test component that uses theme
const ThemeConsumer = () => {
  const theme = useTheme();
  const isDark = useIsDarkMode();
  return (
    <View testID="theme-consumer">
      <Text testID="theme-mode">{theme.mode}</Text>
      <Text testID="primary-color">{theme.colors.primary}</Text>
      <Text testID="background-color">{theme.colors.background}</Text>
      <Text testID="is-dark">{isDark ? 'true' : 'false'}</Text>
    </View>
  );
};

const createTestStore = (themeMode: 'light' | 'dark' | 'system' = 'system') =>
  configureStore({
    reducer: { settings: settingsReducer },
    preloadedState: {
      settings: {
        themeMode,
        language: 'en',
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
        },
        isHydrated: true,
        lastUpdated: null,
      },
    },
  });

describe('ThemeProvider', () => {
  it('should provide light theme when themeMode is light', () => {
    const store = createTestStore('light');
    const { getByTestId } = render(
      <Provider store={store}>
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      </Provider>
    );

    expect(getByTestId('theme-mode').props.children).toBe('light');
    expect(getByTestId('background-color').props.children).toBe('#F5F7FA');
    expect(getByTestId('is-dark').props.children).toBe('false');
  });

  it('should provide dark theme when themeMode is dark', () => {
    const store = createTestStore('dark');
    const { getByTestId } = render(
      <Provider store={store}>
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      </Provider>
    );

    expect(getByTestId('theme-mode').props.children).toBe('dark');
    expect(getByTestId('background-color').props.children).toBe('#0F0F0F');
    expect(getByTestId('is-dark').props.children).toBe('true');
  });

  it('should have correct primary colors', () => {
    const storeDark = createTestStore('dark');
    const { getByTestId: getByTestIdDark } = render(
      <Provider store={storeDark}>
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      </Provider>
    );

    // Dark mode uses slightly lighter primary color for visibility
    expect(getByTestIdDark('primary-color').props.children).toBe('#66BB6A');
  });

  it('should throw error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => render(<ThemeConsumer />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );

    consoleSpy.mockRestore();
  });

  describe('Theme Tokens', () => {
    it('should have opacity tokens', () => {
      const store = createTestStore('light');
      let capturedTheme: any;

      const ThemeCapture = () => {
        capturedTheme = useTheme();
        return null;
      };

      render(
        <Provider store={store}>
          <ThemeProvider>
            <ThemeCapture />
          </ThemeProvider>
        </Provider>
      );

      expect(capturedTheme.opacity).toBeDefined();
      expect(capturedTheme.opacity.disabled).toBe(0.5);
      expect(capturedTheme.opacity.pressed).toBe(0.12);
      expect(capturedTheme.opacity.overlay).toBe(0.6);
      expect(capturedTheme.opacity.muted).toBe(0.1);
    });

    it('should have animation duration tokens', () => {
      const store = createTestStore('light');
      let capturedTheme: any;

      const ThemeCapture = () => {
        capturedTheme = useTheme();
        return null;
      };

      render(
        <Provider store={store}>
          <ThemeProvider>
            <ThemeCapture />
          </ThemeProvider>
        </Provider>
      );

      expect(capturedTheme.animation).toBeDefined();
      expect(capturedTheme.animation.fast).toBe(150);
      expect(capturedTheme.animation.normal).toBe(200);
      expect(capturedTheme.animation.slow).toBe(300);
    });

    it('should have standardized button height tokens', () => {
      const store = createTestStore('light');
      let capturedTheme: any;

      const ThemeCapture = () => {
        capturedTheme = useTheme();
        return null;
      };

      render(
        <Provider store={store}>
          <ThemeProvider>
            <ThemeCapture />
          </ThemeProvider>
        </Provider>
      );

      expect(capturedTheme.buttonHeights).toBeDefined();
      expect(capturedTheme.buttonHeights.sm).toBe(36);
      expect(capturedTheme.buttonHeights.md).toBe(48);
      expect(capturedTheme.buttonHeights.lg).toBe(56);
    });

    it('should have text style presets', () => {
      const store = createTestStore('light');
      let capturedTheme: any;

      const ThemeCapture = () => {
        capturedTheme = useTheme();
        return null;
      };

      render(
        <Provider store={store}>
          <ThemeProvider>
            <ThemeCapture />
          </ThemeProvider>
        </Provider>
      );

      expect(capturedTheme.textStyles).toBeDefined();
      expect(capturedTheme.textStyles.h1).toBeDefined();
      expect(capturedTheme.textStyles.h2).toBeDefined();
      expect(capturedTheme.textStyles.h3).toBeDefined();
      expect(capturedTheme.textStyles.body).toBeDefined();
      expect(capturedTheme.textStyles.bodySmall).toBeDefined();
      expect(capturedTheme.textStyles.caption).toBeDefined();
      expect(capturedTheme.textStyles.button).toBeDefined();
      expect(capturedTheme.textStyles.buttonSmall).toBeDefined();
      expect(capturedTheme.textStyles.overline).toBeDefined();
      expect(capturedTheme.textStyles.subtitle).toBeDefined();
    });

    it('should have overline text style with correct values', () => {
      const store = createTestStore('light');
      let capturedTheme: any;

      const ThemeCapture = () => {
        capturedTheme = useTheme();
        return null;
      };

      render(
        <Provider store={store}>
          <ThemeProvider>
            <ThemeCapture />
          </ThemeProvider>
        </Provider>
      );

      expect(capturedTheme.textStyles.overline.fontSize).toBe(10);
      expect(capturedTheme.textStyles.overline.fontWeight).toBe('500');
      expect(capturedTheme.textStyles.overline.letterSpacing).toBe(0.8);
    });

    it('should have subtitle text style with correct values', () => {
      const store = createTestStore('light');
      let capturedTheme: any;

      const ThemeCapture = () => {
        capturedTheme = useTheme();
        return null;
      };

      render(
        <Provider store={store}>
          <ThemeProvider>
            <ThemeCapture />
          </ThemeProvider>
        </Provider>
      );

      expect(capturedTheme.textStyles.subtitle.fontSize).toBe(18);
      expect(capturedTheme.textStyles.subtitle.fontWeight).toBe('600');
      expect(capturedTheme.textStyles.subtitle.letterSpacing).toBe(-0.2);
    });

    it('should have smd spacing token equal to 12', () => {
      const store = createTestStore('light');
      let capturedTheme: any;

      const ThemeCapture = () => {
        capturedTheme = useTheme();
        return null;
      };

      render(
        <Provider store={store}>
          <ThemeProvider>
            <ThemeCapture />
          </ThemeProvider>
        </Provider>
      );

      expect(capturedTheme.spacing.smd).toBe(12);
    });

    it('should have 2xl fontSize token equal to 20', () => {
      const store = createTestStore('light');
      let capturedTheme: any;

      const ThemeCapture = () => {
        capturedTheme = useTheme();
        return null;
      };

      render(
        <Provider store={store}>
          <ThemeProvider>
            <ThemeCapture />
          </ThemeProvider>
        </Provider>
      );

      expect(capturedTheme.typography.fontSize['2xl']).toBe(20);
    });

    it('should have letterSpacing tokens', () => {
      const store = createTestStore('light');
      let capturedTheme: any;

      const ThemeCapture = () => {
        capturedTheme = useTheme();
        return null;
      };

      render(
        <Provider store={store}>
          <ThemeProvider>
            <ThemeCapture />
          </ThemeProvider>
        </Provider>
      );

      expect(capturedTheme.letterSpacing).toBeDefined();
      expect(capturedTheme.letterSpacing.tight).toBe(-0.5);
      expect(capturedTheme.letterSpacing.snug).toBe(-0.3);
      expect(capturedTheme.letterSpacing.normal).toBe(0);
      expect(capturedTheme.letterSpacing.wide).toBe(0.3);
      expect(capturedTheme.letterSpacing.wider).toBe(0.5);
    });

    it('should have new color tokens for buttons and icons', () => {
      const store = createTestStore('light');
      let capturedTheme: any;

      const ThemeCapture = () => {
        capturedTheme = useTheme();
        return null;
      };

      render(
        <Provider store={store}>
          <ThemeProvider>
            <ThemeCapture />
          </ThemeProvider>
        </Provider>
      );

      // Button colors
      expect(capturedTheme.colors.buttonDangerText).toBeDefined();
      expect(capturedTheme.colors.buttonGhostText).toBeDefined();
      expect(capturedTheme.colors.buttonGhostPressed).toBeDefined();

      // Icon backgrounds
      expect(capturedTheme.colors.iconMuted).toBeDefined();
      expect(capturedTheme.colors.iconDanger).toBeDefined();

      // Surface overlays
      expect(capturedTheme.colors.surfaceOverlay).toBeDefined();
      expect(capturedTheme.colors.borderMuted).toBeDefined();
    });
  });
});

/**
 * AuthScreenControls
 * Theme toggle and language switch for auth screens (pre-login).
 * Uses global (non-tenant-scoped) persistence since no tenant context exists yet.
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../presentation/theme';
import { useAppDispatch, useAppSelector } from '../../../core/hooks/useAppDispatch';
import {
  setThemeMode,
  setLanguage,
  selectThemeMode,
  selectLanguage,
  ThemeMode,
} from '../../../store/slices/settingsSlice';
import { changeLanguage } from '../../../i18n/i18n.config';
import { saveGlobalThemeMode } from '../../../utils/storage/settingsStorage';

/** Theme mode cycle: system → light → dark → system */
const THEME_CYCLE: Record<ThemeMode, ThemeMode> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

/** Display labels for theme modes */
const THEME_ICONS: Record<ThemeMode, string> = {
  light: '☀️',
  dark: '🌙',
  system: '📱',
};

const THEME_LABELS: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'Auto',
};

export const AuthScreenControls: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { t } = useTranslation('auth');
  const currentThemeMode = useAppSelector(selectThemeMode);
  const currentLanguage = useAppSelector(selectLanguage);

  const handleThemeToggle = useCallback(() => {
    const nextMode = THEME_CYCLE[currentThemeMode];
    dispatch(setThemeMode(nextMode));
    // Persist globally (no tenant context on auth screens)
    saveGlobalThemeMode(nextMode);
  }, [currentThemeMode, dispatch]);

  const handleLanguageToggle = useCallback(() => {
    const nextLanguage = currentLanguage === 'en' ? 'te' : 'en';
    dispatch(setLanguage(nextLanguage));
    changeLanguage(nextLanguage as 'en' | 'te');
  }, [currentLanguage, dispatch]);

  const themeLabel = t(
    `controls.theme${THEME_LABELS[currentThemeMode]}` as any,
    THEME_LABELS[currentThemeMode]
  );

  return (
    <View style={styles.container} testID="auth-screen-controls">
      {/* Theme Toggle */}
      <TouchableOpacity
        style={[
          styles.controlButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.sm,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
          },
        ]}
        onPress={handleThemeToggle}
        accessibilityRole="button"
        accessibilityLabel={`Theme: ${themeLabel}`}
        testID="auth-theme-toggle"
      >
        <Text
          style={[
            styles.controlText,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.sm,
            },
          ]}
        >
          {THEME_ICONS[currentThemeMode]} {themeLabel}
        </Text>
      </TouchableOpacity>

      {/* Language Switch */}
      <TouchableOpacity
        style={[
          styles.controlButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.sm,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
            marginLeft: theme.spacing.sm,
          },
        ]}
        onPress={handleLanguageToggle}
        accessibilityRole="button"
        accessibilityLabel={`Language: ${currentLanguage === 'en' ? 'English' : 'Telugu'}`}
        testID="auth-language-toggle"
      >
        <Text
          style={[
            styles.controlText,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.sm,
            },
          ]}
        >
          {currentLanguage === 'en' ? '🌐 EN' : '🌐 తె'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlButton: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlText: {
    textAlign: 'center',
  },
});

export default AuthScreenControls;

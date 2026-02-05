/**
 * Theme Provider
 * Provides theme context to the app based on Redux state and system preference
 */

import React, { useMemo, ReactNode } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { useSelector } from 'react-redux';
import { ThemeContext, ThemeContextValue } from './ThemeContext';
import { lightTheme, darkTheme } from './themes';
import { selectThemeMode } from '../../store/slices/settingsSlice';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeMode = useSelector(selectThemeMode);
  const systemColorScheme = useColorScheme();

  // Resolve the actual theme based on mode and system preference
  const contextValue = useMemo<ThemeContextValue>(() => {
    let isDark: boolean;

    if (themeMode === 'system') {
      // Use system preference
      isDark = systemColorScheme === 'dark';
    } else {
      // Use user's explicit choice
      isDark = themeMode === 'dark';
    }

    return {
      theme: isDark ? darkTheme : lightTheme,
      isDark,
    };
  }, [themeMode, systemColorScheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <StatusBar
        barStyle={contextValue.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={contextValue.theme.colors.statusBar}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;

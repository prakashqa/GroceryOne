/**
 * useTheme Hook
 * Custom hook to access theme context
 */

import { useContext } from 'react';
import { ThemeContext, ThemeContextValue } from './ThemeContext';
import { Theme } from './types';

/**
 * Hook to access the current theme
 * @returns The current theme object
 * @throws Error if used outside of ThemeProvider
 */
export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context.theme;
}

/**
 * Hook to access theme context including isDark flag
 * @returns The theme context value
 * @throws Error if used outside of ThemeProvider
 */
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to check if dark mode is active
 * @returns Boolean indicating if dark mode is active
 */
export function useIsDarkMode(): boolean {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useIsDarkMode must be used within a ThemeProvider');
  }
  return context.isDark;
}

export default useTheme;

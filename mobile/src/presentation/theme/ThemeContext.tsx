/**
 * Theme Context
 * React Context for theme values
 */

import { createContext } from 'react';
import { Theme } from './types';

export interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
}

// Default to light theme
export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

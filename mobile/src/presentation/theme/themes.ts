/**
 * Theme Definitions
 * Light and dark theme configurations
 */

import { Theme } from './types';

// Shared values
const spacing = {
  xs: 4,
  sm: 8,
  smd: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
};

const opacity = {
  disabled: 0.5,
  pressed: 0.12,
  overlay: 0.6,
  muted: 0.1,
};

const letterSpacing = {
  tight: -0.5,
  snug: -0.3,
  normal: 0,
  wide: 0.3,
  wider: 0.5,
};

const animation = {
  fast: 150,
  normal: 200,
  slow: 300,
};

const buttonHeights = {
  sm: 36,
  md: 48,
  lg: 56,
};

// Light theme gradients
const lightGradients = {
  primary: ['#2E7D32', '#4CAF50'] as [string, string],
  primarySubtle: ['#EDF7EE', '#F5F7FA'] as [string, string],
  success: ['#43A047', '#66BB6A'] as [string, string],
  info: ['#1976D2', '#42A5F5'] as [string, string],
  warning: ['#F57C00', '#FFB74D'] as [string, string],
  card: ['#FFFFFF', '#FAFAFA'] as [string, string],
};

// Dark theme gradients
const darkGradients = {
  primary: ['#2E7D32', '#388E3C'] as [string, string],
  primarySubtle: ['#1B3D1E', '#1E4620'] as [string, string],
  success: ['#388E3C', '#4CAF50'] as [string, string],
  info: ['#1565C0', '#1976D2'] as [string, string],
  warning: ['#E65100', '#F57C00'] as [string, string],
  card: ['#1E1E1E', '#252525'] as [string, string],
};

// Light theme colored shadows
const lightColoredShadows = {
  primary: {
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  success: {
    shadowColor: '#43A047',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  warning: {
    shadowColor: '#F57C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  info: {
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Dark theme colored shadows
const darkColoredShadows = {
  primary: {
    shadowColor: '#66BB6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  success: {
    shadowColor: '#66BB6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  warning: {
    shadowColor: '#FFB74D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  info: {
    shadowColor: '#64B5F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};

const textStyles = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  overline: {
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
};

/**
 * Light Theme
 * Matches existing GroOne design with green primary color
 */
export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    // Primary palette (green theme — refined for less visual heaviness)
    primary: '#2E7D32',
    primaryLight: '#66BB6A',
    primaryDark: '#1B5E20',
    primaryMuted: '#388E3C',
    accent: '#FF6B35',

    // Backgrounds (neutral cool gray, white header)
    background: '#F5F7FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    // Header bar renders on top of theme.colors.primary (green), not
    // headerBackground. These tokens must read against green — white +
    // semi-transparent white mirror the title/icon color="inverse" already in use.
    headerBackground: '#FFFFFF',
    headerText: '#FFFFFF',
    headerTextMuted: 'rgba(255, 255, 255, 0.75)',

    // Text
    text: '#1A1A1A',
    textSecondary: '#666666',
    textLight: '#999999',
    textInverse: '#FFFFFF',

    // UI elements
    border: '#E8E8E8',
    divider: '#F0F0F0',
    icon: '#1A1A1A',
    iconSecondary: '#666666',
    iconMuted: 'rgba(46, 125, 50, 0.1)',
    iconDanger: 'rgba(211, 47, 47, 0.1)',
    surfaceOverlay: 'rgba(255, 255, 255, 0.15)',
    borderMuted: 'rgba(46, 125, 50, 0.15)',

    // Buttons
    buttonPrimary: '#2E7D32',
    buttonPrimaryText: '#FFFFFF',
    buttonPrimaryPressed: '#1B5E20',
    buttonSecondary: '#FFFFFF',
    buttonSecondaryText: '#2E7D32',
    buttonDangerText: '#FFFFFF',
    buttonGhostText: '#666666',
    buttonGhostPressed: 'rgba(0, 0, 0, 0.05)',

    // Status colors
    success: '#2E7D32',
    warning: '#F57C00',
    error: '#D32F2F',
    info: '#1976D2',

    // Interactive states
    ripple: 'rgba(46, 125, 50, 0.12)',
    disabled: '#BDBDBD',
    placeholder: '#9E9E9E',

    // Modal
    modalOverlay: 'rgba(0, 0, 0, 0.6)',

    // Input
    inputBackground: '#F5F5F5',
    inputFocus: '#2E7D32',

    // Cart/In-cart states
    inCartBackground: '#EDF7EE',
    inCartBorder: '#81C784',
    inCartBadge: '#4CAF50',

    // Status backgrounds (muted tints for badges, cards)
    successBackground: '#E8F5E9',
    errorBackground: '#FFEBEE',

    // Status bar (matches white header)
    statusBar: '#FFFFFF',
  },
  spacing,
  typography,
  borderRadius,
  shadows: {
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 0.5,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
  },
  coloredShadows: lightColoredShadows,
  gradients: lightGradients,
  opacity,
  animation,
  buttonHeights,
  textStyles,
  letterSpacing,
};

/**
 * Dark Theme
 * Optimized for dark mode with proper contrast ratios
 * Uses muted, desaturated greens that work well on dark backgrounds
 */
export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    // Primary palette (muted greens for dark mode - less saturated)
    primary: '#66BB6A',
    primaryLight: '#81C784',
    primaryDark: '#388E3C',
    primaryMuted: '#4A7C4E',
    accent: '#FF8A65',

    // Backgrounds (dark surface header, deeper black background)
    background: '#0F0F0F',
    surface: '#1E1E1E',
    card: '#2C2C2C',
    // Header bar renders on top of theme.colors.primary (green) in dark mode
    // too. Bumped muted alpha from 0.6 → 0.75 for readability on green.
    headerBackground: '#1E1E1E',
    headerText: '#FFFFFF',
    headerTextMuted: 'rgba(255, 255, 255, 0.75)',

    // Text (high contrast for accessibility)
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textLight: '#808080',
    textInverse: '#1A1A1A',

    // UI elements
    border: '#3C3C3C',
    divider: '#2C2C2C',
    icon: '#FFFFFF',
    iconSecondary: '#B0B0B0',
    iconMuted: 'rgba(102, 187, 106, 0.15)',
    iconDanger: 'rgba(239, 83, 80, 0.15)',
    surfaceOverlay: 'rgba(255, 255, 255, 0.1)',
    borderMuted: 'rgba(129, 199, 132, 0.5)',

    // Buttons (desaturated greens for dark mode)
    buttonPrimary: '#2E7D32',
    buttonPrimaryText: '#E8F5E9',
    buttonPrimaryPressed: '#388E3C',
    buttonSecondary: '#2C3E2D',
    buttonSecondaryText: '#81C784',
    buttonDangerText: '#FFFFFF',
    buttonGhostText: '#B0B0B0',
    buttonGhostPressed: 'rgba(255, 255, 255, 0.05)',

    // Status colors (slightly brighter for dark mode)
    success: '#66BB6A',
    warning: '#FFB74D',
    error: '#EF5350',
    info: '#64B5F6',

    // Interactive states
    ripple: 'rgba(102, 187, 106, 0.24)',
    disabled: '#5C5C5C',
    placeholder: '#6C6C6C',

    // Modal
    modalOverlay: 'rgba(0, 0, 0, 0.75)',

    // Input
    inputBackground: '#252525',
    inputFocus: '#81C784',

    // Cart/In-cart states (subtle dark green tints)
    inCartBackground: '#1B3D1E',
    inCartBorder: '#4A7C4E',
    inCartBadge: '#388E3C',

    // Status backgrounds (muted tints for badges, cards)
    successBackground: '#1B3D1E',
    errorBackground: '#3D1F1F',

    // Status bar
    statusBar: '#1A2E1B',
  },
  spacing,
  typography,
  borderRadius,
  shadows: {
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 0.5,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
      elevation: 12,
    },
  },
  coloredShadows: darkColoredShadows,
  gradients: darkGradients,
  opacity,
  animation,
  buttonHeights,
  textStyles,
  letterSpacing,
};

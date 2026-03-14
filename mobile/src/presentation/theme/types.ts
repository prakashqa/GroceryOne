/**
 * Theme System Types
 * TypeScript interfaces for the theming system
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Primary palette
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryMuted: string;
  accent: string;

  // Backgrounds
  background: string;
  surface: string;
  card: string;
  headerBackground: string;
  headerText: string;
  headerTextMuted: string;

  // Text
  text: string;
  textSecondary: string;
  textLight: string;
  textInverse: string;

  // UI elements
  border: string;
  divider: string;
  icon: string;
  iconSecondary: string;
  iconMuted: string;
  iconDanger: string;
  surfaceOverlay: string;
  borderMuted: string;

  // Buttons
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonPrimaryPressed: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  buttonDangerText: string;
  buttonGhostText: string;
  buttonGhostPressed: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Interactive states
  ripple: string;
  disabled: string;
  placeholder: string;

  // Modal
  modalOverlay: string;

  // Input
  inputBackground: string;
  inputFocus: string;

  // Cart/In-cart states
  inCartBackground: string;
  inCartBorder: string;
  inCartBadge: string;

  // Status backgrounds (muted tints for badges, cards)
  successBackground: string;
  errorBackground: string;

  // Status bar
  statusBar: string;
}

export interface ThemeSpacing {
  xs: number; // 4
  sm: number; // 8
  smd: number; // 12
  md: number; // 16
  lg: number; // 24
  xl: number; // 32
}

export interface ThemeTypography {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
  };
  fontSize: {
    xs: number; // 10
    sm: number; // 12
    md: number; // 14
    lg: number; // 16
    xl: number; // 18
    '2xl': number; // 20
    xxl: number; // 24
    xxxl: number; // 32
  };
  fontWeight: {
    regular: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
  };
}

export interface ThemeBorderRadius {
  xs: number; // 4
  sm: number; // 8
  md: number; // 12
  lg: number; // 16
  xl: number; // 24
  '2xl': number; // 32
  full: number; // 9999
}

export interface ThemeShadows {
  xs: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  sm: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  md: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  lg: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  xl: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface ThemeOpacity {
  disabled: number;
  pressed: number;
  overlay: number;
  muted: number;
}

export interface ThemeAnimation {
  fast: number;
  normal: number;
  slow: number;
}

export interface ThemeGradients {
  primary: [string, string];
  primarySubtle: [string, string];
  success: [string, string];
  info: [string, string];
  warning: [string, string];
  card: [string, string];
}

export interface ThemeColoredShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ThemeColoredShadows {
  primary: ThemeColoredShadow;
  success: ThemeColoredShadow;
  warning: ThemeColoredShadow;
  info: ThemeColoredShadow;
}

export interface ThemeButtonHeights {
  sm: number;
  md: number;
  lg: number;
}

export interface ThemeTextStyle {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700';
  letterSpacing: number;
}

export interface ThemeTextStyles {
  h1: ThemeTextStyle;
  h2: ThemeTextStyle;
  h3: ThemeTextStyle;
  subtitle: ThemeTextStyle;
  body: ThemeTextStyle;
  bodySmall: ThemeTextStyle;
  caption: ThemeTextStyle;
  overline: ThemeTextStyle;
  button: ThemeTextStyle;
  buttonSmall: ThemeTextStyle;
}

export interface ThemeLetterSpacing {
  tight: number; // -0.5
  snug: number; // -0.3
  normal: number; // 0
  wide: number; // 0.3
  wider: number; // 0.5
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  coloredShadows: ThemeColoredShadows;
  gradients: ThemeGradients;
  opacity: ThemeOpacity;
  animation: ThemeAnimation;
  buttonHeights: ThemeButtonHeights;
  textStyles: ThemeTextStyles;
  letterSpacing: ThemeLetterSpacing;
}

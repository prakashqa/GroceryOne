/**
 * Text Component
 * A typography wrapper that enforces consistent text styles from the theme.
 * Automatically scales font sizes for tablets using responsiveStyles.
 */

import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'button'
  | 'buttonSmall';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'error'
  | 'success'
  | 'warning'
  | 'inverse'
  | 'accent';

export interface TextProps extends Omit<RNTextProps, 'style'> {
  /**
   * Typography variant from theme.textStyles
   * @default 'body'
   */
  variant?: TextVariant;
  /**
   * Text color
   * @default 'primary'
   */
  color?: TextColor;
  /**
   * Text alignment
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right';
  /**
   * Maximum number of lines before truncating
   */
  numberOfLines?: number;
  /**
   * Custom style to merge with base styles
   */
  style?: TextStyle;
  /**
   * Test ID for testing
   */
  testID?: string;
  /**
   * Children content
   */
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  align = 'left',
  numberOfLines,
  style,
  testID,
  children,
  ...props
}) => {
  const theme = useTheme();
  const responsiveStyles = useResponsiveStyles();

  // Get text style from theme
  const getTextStyle = (): TextStyle => {
    const baseStyle = theme.textStyles[variant];
    return {
      fontSize: Math.round(baseStyle.fontSize * responsiveStyles.fontScale),
      fontWeight: baseStyle.fontWeight as TextStyle['fontWeight'],
      letterSpacing: baseStyle.letterSpacing,
    };
  };

  // Get color from theme
  const getColor = (): string => {
    switch (color) {
      case 'primary':
        return theme.colors.text;
      case 'secondary':
        return theme.colors.textSecondary;
      case 'muted':
        return theme.colors.textLight;
      case 'error':
        return theme.colors.error;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'inverse':
        return theme.colors.buttonPrimaryText;
      case 'accent':
        return theme.colors.primary;
      default:
        return theme.colors.text;
    }
  };

  const textStyle = getTextStyle();
  const textColor = getColor();

  return (
    <RNText
      style={[
        styles.base,
        textStyle,
        { color: textColor, textAlign: align },
        style,
      ]}
      numberOfLines={numberOfLines}
      testID={testID}
      accessibilityRole="text"
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    // Base styles that apply to all text
  },
});

export default Text;

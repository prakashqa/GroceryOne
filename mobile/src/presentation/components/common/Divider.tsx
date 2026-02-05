/**
 * Divider Component
 * A visual separator for content sections with customizable variants.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export type DividerVariant = 'full' | 'inset' | 'middle';
export type DividerSpacing = 'none' | 'sm' | 'md' | 'lg';

export interface DividerProps {
  /**
   * Divider variant controlling horizontal margins
   * - 'full': Full width
   * - 'inset': Left margin for list items (typically 16px)
   * - 'middle': Centered with margins on both sides
   * @default 'full'
   */
  variant?: DividerVariant;
  /**
   * Vertical spacing around the divider
   * @default 'none'
   */
  spacing?: DividerSpacing;
  /**
   * Custom container style
   */
  style?: ViewStyle;
  /**
   * Test ID for testing
   */
  testID?: string;
}

export const Divider: React.FC<DividerProps> = ({
  variant = 'full',
  spacing = 'none',
  style,
  testID,
}) => {
  const theme = useTheme();

  // Get horizontal margins based on variant
  const getMargins = (): ViewStyle => {
    switch (variant) {
      case 'inset':
        return { marginLeft: theme.spacing.md };
      case 'middle':
        return {
          marginLeft: theme.spacing.md,
          marginRight: theme.spacing.md,
        };
      case 'full':
      default:
        return {};
    }
  };

  // Get vertical spacing
  const getSpacing = (): ViewStyle => {
    switch (spacing) {
      case 'sm':
        return {
          marginTop: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
        };
      case 'md':
        return {
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.md,
        };
      case 'lg':
        return {
          marginTop: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
        };
      case 'none':
      default:
        return {};
    }
  };

  const margins = getMargins();
  const verticalSpacing = getSpacing();

  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: theme.colors.divider },
        margins,
        verticalSpacing,
        style,
      ]}
      testID={testID}
      accessibilityRole="none"
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});

export default Divider;

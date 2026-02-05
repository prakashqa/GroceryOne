/**
 * SafeAreaWrapper Component
 * Standardized safe area handling for consistent screen layouts
 */

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

export type SafeAreaEdge = 'top' | 'bottom' | 'left' | 'right';

export interface SafeAreaWrapperProps {
  /**
   * Content to render inside the safe area
   */
  children: React.ReactNode;
  /**
   * Which edges to apply safe area insets to
   * @default ['top']
   */
  edges?: SafeAreaEdge[];
  /**
   * Background color for the wrapper
   * @default theme.colors.background
   */
  backgroundColor?: string;
  /**
   * Additional styles to apply
   */
  style?: ViewStyle;
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * SafeAreaWrapper component that provides consistent safe area handling
 * across all screens in the app.
 *
 * @example
 * ```tsx
 * // Basic usage - top safe area only
 * <SafeAreaWrapper>
 *   <ScreenContent />
 * </SafeAreaWrapper>
 *
 * // With bottom safe area
 * <SafeAreaWrapper edges={['top', 'bottom']}>
 *   <ScreenContent />
 * </SafeAreaWrapper>
 *
 * // Custom background color
 * <SafeAreaWrapper backgroundColor={theme.colors.primary}>
 *   <HeaderContent />
 * </SafeAreaWrapper>
 * ```
 */
export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  edges = ['top'],
  backgroundColor,
  style,
  testID,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Build padding styles based on edges
  const safeAreaStyle: ViewStyle = {};

  if (edges.includes('top')) {
    safeAreaStyle.paddingTop = insets.top;
  }
  if (edges.includes('bottom')) {
    safeAreaStyle.paddingBottom = insets.bottom;
  }
  if (edges.includes('left')) {
    safeAreaStyle.paddingLeft = insets.left;
  }
  if (edges.includes('right')) {
    safeAreaStyle.paddingRight = insets.right;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: backgroundColor ?? theme.colors.background,
        },
        safeAreaStyle,
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeAreaWrapper;

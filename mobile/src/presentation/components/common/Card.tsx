/**
 * Card Component
 * A standardized card container with consistent styling.
 * Supports elevation, outlined, and filled variants.
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { useTheme, useIsDarkMode } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';

export type CardVariant = 'elevated' | 'outlined' | 'filled';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  /**
   * Card content
   */
  children: React.ReactNode;
  /**
   * Card visual variant
   * @default 'elevated'
   */
  variant?: CardVariant;
  /**
   * Internal padding size
   * @default 'md'
   */
  padding?: CardPadding;
  /**
   * Optional press handler - makes card pressable
   */
  onPress?: () => void;
  /**
   * Whether the card is disabled (when pressable)
   */
  disabled?: boolean;
  /**
   * Custom container style
   */
  style?: ViewStyle;
  /**
   * Test ID for testing
   */
  testID?: string;
  /**
   * Apply highlighted state with accent border
   * @default false
   */
  highlighted?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  onPress,
  disabled = false,
  style,
  testID,
  highlighted = false,
}) => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const responsiveStyles = useResponsiveStyles();

  // Animation for press feedback
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  // Get padding value based on size
  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return theme.spacing.sm;
      case 'lg':
        return theme.spacing.lg;
      case 'md':
      default:
        return responsiveStyles.componentPadding;
    }
  };

  // Get background color based on variant
  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'filled':
        return isDarkMode ? theme.colors.card : theme.colors.background;
      case 'outlined':
      case 'elevated':
      default:
        return isDarkMode ? theme.colors.card : theme.colors.surface;
    }
  };

  // Get shadow based on variant
  const getShadow = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return theme.shadows.md;
      case 'outlined':
        return {};
      case 'filled':
        return {};
      default:
        return {};
    }
  };

  // Get border based on variant and highlighted state
  const getBorder = (): ViewStyle => {
    // Highlighted state takes precedence (but not when disabled)
    if (highlighted && !disabled) {
      return {
        borderWidth: 2,
        borderColor: theme.colors.primary,
      };
    }
    if (variant === 'outlined') {
      return {
        borderWidth: 1,
        borderColor: theme.colors.border,
      };
    }
    return {};
  };

  const paddingValue = getPadding();
  const backgroundColor = getBackgroundColor();
  const shadow = getShadow();
  const border = getBorder();

  const cardStyle: ViewStyle = {
    borderRadius: responsiveStyles.cardBorderRadius,
    padding: paddingValue,
    backgroundColor,
    ...border,
    opacity: disabled ? 0.5 : 1,
  };

  const cardContent = (
    <Animated.View
      style={[
        styles.container,
        cardStyle,
        shadow,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
      testID={testID}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityState={{ disabled }}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default Card;

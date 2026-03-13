/**
 * Button Component
 * Reusable button with multiple variants, sizes, and press animation
 * Supports gradient backgrounds and colored shadows for enhanced visuals
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconOnly?: boolean;
  fullWidth?: boolean;
  testID?: string;
  /**
   * Apply gradient background (only works for primary variant)
   * Uses theme.gradients.primary colors
   */
  useGradient?: boolean;
  /**
   * Apply colored shadow matching the variant
   * Uses theme.coloredShadows
   */
  elevated?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconOnly = false,
  fullWidth = false,
  testID,
  useGradient = false,
  elevated = false,
}) => {
  const theme = useTheme();
  const responsiveStyles = useResponsiveStyles();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getBackgroundColor = (): string => {
    if (isDisabled) {
      return variant === 'primary' || variant === 'danger'
        ? theme.colors.disabled
        : 'transparent';
    }

    switch (variant) {
      case 'primary':
        return theme.colors.buttonPrimary;
      case 'danger':
        return theme.colors.error;
      case 'secondary':
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.buttonPrimary;
    }
  };

  const getTextColor = (): string => {
    if (isDisabled) {
      return variant === 'primary' || variant === 'danger'
        ? theme.colors.buttonDangerText
        : theme.colors.textLight;
    }

    switch (variant) {
      case 'primary':
        return theme.colors.buttonPrimaryText;
      case 'danger':
        return theme.colors.buttonDangerText;
      case 'secondary':
        return theme.colors.buttonSecondaryText;
      case 'ghost':
        return theme.colors.buttonGhostText;
      default:
        return theme.colors.buttonPrimaryText;
    }
  };

  const getBorderColor = (): string | undefined => {
    if (variant === 'secondary') {
      return isDisabled ? theme.colors.disabled : theme.colors.primary;
    }
    if (variant === 'ghost') {
      return isDisabled ? theme.colors.disabled : theme.colors.border;
    }
    return undefined;
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle; iconSize: number; hitSlop: number } => {
    // Ensure minimum touch target height for accessibility
    const minTouchTarget = responsiveStyles.touchTargetMinSize;

    switch (size) {
      case 'sm': {
        // Use theme height but ensure it meets minimum touch target
        const smHeight = Math.max(theme.buttonHeights.sm, minTouchTarget);
        return {
          container: {
            height: smHeight,
            paddingHorizontal: iconOnly ? 0 : theme.spacing.md,
            borderRadius: iconOnly ? responsiveStyles.buttonBorderRadius : theme.borderRadius.sm,
          },
          text: {
            ...theme.textStyles.buttonSmall,
            fontSize: Math.round(theme.textStyles.buttonSmall.fontSize * responsiveStyles.fontScale),
          },
          iconSize: Math.round(theme.typography.fontSize.md * responsiveStyles.fontScale),
          hitSlop: iconOnly ? Math.max(0, (minTouchTarget - smHeight) / 2) : 0,
        };
      }
      case 'lg': {
        const lgHeight = Math.max(theme.buttonHeights.lg, minTouchTarget);
        return {
          container: {
            height: lgHeight,
            paddingHorizontal: iconOnly ? 0 : theme.spacing.xl,
            borderRadius: iconOnly ? responsiveStyles.buttonBorderRadius : theme.borderRadius.lg,
          },
          text: {
            ...theme.textStyles.button,
            fontSize: Math.round(theme.textStyles.button.fontSize * responsiveStyles.fontScale),
          },
          iconSize: Math.round(theme.typography.fontSize.xl * responsiveStyles.fontScale),
          hitSlop: 0,
        };
      }
      case 'md':
      default: {
        const mdHeight = Math.max(theme.buttonHeights.md, minTouchTarget);
        return {
          container: {
            height: mdHeight,
            paddingHorizontal: iconOnly ? 0 : responsiveStyles.componentPadding,
            borderRadius: iconOnly ? responsiveStyles.buttonBorderRadius : responsiveStyles.buttonBorderRadius,
          },
          text: {
            ...theme.textStyles.button,
            fontSize: Math.round(theme.textStyles.button.fontSize * responsiveStyles.fontScale),
          },
          iconSize: Math.round(theme.typography.fontSize.lg * responsiveStyles.fontScale),
          hitSlop: 0,
        };
      }
    }
  };

  const sizeStyles = getSizeStyles();
  const backgroundColor = getBackgroundColor();
  const textColor = getTextColor();
  const borderColor = getBorderColor();

  // Determine if gradient should be used
  const shouldUseGradient = useGradient && variant === 'primary' && !isDisabled;

  // Get colored shadow for elevated buttons
  const getColoredShadow = (): ViewStyle => {
    if (!elevated || isDisabled) return {};

    switch (variant) {
      case 'primary':
        return theme.coloredShadows?.primary || {};
      case 'danger':
        return theme.coloredShadows?.warning || {};
      default:
        return {};
    }
  };

  // For icon-only buttons, make width equal to height for square/circular shape
  const iconOnlyStyles: ViewStyle = iconOnly
    ? {
        width: sizeStyles.container.height,
        paddingHorizontal: 0,
      }
    : {};

  const coloredShadow = getColoredShadow();

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator
          color={textColor}
          size="small"
          testID={testID ? `${testID}-loading` : undefined}
        />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Text
              style={[
                styles.icon,
                {
                  color: textColor,
                  marginRight: iconOnly || !title ? 0 : theme.spacing.sm,
                  fontSize: sizeStyles.iconSize,
                },
              ]}
            >
              {icon}
            </Text>
          )}
          {!iconOnly && title && (
            <Text
              style={[
                styles.text,
                sizeStyles.text,
                { color: textColor },
              ]}
            >
              {title}
            </Text>
          )}
        </View>
      )}
    </>
  );

  const baseButtonStyle: ViewStyle[] = [
    styles.container,
    sizeStyles.container,
    {
      backgroundColor: shouldUseGradient ? 'transparent' : backgroundColor,
      borderColor: borderColor,
      borderWidth: borderColor ? 1.5 : 0,
    },
    iconOnlyStyles,
    fullWidth && styles.fullWidth,
  ];

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, coloredShadow]}>
      <TouchableOpacity
        style={baseButtonStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{
          disabled: isDisabled,
          busy: loading,
        }}
        hitSlop={sizeStyles.hitSlop > 0 ? {
          top: sizeStyles.hitSlop,
          bottom: sizeStyles.hitSlop,
          left: sizeStyles.hitSlop,
          right: sizeStyles.hitSlop,
        } : undefined}
        testID={testID}
      >
        {shouldUseGradient ? (
          <LinearGradient
            colors={theme.gradients?.primary || ['#2E7D32', '#4CAF50']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.gradient,
              {
                borderRadius: sizeStyles.container.borderRadius,
              },
            ]}
            testID={testID ? `${testID}-gradient` : undefined}
          >
            {buttonContent}
          </LinearGradient>
        ) : (
          buttonContent
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    // marginRight and fontSize are set dynamically via theme
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});

export default Button;

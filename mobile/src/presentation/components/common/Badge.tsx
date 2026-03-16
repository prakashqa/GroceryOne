/**
 * Badge Component
 * Reusable badge/chip for labels, counts, and status indicators
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';
import { Icon, IconName } from './Icon';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'muted';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  icon?: IconName;
  testID?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = false,
  icon,
  testID,
}) => {
  const theme = useTheme();
  const responsiveStyles = useResponsiveStyles();

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'success':
        return {
          container: {
            backgroundColor: `${theme.colors.success}15`,
          },
          text: {
            color: theme.colors.success,
          },
        };
      case 'warning':
        return {
          container: {
            backgroundColor: `${theme.colors.warning}15`,
          },
          text: {
            color: theme.colors.warning,
          },
        };
      case 'error':
        return {
          container: {
            backgroundColor: `${theme.colors.error}15`,
          },
          text: {
            color: theme.colors.error,
          },
        };
      case 'info':
        return {
          container: {
            backgroundColor: `${theme.colors.info}15`,
          },
          text: {
            color: theme.colors.info,
          },
        };
      case 'muted':
        return {
          container: {
            backgroundColor: theme.colors.border,
          },
          text: {
            color: theme.colors.textSecondary,
          },
        };
      case 'primary':
      default:
        return {
          container: {
            backgroundColor: theme.colors.inCartBackground,
          },
          text: {
            color: theme.colors.primary,
          },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle; iconSize: 'sm' | 'md' } => {
    // Minimum sizes for touch-friendliness (though badges are usually non-interactive)
    const minHeight = size === 'sm' ? 20 : 24;
    const minWidth = size === 'sm' ? 20 : 24;

    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: Math.round(6 * responsiveStyles.fontScale),
            paddingVertical: Math.round(2 * responsiveStyles.fontScale),
            minHeight,
            minWidth,
          },
          text: {
            fontSize: Math.round(theme.typography.fontSize.xs * responsiveStyles.fontScale),
          },
          iconSize: 'sm',
        };
      case 'md':
      default:
        return {
          container: {
            paddingHorizontal: Math.round(theme.spacing.sm * responsiveStyles.fontScale),
            paddingVertical: Math.round(theme.spacing.xs * responsiveStyles.fontScale),
            minHeight,
            minWidth,
          },
          text: {
            fontSize: Math.round(theme.typography.fontSize.sm * responsiveStyles.fontScale),
          },
          iconSize: 'sm',
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: rounded ? theme.borderRadius.full : theme.borderRadius.sm,
        },
        variantStyles.container,
        sizeStyles.container,
      ]}
      testID={testID}
    >
      {icon && (
        <View style={styles.iconContainer}>
          <Icon
            name={icon}
            size={sizeStyles.iconSize}
            color={(variant === 'primary' ? 'primary' : variant === 'muted' ? 'secondary' : variant) as any}
          />
        </View>
      )}
      <Text
        style={[
          styles.text,
          variantStyles.text,
          sizeStyles.text,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});

export default Badge;

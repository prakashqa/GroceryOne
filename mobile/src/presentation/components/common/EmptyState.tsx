/**
 * EmptyState Component
 * Displays a consistent empty state message with optional action
 * Supports entrance animations and custom illustrations
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';
import { Icon, IconName } from './Icon';
import { Button } from './Button';

export interface SecondaryAction {
  label: string;
  onPress: () => void;
}

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  testID?: string;
  /**
   * Enable entrance animation (fade + scale)
   * @default true
   */
  animated?: boolean;
  /**
   * Custom illustration component to display instead of icon
   */
  illustration?: React.ReactNode;
  /**
   * Secondary action button (ghost variant)
   */
  secondaryAction?: SecondaryAction;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  compact = false,
  testID,
  animated = true,
  illustration,
  secondaryAction,
}) => {
  const theme = useTheme();
  const responsiveStyles = useResponsiveStyles();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const scaleAnim = useRef(new Animated.Value(animated ? 0.9 : 1)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: theme.animation?.normal || 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          speed: 50,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, fadeAnim, scaleAnim, theme.animation]);

  // Responsive sizing
  const iconContainerSize = compact ? 64 : 80;
  const scaledIconContainerSize = Math.round(iconContainerSize * responsiveStyles.fontScale);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          padding: compact ? theme.spacing.lg : theme.spacing.xl,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      testID={testID}
    >
      {illustration ? (
        <View style={[styles.illustrationContainer, { marginBottom: compact ? theme.spacing.md : theme.spacing.lg }]}>
          {illustration}
        </View>
      ) : (
        <View
          style={[
            styles.iconContainer,
            {
              width: scaledIconContainerSize,
              height: scaledIconContainerSize,
              borderRadius: scaledIconContainerSize / 2,
              backgroundColor: `${theme.colors.iconSecondary}15`,
              marginBottom: compact ? theme.spacing.md : theme.spacing.lg,
            },
          ]}
        >
          <Icon
            name={icon}
            size={compact ? 'lg' : 'xl'}
            color="secondary"
          />
        </View>
      )}

      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: Math.round((compact ? theme.typography.fontSize.lg : theme.typography.fontSize.xl) * responsiveStyles.fontScale),
            marginBottom: subtitle ? theme.spacing.sm : 0,
          },
        ]}
      >
        {title}
      </Text>

      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.textSecondary,
              fontSize: Math.round(theme.typography.fontSize.md * responsiveStyles.fontScale),
              marginBottom: (actionLabel || secondaryAction) ? theme.spacing.lg : 0,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size={compact ? 'sm' : 'md'}
          testID={testID ? `${testID}-action` : undefined}
        />
      )}

      {secondaryAction && (
        <Button
          title={secondaryAction.label}
          onPress={secondaryAction.onPress}
          variant="ghost"
          size={compact ? 'sm' : 'md'}
          testID={testID ? `${testID}-secondary-action` : undefined}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmptyState;

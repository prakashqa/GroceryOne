/**
 * Skeleton Component
 * Shimmer loading placeholder for content that is loading
 * Includes preset components for common UI patterns
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: DimensionValue;
  height?: DimensionValue;
  style?: ViewStyle;
  testID?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width = '100%',
  height,
  style,
  testID,
}) => {
  const theme = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [shimmerAnim]);

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'text':
        return {
          height: height || 16,
          borderRadius: theme.borderRadius.xs,
        };
      case 'circular':
        return {
          borderRadius: theme.borderRadius.full,
        };
      case 'rectangular':
      default:
        return {
          height: height || 100,
          borderRadius: theme.borderRadius.sm,
        };
    }
  };

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          backgroundColor: theme.colors.border,
          opacity,
        },
        getVariantStyles(),
        style,
      ]}
      testID={testID}
    />
  );
};

export interface SkeletonListItemProps {
  hasAvatar?: boolean;
  hasSecondary?: boolean;
  hasAction?: boolean;
  testID?: string;
}

export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
  hasAvatar = true,
  hasSecondary = true,
  hasAction = true,
  testID,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.listItem,
        {
          padding: theme.spacing.md,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.sm,
        },
      ]}
      testID={testID}
    >
      <View style={styles.listItemContent}>
        {hasAvatar && (
          <Skeleton
            variant="circular"
            width={48}
            height={48}
            style={{ marginRight: theme.spacing.md }}
          />
        )}
        <View style={styles.listItemText}>
          <Skeleton
            variant="text"
            width="70%"
            height={16}
            style={{ marginBottom: hasSecondary ? theme.spacing.sm : 0 }}
          />
          {hasSecondary && (
            <Skeleton variant="text" width="50%" height={12} />
          )}
        </View>
        {hasAction && (
          <Skeleton
            variant="rectangular"
            width={32}
            height={32}
            style={{ borderRadius: theme.borderRadius.sm }}
          />
        )}
      </View>
    </View>
  );
};

/**
 * SkeletonCard - Card loading placeholder
 */
export interface SkeletonCardProps {
  hasAction?: boolean;
  testID?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasAction = false,
  testID,
}) => {
  const theme = useTheme();
  const responsiveStyles = useResponsiveStyles();

  return (
    <View
      style={[
        styles.card,
        {
          padding: responsiveStyles.componentPadding,
          backgroundColor: theme.colors.surface,
          borderRadius: responsiveStyles.cardBorderRadius,
        },
        theme.shadows?.sm,
      ]}
      testID={testID}
    >
      <Skeleton
        variant="text"
        width="60%"
        height={20}
        style={{ marginBottom: theme.spacing.sm }}
      />
      <Skeleton
        variant="text"
        width="90%"
        height={14}
        style={{ marginBottom: theme.spacing.xs }}
      />
      <Skeleton
        variant="text"
        width="75%"
        height={14}
        style={{ marginBottom: hasAction ? theme.spacing.md : 0 }}
      />
      {hasAction && (
        <Skeleton
          variant="rectangular"
          width={100}
          height={36}
          style={{ borderRadius: theme.borderRadius.sm }}
        />
      )}
    </View>
  );
};

/**
 * SkeletonSummaryCard - Dashboard summary card skeleton
 */
export interface SkeletonSummaryCardProps {
  testID?: string;
}

export const SkeletonSummaryCard: React.FC<SkeletonSummaryCardProps> = ({
  testID,
}) => {
  const theme = useTheme();
  const responsiveStyles = useResponsiveStyles();

  return (
    <View
      style={[
        styles.summaryCard,
        {
          padding: responsiveStyles.componentPadding,
          backgroundColor: theme.colors.surface,
          borderRadius: responsiveStyles.cardBorderRadius,
        },
        theme.shadows?.sm,
      ]}
      testID={testID}
    >
      <View style={styles.summaryCardContent}>
        <Skeleton
          variant="circular"
          width={responsiveStyles.iconContainerSize}
          height={responsiveStyles.iconContainerSize}
          style={{ marginRight: theme.spacing.md }}
        />
        <View style={styles.summaryCardText}>
          <Skeleton
            variant="text"
            width={80}
            height={28}
            style={{ marginBottom: theme.spacing.xs }}
          />
          <Skeleton variant="text" width={60} height={14} />
        </View>
      </View>
    </View>
  );
};

/**
 * SkeletonProductItem - Product list item skeleton
 */
export interface SkeletonProductItemProps {
  testID?: string;
}

export const SkeletonProductItem: React.FC<SkeletonProductItemProps> = ({
  testID,
}) => {
  const theme = useTheme();
  const responsiveStyles = useResponsiveStyles();

  return (
    <View
      style={[
        styles.productItem,
        {
          padding: responsiveStyles.componentPadding,
          backgroundColor: theme.colors.surface,
          borderRadius: responsiveStyles.cardBorderRadius,
        },
        theme.shadows?.sm,
      ]}
      testID={testID}
    >
      <Skeleton
        variant="rectangular"
        width={60}
        height={60}
        style={{ borderRadius: theme.borderRadius.sm, marginRight: theme.spacing.md }}
      />
      <View style={styles.productItemText}>
        <Skeleton
          variant="text"
          width="80%"
          height={16}
          style={{ marginBottom: theme.spacing.sm }}
        />
        <Skeleton variant="text" width="50%" height={14} />
      </View>
      <Skeleton
        variant="rectangular"
        width={36}
        height={36}
        style={{ borderRadius: theme.borderRadius.sm }}
      />
    </View>
  );
};

/**
 * SkeletonCategoryChip - Category chip skeleton
 */
export interface SkeletonCategoryChipProps {
  testID?: string;
}

export const SkeletonCategoryChip: React.FC<SkeletonCategoryChipProps> = ({
  testID,
}) => {
  const theme = useTheme();

  return (
    <Skeleton
      variant="rectangular"
      width={80}
      height={32}
      style={{ borderRadius: theme.borderRadius.lg, marginRight: theme.spacing.sm }}
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  listItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemText: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 12,
  },
  summaryCard: {
    marginBottom: 12,
  },
  summaryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCardText: {
    flex: 1,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productItemText: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default Skeleton;

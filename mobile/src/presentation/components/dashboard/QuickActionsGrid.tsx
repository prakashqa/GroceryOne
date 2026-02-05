/**
 * QuickActionsGrid Component
 * Displays a 2x2 grid of quick action buttons with staggered animations
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Animated,
} from 'react-native';
import { useTheme, useIsDarkMode } from '../../theme';
import { useDeviceType, useResponsiveStyles } from '../../../hooks';

export interface QuickAction {
  /**
   * Unique identifier for the action
   */
  id: string;
  /**
   * Action title
   */
  title: string;
  /**
   * Short description of the action
   */
  subtitle: string;
  /**
   * Icon name or emoji
   */
  icon: string;
  /**
   * Callback when action is pressed
   */
  onPress: () => void;
  /**
   * Whether this is the primary/featured action
   */
  isPrimary?: boolean;
}

interface QuickActionsGridProps {
  /**
   * Array of actions to display
   */
  actions: QuickAction[];
  /**
   * Test ID for testing
   */
  testID?: string;
  /**
   * Custom container style
   */
  style?: ViewStyle;
}

// Icon mapping for common action types
const iconEmojis: Record<string, string> = {
  cart: '🛒',
  camera: '📷',
  list: '📋',
  box: '📦',
  settings: '⚙️',
  scan: '📷',
  resume: '▶️',
  report: '📊',
};

interface ActionItemProps {
  action: QuickAction;
  index: number;
  cardBgColor: string;
  primaryBgColor: string;
  theme: ReturnType<typeof useTheme>;
  responsiveStyles: ReturnType<typeof useResponsiveStyles>;
}

const ActionItem: React.FC<ActionItemProps> = ({
  action,
  index,
  cardBgColor,
  primaryBgColor,
  theme,
  responsiveStyles,
}) => {
  const icon = iconEmojis[action.icon] || action.icon;
  const isPrimary = action.isPrimary || action.id === 'new-cart';

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Staggered entrance animation
  useEffect(() => {
    const delay = index * 50; // 50ms delay between each item
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: theme.animation.normal,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: theme.animation.normal,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index, theme.animation.normal]);

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

  // Dynamic responsive styles
  const dynamicStyles = {
    actionItem: {
      borderRadius: responsiveStyles.cardBorderRadius,
      padding: responsiveStyles.componentPadding,
    },
    iconContainer: {
      width: responsiveStyles.iconContainerSize,
      height: responsiveStyles.iconContainerSize,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    icon: {
      fontSize: Math.round(responsiveStyles.iconSize * 0.9),
    },
    primaryIcon: {
      fontSize: responsiveStyles.iconSize,
    },
    title: {
      fontSize: Math.round(theme.typography.fontSize.lg * responsiveStyles.fontScale * 0.95),
      fontWeight: theme.typography.fontWeight.bold as '700',
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: Math.round(theme.typography.fontSize.sm * responsiveStyles.fontScale),
      fontWeight: theme.typography.fontWeight.medium as '500',
    },
  };

  return (
    <TouchableOpacity
      key={action.id}
      onPress={action.onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      testID={`quick-action-${action.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${action.title}: ${action.subtitle}`}
      style={styles.touchable}
    >
      <Animated.View
        style={[
          styles.actionItem,
          dynamicStyles.actionItem,
          {
            backgroundColor: isPrimary ? primaryBgColor : cardBgColor,
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
          theme.shadows.sm,
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            dynamicStyles.iconContainer,
            {
              backgroundColor: isPrimary
                ? `${theme.colors.primary}30`
                : `${theme.colors.primary}15`,
            },
          ]}
        >
          <Text style={isPrimary ? dynamicStyles.primaryIcon : dynamicStyles.icon}>{icon}</Text>
        </View>
        <Text
          style={[
            dynamicStyles.title,
            { color: isPrimary ? theme.colors.buttonPrimaryText : theme.colors.text },
          ]}
          numberOfLines={1}
        >
          {action.title}
        </Text>
        <Text
          style={[
            dynamicStyles.subtitle,
            {
              color: isPrimary
                ? `${theme.colors.buttonPrimaryText}CC`
                : theme.colors.textSecondary,
            },
          ]}
          numberOfLines={1}
        >
          {action.subtitle}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

interface PrimaryActionButtonProps {
  action: QuickAction;
  index: number;
  primaryBgColor: string;
  theme: ReturnType<typeof useTheme>;
  responsiveStyles: ReturnType<typeof useResponsiveStyles>;
}

/**
 * Full-width primary action button at the bottom of the grid
 * Optimized for single-hand (thumb) usage
 */
const PrimaryActionButton: React.FC<PrimaryActionButtonProps> = ({
  action,
  index,
  primaryBgColor,
  theme,
  responsiveStyles,
}) => {
  const icon = iconEmojis[action.icon] || action.icon;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Staggered entrance animation
  useEffect(() => {
    const delay = index * 50;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: theme.animation.normal,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: theme.animation.normal,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index, theme.animation.normal]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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

  // Dynamic responsive styles for primary button (reduced by 20%)
  const sizeScale = 0.8; // 20% reduction
  const dynamicStyles = {
    primaryButton: {
      borderRadius: Math.round((responsiveStyles.cardBorderRadius + 2) * sizeScale),
      padding: Math.round(responsiveStyles.componentPadding * sizeScale),
      minHeight: Math.round((responsiveStyles.touchTargetMinSize + 24) * sizeScale),
    },
    primaryIconContainer: {
      width: Math.round((responsiveStyles.iconContainerSize + 4) * sizeScale),
      height: Math.round((responsiveStyles.iconContainerSize + 4) * sizeScale),
      borderRadius: Math.round(responsiveStyles.cardBorderRadius * sizeScale),
      marginRight: Math.round(theme.spacing.md * sizeScale),
    },
    primaryButtonIcon: {
      fontSize: Math.round(responsiveStyles.iconSize * sizeScale),
    },
    primaryTitle: {
      fontSize: Math.round(theme.typography.fontSize.xl * responsiveStyles.fontScale * 0.95 * sizeScale),
      fontWeight: theme.typography.fontWeight.bold as '700',
      marginBottom: Math.round((theme.spacing.xs / 2) * sizeScale),
    },
    primarySubtitle: {
      fontSize: Math.round(theme.typography.fontSize.md * responsiveStyles.fontScale * sizeScale),
      fontWeight: theme.typography.fontWeight.medium as '500',
    },
  };

  return (
    <TouchableOpacity
      onPress={action.onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      testID={`quick-action-${action.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${action.title}: ${action.subtitle}`}
    >
      <Animated.View
        style={[
          styles.primaryButton,
          dynamicStyles.primaryButton,
          {
            backgroundColor: primaryBgColor,
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
          theme.shadows.md,
        ]}
      >
        <View
          style={[
            styles.primaryIconContainer,
            dynamicStyles.primaryIconContainer,
            { backgroundColor: `${theme.colors.primary}40` },
          ]}
        >
          <Text style={dynamicStyles.primaryButtonIcon}>{icon}</Text>
        </View>
        <View style={styles.primaryTextContainer}>
          <Text
            style={[
              dynamicStyles.primaryTitle,
              { color: theme.colors.buttonPrimaryText },
            ]}
          >
            {action.title}
          </Text>
          <Text
            style={[
              dynamicStyles.primarySubtitle,
              { color: `${theme.colors.buttonPrimaryText}CC` },
            ]}
          >
            {action.subtitle}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
  actions,
  testID,
  style,
}) => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { isTablet } = useDeviceType();
  const responsiveStyles = useResponsiveStyles();

  const cardBgColor = isDarkMode ? theme.colors.card : theme.colors.surface;
  const primaryBgColor = theme.colors.buttonPrimary;

  // Separate primary action (rendered full-width at bottom) from regular actions
  const primaryAction = actions.find(a => a.isPrimary);
  const regularActions = actions.filter(a => !a.isPrimary);

  // On tablets, show all regular actions in one row; on phones, split into 2 rows
  const itemsPerRow = isTablet ? Math.min(regularActions.length, 4) : 2;
  const rows: QuickAction[][] = [];

  for (let i = 0; i < regularActions.length; i += itemsPerRow) {
    rows.push(regularActions.slice(i, i + itemsPerRow));
  }

  return (
    <View style={[styles.container, { gap: responsiveStyles.gridGap }, style]} testID={testID}>
      {/* Regular action rows */}
      {rows.map((rowActions, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { gap: responsiveStyles.gridGap }]}>
          {rowActions.map((action, index) => (
            <ActionItem
              key={action.id}
              action={action}
              index={rowIndex * itemsPerRow + index}
              cardBgColor={cardBgColor}
              primaryBgColor={primaryBgColor}
              theme={theme}
              responsiveStyles={responsiveStyles}
            />
          ))}
        </View>
      ))}
      {/* Primary action - full width at bottom for thumb accessibility */}
      {primaryAction && (
        <PrimaryActionButton
          action={primaryAction}
          index={regularActions.length}
          primaryBgColor={primaryBgColor}
          theme={theme}
          responsiveStyles={responsiveStyles}
        />
      )}
    </View>
  );
};

// Base styles - dynamic values are applied inline for responsiveness
const styles = StyleSheet.create({
  container: {
    // gap is applied dynamically
  },
  row: {
    flexDirection: 'row',
    // gap is applied dynamically
  },
  touchable: {
    flex: 1,
  },
  actionItem: {
    flex: 1,
    // borderRadius, padding applied dynamically
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // width, height, borderRadius, marginBottom applied dynamically
  },
  // Full-width primary button styles
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // borderRadius, padding, minHeight applied dynamically
  },
  primaryIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // width, height, borderRadius, marginRight applied dynamically
  },
  primaryTextContainer: {
    flex: 1,
  },
});

export default QuickActionsGrid;

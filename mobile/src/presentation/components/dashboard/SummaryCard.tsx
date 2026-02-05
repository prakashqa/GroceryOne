/**
 * SummaryCard Component
 * Displays a single metric card for the dashboard with subtle animations
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useTheme, useIsDarkMode } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';

type ColorVariant = 'primary' | 'success' | 'warning' | 'info';

interface SummaryCardProps {
  /**
   * Card title (label)
   */
  title: string;
  /**
   * The main value to display
   */
  value: string | number;
  /**
   * Optional subtitle text
   */
  subtitle?: string;
  /**
   * Optional icon name (emoji or icon component)
   */
  icon?: string;
  /**
   * Color variant for the card accent
   */
  colorVariant?: ColorVariant;
  /**
   * Test ID for testing
   */
  testID?: string;
  /**
   * Custom container style
   */
  style?: ViewStyle;
  /**
   * Optional press handler
   */
  onPress?: () => void;
  /**
   * Animation delay for staggered entrance (in milliseconds)
   */
  animationDelay?: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  colorVariant = 'primary',
  testID,
  style,
  onPress,
  animationDelay = 0,
}) => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const responsiveStyles = useResponsiveStyles();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  // Fade in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: theme.animation.normal,
        delay: animationDelay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: theme.animation.normal,
        delay: animationDelay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, animationDelay, theme.animation.normal]);

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const getAccentColor = (): string => {
    switch (colorVariant) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'info':
        return theme.colors.info;
      default:
        return theme.colors.primary;
    }
  };

  const getIconBgColor = (): string => {
    const accentColor = getAccentColor();
    // Slightly more visible background for icon
    return isDarkMode ? `${accentColor}25` : `${accentColor}15`;
  };

  const accentColor = getAccentColor();
  const cardBgColor = isDarkMode ? theme.colors.card : theme.colors.surface;
  const iconBgColor = getIconBgColor();

  // Responsive dynamic styles
  const dynamicStyles = {
    container: {
      borderRadius: responsiveStyles.cardBorderRadius,
      padding: responsiveStyles.componentPadding,
      minWidth: responsiveStyles.cardMinWidth,
    },
    iconContainer: {
      width: responsiveStyles.iconContainerSize,
      height: responsiveStyles.iconContainerSize,
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.sm,
    },
    icon: {
      fontSize: responsiveStyles.iconSize * 0.85,
    },
    value: {
      fontSize: Math.round(theme.textStyles.h2.fontSize * responsiveStyles.fontScale),
      fontWeight: theme.textStyles.h2.fontWeight as '700',
      letterSpacing: theme.textStyles.h2.letterSpacing,
    },
    valuePrefix: {
      fontSize: Math.round(theme.typography.fontSize.lg * responsiveStyles.fontScale),
      fontWeight: theme.typography.fontWeight.medium as '500',
    },
    title: {
      fontSize: Math.round(theme.typography.fontSize.sm * responsiveStyles.fontScale),
      fontWeight: theme.typography.fontWeight.semibold as '600',
    },
  };

  const cardContent = (
    <Animated.View
      style={[
        styles.container,
        dynamicStyles.container,
        {
          backgroundColor: cardBgColor,
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
        theme.shadows.sm,
        style,
      ]}
      testID={testID}
      accessibilityLabel={`${title}: ${value}`}
      accessibilityRole="text"
    >
      {icon && (
        <View
          style={[
            styles.iconContainer,
            dynamicStyles.iconContainer,
            { backgroundColor: iconBgColor },
          ]}
        >
          <Text style={dynamicStyles.icon}>{icon}</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text
          style={[
            styles.value,
            dynamicStyles.value,
            { color: theme.colors.text },
          ]}
          numberOfLines={1}
        >
          {subtitle && (
            <Text
              style={[
                dynamicStyles.valuePrefix,
                { color: theme.colors.textSecondary, marginRight: theme.spacing.xs },
              ]}
            >
              {subtitle}
            </Text>
          )}
          {String(value)}
        </Text>
        <Text
          style={[
            styles.title,
            dynamicStyles.title,
            { color: theme.colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
      {/* Gradient-style accent bar */}
      <View style={styles.accentBarContainer}>
        <View
          style={[
            styles.accentBar,
            { backgroundColor: accentColor },
          ]}
        />
        <View
          style={[
            styles.accentBarGlow,
            { backgroundColor: accentColor, opacity: theme.opacity.muted },
          ]}
        />
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.touchable}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

// Base styles - dynamic values are applied inline for responsiveness
const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  container: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  value: {
    marginBottom: 4,
  },
  title: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accentBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  accentBarGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
  },
});

export default SummaryCard;

/**
 * FadeInView Component
 * Reusable entrance animation wrapper for consistent screen transitions
 */

import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme';

interface FadeInViewProps {
  /**
   * Delay before animation starts (in milliseconds)
   */
  delay?: number;
  /**
   * Duration of the fade animation (in milliseconds)
   */
  duration?: number;
  /**
   * Children to render with fade animation
   */
  children: React.ReactNode;
  /**
   * Optional custom style for the container
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Test ID for testing
   */
  testID?: string;
  /**
   * Direction of the slide-in animation
   * - 'up': Slides from below
   * - 'down': Slides from above
   * - 'none': No slide, just fade
   */
  direction?: 'up' | 'down' | 'none';
  /**
   * Distance to slide in pixels
   */
  slideDistance?: number;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  delay = 0,
  duration,
  children,
  style,
  testID,
  direction = 'up',
  slideDistance = 20,
}) => {
  const theme = useTheme();
  const animDuration = duration ?? theme.animation.normal;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(
    direction === 'none' ? 0 : direction === 'up' ? slideDistance : -slideDistance
  )).current;

  useEffect(() => {
    const animationConfig = {
      toValue: 1,
      duration: animDuration,
      useNativeDriver: true,
      delay,
    };

    const slideConfig = {
      toValue: 0,
      duration: animDuration,
      useNativeDriver: true,
      delay,
    };

    Animated.parallel([
      Animated.timing(fadeAnim, animationConfig),
      direction !== 'none'
        ? Animated.timing(slideAnim, slideConfig)
        : Animated.timing(slideAnim, { ...slideConfig, toValue: 0 }),
    ]).start();
  }, [fadeAnim, slideAnim, animDuration, delay, direction]);

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default FadeInView;

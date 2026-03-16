/**
 * ListItemAnimator Component
 * Wrapper for FlatList items that provides staggered entrance animations
 */

import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme';
import { getStaggerDelay, MAX_STAGGER_DELAY, STAGGER_DELAY, ANIMATION_PRESETS } from '../../utils/animations';

export type AnimationType = 'fade' | 'slideUp' | 'scale';

export interface ListItemAnimatorProps {
  /**
   * Content to animate
   */
  children: React.ReactNode;
  /**
   * Index of the item in the list (used for stagger calculation)
   */
  index: number;
  /**
   * Maximum delay cap for stagger animation
   * @default 300
   */
  maxDelay?: number;
  /**
   * Type of entrance animation
   * @default 'slideUp'
   */
  animationType?: AnimationType;
  /**
   * Disable animation
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional styles for the wrapper
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * ListItemAnimator wraps list items with staggered entrance animations.
 * Use this component inside FlatList's renderItem to create smooth list animations.
 *
 * @example
 * ```tsx
 * <FlatList
 *   data={items}
 *   renderItem={({ item, index }) => (
 *     <ListItemAnimator index={index}>
 *       <ProductCard product={item} />
 *     </ListItemAnimator>
 *   )}
 * />
 * ```
 */
export const ListItemAnimator: React.FC<ListItemAnimatorProps> = ({
  children,
  index,
  maxDelay = MAX_STAGGER_DELAY,
  animationType = 'slideUp',
  disabled = false,
  style,
  testID,
}) => {
  const theme = useTheme();
  const duration = theme.animation?.normal || ANIMATION_PRESETS.TIMING_NORMAL.duration;

  // Calculate staggered delay
  const delay = getStaggerDelay(index, STAGGER_DELAY, maxDelay);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(disabled ? 1 : 0)).current;
  const translateAnim = useRef(new Animated.Value(disabled ? 0 : 20)).current;
  const scaleAnim = useRef(new Animated.Value(disabled ? 1 : 0.95)).current;

  useEffect(() => {
    if (disabled) return;

    const animations: Animated.CompositeAnimation[] = [];

    // Fade animation (always included)
    animations.push(
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      })
    );

    // Additional animation based on type
    if (animationType === 'slideUp') {
      animations.push(
        Animated.timing(translateAnim, {
          toValue: 0,
          duration,
          delay,
          useNativeDriver: true,
        })
      );
    } else if (animationType === 'scale') {
      animations.push(
        Animated.spring(scaleAnim, {
          toValue: 1,
          speed: 50,
          bounciness: 4,
          delay,
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  }, [disabled, fadeAnim, translateAnim, scaleAnim, delay, duration, animationType]);

  // Build transform array based on animation type
  const getTransform = (): any[] => {
    const transforms: any[] = [];

    if (animationType === 'slideUp') {
      transforms.push({ translateY: translateAnim });
    } else if (animationType === 'scale') {
      transforms.push({ scale: scaleAnim });
    }

    return transforms;
  };

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: getTransform(),
        } as any,
        style,
      ]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
};

export default ListItemAnimator;

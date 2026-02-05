/**
 * Animation Utilities
 * Centralized animation presets and reusable hooks for consistent animations
 */

import { useRef, useEffect, useMemo } from 'react';
import { Animated } from 'react-native';

/**
 * Animation presets for consistent animation behavior across the app
 */
export const ANIMATION_PRESETS = {
  /** Gentle spring animation - good for subtle feedback */
  SPRING_GENTLE: {
    speed: 50,
    bounciness: 4,
  },
  /** Bouncy spring animation - good for playful interactions */
  SPRING_BOUNCY: {
    speed: 40,
    bounciness: 8,
  },
  /** Fast timing animation - 150ms */
  TIMING_FAST: {
    duration: 150,
  },
  /** Normal timing animation - 200ms */
  TIMING_NORMAL: {
    duration: 200,
  },
  /** Slow timing animation - 300ms */
  TIMING_SLOW: {
    duration: 300,
  },
} as const;

/** Base delay between staggered animations in milliseconds */
export const STAGGER_DELAY = 50;

/** Maximum delay for staggered animations to prevent slow page loads */
export const MAX_STAGGER_DELAY = 300;

/**
 * Calculate staggered delay for list items
 * @param index - The index of the item in the list
 * @param baseDelay - Base delay between items (default: 50ms)
 * @param maxDelay - Maximum delay cap (default: 300ms)
 * @returns Delay in milliseconds
 */
export function getStaggerDelay(
  index: number,
  baseDelay: number = STAGGER_DELAY,
  maxDelay: number = MAX_STAGGER_DELAY
): number {
  return Math.min(index * baseDelay, maxDelay);
}

/**
 * Hook for fade-in animation on mount
 * @param delay - Delay before animation starts (default: 0)
 * @param duration - Animation duration (default: 200ms)
 * @returns Animated.Value for opacity
 */
export function useFadeIn(delay: number = 0, duration: number = ANIMATION_PRESETS.TIMING_NORMAL.duration): Animated.Value {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, delay, duration]);

  return fadeAnim;
}

/**
 * Press handler return type
 */
export interface ScaleOnPressHandlers {
  scaleValue: Animated.Value;
  onPressIn: () => void;
  onPressOut: () => void;
}

/**
 * Hook for scale animation on press
 * @param scaleValue - Scale factor when pressed (default: 0.96)
 * @returns Object with animated value and press handlers
 */
export function useScaleOnPress(scaleValue: number = 0.96): ScaleOnPressHandlers {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scaleValue,
      useNativeDriver: true,
      ...ANIMATION_PRESETS.SPRING_GENTLE,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...ANIMATION_PRESETS.SPRING_GENTLE,
    }).start();
  };

  return {
    scaleValue: scaleAnim,
    onPressIn,
    onPressOut,
  };
}

/**
 * Hook for staggered entrance animations for list items
 * @param count - Number of items to animate
 * @param baseDelay - Base delay between items (default: 50ms)
 * @returns Array of Animated.Values for opacity
 */
export function useStaggeredEntrance(
  count: number,
  baseDelay: number = STAGGER_DELAY
): Animated.Value[] {
  const animatedValues = useRef<Animated.Value[]>([]).current;

  // Create animated values for each item
  const values = useMemo(() => {
    // Clear and recreate if count changes
    animatedValues.length = 0;
    for (let i = 0; i < count; i++) {
      animatedValues.push(new Animated.Value(0));
    }
    return animatedValues;
  }, [count, animatedValues]);

  useEffect(() => {
    if (count === 0) return;

    const animations = values.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: ANIMATION_PRESETS.TIMING_NORMAL.duration,
        delay: getStaggerDelay(index, baseDelay),
        useNativeDriver: true,
      })
    );

    Animated.parallel(animations).start();
  }, [values, count, baseDelay]);

  return values;
}

export default {
  ANIMATION_PRESETS,
  STAGGER_DELAY,
  MAX_STAGGER_DELAY,
  getStaggerDelay,
  useFadeIn,
  useScaleOnPress,
  useStaggeredEntrance,
};

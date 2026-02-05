/**
 * AnimatedPressable Component
 * A reusable wrapper component that provides spring press animation
 * for consistent press feedback across the app
 */

import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleProp,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';

export interface AnimatedPressableProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Scale value when pressed (0-1), defaults to 0.96 */
  scaleValue?: number;
  /** Children to render inside the pressable */
  children: React.ReactNode;
  /** Custom styles for the touchable */
  style?: StyleProp<ViewStyle>;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  scaleValue = 0.96,
  style,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  testID,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (event: any) => {
      Animated.spring(scaleAnim, {
        toValue: scaleValue,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();

      onPressIn?.(event);
    },
    [scaleAnim, scaleValue, onPressIn]
  );

  const handlePressOut = useCallback(
    (event: any) => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();

      onPressOut?.(event);
    },
    [scaleAnim, onPressOut]
  );

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={disabled}
        style={style}
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default AnimatedPressable;

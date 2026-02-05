/**
 * FAB (Floating Action Button) Component
 * Standardized floating action button with press animation.
 */

import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from './Icon';

export interface FABProps {
  /** Callback when FAB is pressed */
  onPress: () => void;
  /** Icon name from the Icon component (defaults to 'add') */
  icon?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
  /** Additional style overrides */
  style?: ViewStyle;
}

export const FAB: React.FC<FABProps> = ({
  onPress,
  icon = 'add',
  accessibilityLabel = 'Create new',
  testID,
  style,
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const fabSize = theme.buttonHeights.lg; // 56

  return (
    <Animated.View
      style={[
        styles.container,
        {
          right: theme.spacing.lg,
          bottom: theme.spacing.lg,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: fabSize,
            height: fabSize,
            borderRadius: fabSize / 2,
            backgroundColor: theme.colors.primary,
          },
          theme.shadows.lg,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        testID={testID}
      >
        <Icon name={icon as any} size="lg" color="textInverse" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FAB;

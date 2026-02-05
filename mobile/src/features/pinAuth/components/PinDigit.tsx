/**
 * PinDigit Component
 * Displays a single digit position in PIN input (filled/empty, masked/visible)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../presentation/theme';
import type { PinDigitProps } from '../types/pin.types';

const DIGIT_SIZE = 56;
const DOT_SIZE = 16;

export const PinDigit: React.FC<PinDigitProps> = ({
  filled,
  value,
  secure = true,
  hasError = false,
  testID,
}) => {
  const theme = useTheme();

  const getBorderColor = () => {
    if (hasError) {
      return theme.colors.error;
    }
    if (filled) {
      return theme.colors.primary;
    }
    return theme.colors.border;
  };

  const getBackgroundColor = () => {
    if (filled) {
      return theme.colors.surface;
    }
    return theme.colors.background;
  };

  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={`PIN digit ${filled ? 'filled' : 'empty'}`}
    >
      <View
        testID={`${testID}-container`}
        style={[
          styles.container,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
            borderRadius: DIGIT_SIZE / 2,
          },
        ]}
      >
        {filled && (
          secure ? (
            <View
              testID={`${testID}-dot`}
              style={[
                styles.dot,
                {
                  backgroundColor: hasError ? theme.colors.error : theme.colors.primary,
                },
              ]}
            />
          ) : (
            <Text
              style={[
                styles.text,
                {
                  color: hasError ? theme.colors.error : theme.colors.text,
                  fontSize: theme.typography.fontSize.xxl,
                  fontWeight: theme.typography.fontWeight.semibold,
                },
              ]}
            >
              {value}
            </Text>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: DIGIT_SIZE,
    height: DIGIT_SIZE,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  text: {},
});

export default PinDigit;

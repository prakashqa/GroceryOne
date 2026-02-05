/**
 * PinInput Component
 * Complete PIN input with digit display and keypad
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../../presentation/theme';
import { PinDigit } from './PinDigit';
import { PinKeypad } from './PinKeypad';
import { PIN_CONFIG } from '../constants';
import type { PinInputProps } from '../types/pin.types';

export const PinInput: React.FC<PinInputProps> = ({
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
  secure = true,
  testID,
}) => {
  const theme = useTheme();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Shake animation on error
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error, shakeAnim]);

  const handleDigitPress = (digit: string) => {
    if (disabled) return;
    if (value.length >= PIN_CONFIG.PIN_LENGTH) return;

    const newValue = value + digit;
    onChange(newValue);

    if (newValue.length === PIN_CONFIG.PIN_LENGTH && onComplete) {
      onComplete(newValue);
    }
  };

  const handleBackspace = () => {
    if (disabled) return;
    const newValue = value.slice(0, -1);
    onChange(newValue);
  };

  const renderDigits = () => {
    const digits = [];
    for (let i = 0; i < PIN_CONFIG.PIN_LENGTH; i++) {
      const isFilled = i < value.length;
      const digitValue = isFilled ? value[i] : undefined;

      digits.push(
        <PinDigit
          key={i}
          filled={isFilled}
          value={digitValue}
          secure={secure}
          hasError={!!error}
          testID={`${testID}-digit-${i}`}
        />
      );
    }
    return digits;
  };

  return (
    <View
      testID={testID}
      style={styles.container}
      accessibilityLabel="PIN input"
      accessibilityHint="Enter your 4-digit PIN"
    >
      {/* Digit display */}
      <Animated.View
        style={[
          styles.digitsContainer,
          { transform: [{ translateX: shakeAnim }], gap: theme.spacing.md },
        ]}
      >
        {renderDigits()}
      </Animated.View>

      {/* Error message */}
      {error && (
        <Text
          style={[styles.errorText, { color: theme.colors.error, marginTop: theme.spacing.md, fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.medium }]}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}

      {/* Keypad */}
      <View style={[styles.keypadContainer, { marginTop: theme.spacing.xl }]}>
        <PinKeypad
          onDigitPress={handleDigitPress}
          onBackspace={handleBackspace}
          disabled={disabled}
          testID={`${testID}-keypad`}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  digitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
  keypadContainer: {
    width: '100%',
    alignItems: 'center',
  },
});

export default PinInput;

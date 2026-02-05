/**
 * PinKeypad Component
 * Numeric keypad for PIN entry with 0-9 digits and backspace
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../../presentation/theme';
import type { PinKeypadProps } from '../types/pin.types';

const KEY_SIZE_PORTRAIT = 72;

export function getKeySize(screenWidth: number, screenHeight: number): number {
  const isLandscape = screenWidth > screenHeight;
  return isLandscape ? Math.min(48, Math.floor(screenHeight * 0.1)) : KEY_SIZE_PORTRAIT;
}

interface KeyButtonProps {
  value: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel: string;
  isBackspace?: boolean;
  keySize: number;
}

const KeyButton: React.FC<KeyButtonProps> = ({
  value,
  onPress,
  disabled = false,
  testID,
  accessibilityLabel,
  isBackspace = false,
  keySize,
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.9,
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

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        testID={testID}
        style={[
          {
            width: keySize,
            height: keySize,
            borderRadius: keySize / 2,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            borderWidth: 1,
            backgroundColor: disabled ? theme.colors.disabled : theme.colors.surface,
            borderColor: theme.colors.border,
            marginHorizontal: theme.spacing.sm,
          },
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
      >
        <Text
          style={[
            {
              color: disabled ? theme.colors.textLight : theme.colors.text,
              fontSize: isBackspace ? theme.typography.fontSize.xxl : Math.max(18, keySize * 0.39),
              fontWeight: theme.typography.fontWeight.medium,
            },
          ]}
        >
          {value}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const PinKeypad: React.FC<PinKeypadProps> = ({
  onDigitPress,
  onBackspace,
  disabled = false,
  testID,
}) => {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const keySize = getKeySize(width, height);

  // Keypad layout: 3x4 grid
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'backspace'],
  ];

  const renderKey = (key: string, rowIndex: number, keyIndex: number) => {
    if (key === '') {
      // Empty space
      return <View key={`empty-${rowIndex}-${keyIndex}`} style={{ width: keySize, height: keySize, marginHorizontal: theme.spacing.sm }} />;
    }

    if (key === 'backspace') {
      return (
        <KeyButton
          key="backspace"
          value="⌫"
          onPress={onBackspace}
          disabled={disabled}
          testID={testID ? `${testID}-backspace` : 'keypad-backspace'}
          accessibilityLabel="delete last digit"
          isBackspace
          keySize={keySize}
        />
      );
    }

    return (
      <KeyButton
        key={key}
        value={key}
        onPress={() => onDigitPress(key)}
        disabled={disabled}
        testID={testID ? `${testID}-key-${key}` : `keypad-key-${key}`}
        accessibilityLabel={`digit ${key}`}
        keySize={keySize}
      />
    );
  };

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          testID={testID ? `${testID}-row-${rowIndex}` : `keypad-row-${rowIndex}`}
          style={[styles.row, { marginBottom: theme.spacing.sm }]}
        >
          {row.map((key, keyIndex) => renderKey(key, rowIndex, keyIndex))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default PinKeypad;

/**
 * Input Component
 * Enhanced text input with focus states, error handling, character count, and clear button
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  KeyboardTypeOptions,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  icon?: string;
  maxLength?: number;
  autoFocus?: boolean;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  testID?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  selectTextOnFocus?: boolean;
  showClearButton?: boolean;
  /**
   * Show success state with green border and checkmark icon
   * Error state takes precedence over success state
   */
  success?: boolean;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  helperText,
  icon,
  maxLength,
  autoFocus = false,
  multiline = false,
  keyboardType,
  testID,
  onFocus,
  onBlur,
  selectTextOnFocus,
  showClearButton = false,
  success = false,
}) => {
  const theme = useTheme();
  const responsiveStyles = useResponsiveStyles();
  const [isFocused, setIsFocused] = useState(false);
  const borderColorAnim = useRef(new Animated.Value(0)).current;

  // Responsive sizing for clear button (minimum 28px for touch-friendliness)
  const clearButtonSize = Math.max(28, Math.round(20 * responsiveStyles.fontScale));
  // Responsive input height
  const inputVerticalPadding = Math.round((theme.spacing.md - 2) * responsiveStyles.fontScale);

  useEffect(() => {
    Animated.timing(borderColorAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, borderColorAnim]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    onChangeText('');
  };

  const getBorderColor = () => {
    if (error) {
      return theme.colors.error;
    }
    if (success) {
      return theme.colors.success;
    }
    return borderColorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.border, theme.colors.inputFocus],
    });
  };

  const showCharCount = maxLength !== undefined;
  const charCount = value.length;
  const shouldShowClearButton = showClearButton && value.length > 0;
  const shouldShowSuccess = success && !error;

  return (
    <View style={styles.container} testID={testID}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: error ? theme.colors.error : theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.md,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <Animated.View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: getBorderColor(),
            borderRadius: responsiveStyles.buttonBorderRadius,
            paddingHorizontal: responsiveStyles.componentPadding,
          },
        ]}
      >
        {icon && (
          <Text
            style={[
              styles.icon,
              {
                color: theme.colors.textLight,
                marginRight: theme.spacing.md - theme.spacing.xs,
                fontSize: Math.round(theme.typography.fontSize.xl * responsiveStyles.fontScale),
              },
            ]}
          >
            {icon}
          </Text>
        )}

        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: Math.round(theme.typography.fontSize.lg * responsiveStyles.fontScale),
              paddingVertical: inputVerticalPadding,
            },
            multiline && [styles.multilineInput, { paddingTop: inputVerticalPadding }],
            icon && styles.inputWithIcon,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
          multiline={multiline}
          keyboardType={keyboardType}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectTextOnFocus={selectTextOnFocus}
          accessibilityLabel={label}
          testID={testID ? `${testID}-field` : undefined}
        />

        {shouldShowClearButton && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              styles.clearButton,
              {
                backgroundColor: theme.colors.border,
                marginLeft: theme.spacing.sm,
                width: clearButtonSize,
                height: clearButtonSize,
                borderRadius: clearButtonSize / 2,
              },
            ]}
            testID={testID ? `${testID}-clear` : undefined}
            accessibilityLabel="Clear input"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.clearIcon,
                {
                  color: theme.colors.textSecondary,
                  fontSize: Math.round(theme.typography.fontSize.sm * responsiveStyles.fontScale),
                },
              ]}
            >
              ✕
            </Text>
          </TouchableOpacity>
        )}

        {shouldShowSuccess && (
          <View
            style={[
              styles.successIcon,
              {
                backgroundColor: theme.colors.success,
                marginLeft: theme.spacing.sm,
                width: clearButtonSize,
                height: clearButtonSize,
                borderRadius: clearButtonSize / 2,
              },
            ]}
            testID={testID ? `${testID}-success-icon` : undefined}
          >
            <Text
              style={[
                styles.successCheckmark,
                {
                  color: '#FFFFFF',
                  fontSize: Math.round(theme.typography.fontSize.sm * responsiveStyles.fontScale),
                },
              ]}
            >
              ✓
            </Text>
          </View>
        )}

        {showCharCount && (
          <Text
            style={[
              styles.charCount,
              {
                color: charCount === maxLength
                  ? theme.colors.error
                  : theme.colors.textLight,
                fontSize: Math.round(theme.typography.fontSize.sm * responsiveStyles.fontScale),
                marginLeft: theme.spacing.sm,
              },
            ]}
          >
            {charCount}/{maxLength}
          </Text>
        )}
      </Animated.View>

      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              color: error ? theme.colors.error : theme.colors.textLight,
              fontSize: Math.round(theme.typography.fontSize.sm * responsiveStyles.fontScale),
              marginTop: theme.spacing.xs + 2,
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    // borderRadius and paddingHorizontal set dynamically
  },
  icon: {
    // marginRight and fontSize are set dynamically
  },
  input: {
    flex: 1,
    fontWeight: '400',
    // fontSize and paddingVertical set dynamically
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  clearButton: {
    // width, height, borderRadius set dynamically for responsive touch targets
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    fontWeight: '600',
    // fontSize set dynamically
  },
  charCount: {
    // fontSize and marginLeft set dynamically
  },
  helperText: {
    // fontSize and marginTop set dynamically
  },
  successIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheckmark: {
    fontWeight: '700',
  },
});

export default Input;

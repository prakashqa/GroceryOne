/**
 * SettingsRadioGroup Component
 * Radio button group for selecting one option from many
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';

interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: string;
}

interface SettingsRadioGroupProps<T extends string> {
  title?: string;
  options: RadioOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  testID?: string;
}

function SettingsRadioGroup<T extends string>({
  title,
  options,
  selectedValue,
  onSelect,
  testID,
}: SettingsRadioGroupProps<T>) {
  const theme = useTheme();

  return (
    <View testID={testID}>
      {title && (
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              letterSpacing: theme.letterSpacing.wider,
              marginBottom: theme.spacing.sm,
              marginLeft: theme.spacing.xs,
              marginTop: theme.spacing.md,
            },
          ]}
        >
          {title}
        </Text>
      )}
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;
        const isLast = index === options.length - 1;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.divider,
                borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                paddingVertical: theme.spacing.smd + 2,
                paddingHorizontal: theme.spacing.md,
              },
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            testID={testID ? `${testID}-option-${option.value}` : undefined}
          >
            {option.icon && (
              <View style={[styles.iconContainer, { marginRight: theme.spacing.smd }]}>
                <Text style={[styles.icon, { fontSize: theme.typography.fontSize['2xl'] }]}>{option.icon}</Text>
              </View>
            )}

            <View style={[styles.content, { marginRight: theme.spacing.smd }]}>
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.medium,
                  },
                ]}
              >
                {option.label}
              </Text>
              {option.description && (
                <Text
                  style={[
                    styles.description,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.fontSize.sm,
                    },
                  ]}
                >
                  {option.description}
                </Text>
              )}
            </View>

            <View
              style={[
                styles.radio,
                {
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            >
              {isSelected && (
                <View
                  style={[
                    styles.radioInner,
                    {
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    textTransform: 'uppercase',
    // fontWeight, letterSpacing, marginBottom, marginLeft, marginTop applied via theme tokens inline
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingVertical, paddingHorizontal applied via theme tokens inline
    minHeight: 52,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    // marginRight applied via theme.spacing.smd inline
  },
  icon: {
    // fontSize applied via theme.typography.fontSize['2xl'] inline
  },
  content: {
    flex: 1,
    // marginRight applied via theme.spacing.smd inline
  },
  label: {
    // fontWeight applied via theme.typography.fontWeight.medium inline
  },
  description: {
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default SettingsRadioGroup;

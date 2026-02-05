/**
 * SettingsToggle Component
 * Row with a switch toggle for boolean settings
 */

import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useTheme } from '../../theme';

interface SettingsToggleProps {
  label: string;
  description?: string;
  icon?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  testID?: string;
}

// Icon mapping
const ICONS: Record<string, string> = {
  notifications: '🔔',
  sound: '🔊',
  vibration: '📳',
  printer: '🖨️',
  darkMode: '🌙',
};

const SettingsToggle: React.FC<SettingsToggleProps> = ({
  label,
  description,
  icon,
  value,
  onValueChange,
  disabled = false,
  testID,
}) => {
  const theme = useTheme();

  const textColor = disabled ? theme.colors.disabled : theme.colors.text;
  const descriptionColor = disabled
    ? theme.colors.disabled
    : theme.colors.textSecondary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.divider,
          paddingVertical: theme.spacing.smd,
          paddingHorizontal: theme.spacing.md,
        },
      ]}
      testID={testID}
    >
      {icon && (
        <View style={[styles.iconContainer, { marginRight: theme.spacing.smd }]} testID={testID ? `${testID}-icon` : undefined}>
          <Text style={[styles.icon, { fontSize: theme.typography.fontSize['2xl'] }]}>{ICONS[icon] || icon}</Text>
        </View>
      )}

      <View style={[styles.content, { marginRight: theme.spacing.smd }]}>
        <Text
          style={[
            styles.label,
            {
              color: textColor,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.medium,
            },
          ]}
        >
          {label}
        </Text>
        {description && (
          <Text
            style={[
              styles.description,
              {
                color: descriptionColor,
                fontSize: theme.typography.fontSize.sm,
              },
            ]}
          >
            {description}
          </Text>
        )}
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: theme.colors.disabled,
          true: theme.colors.primaryLight,
        }}
        thumbColor={value ? theme.colors.primary : theme.colors.surface}
        ios_backgroundColor={theme.colors.disabled}
        testID={testID ? `${testID}-switch` : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingVertical, paddingHorizontal applied via theme tokens inline
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
});

export default SettingsToggle;

/**
 * SettingsRow Component
 * Tappable row item for settings navigation
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';
import { Icon, IconName } from '../common';

interface SettingsRowProps {
  label: string;
  value?: string;
  icon?: string;
  onPress?: () => void;
  hasChevron?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  testID?: string;
}

// Icon name mapping from settings keys to Icon component names
const ICON_NAME_MAP: Record<string, IconName> = {
  appearance: 'theme',
  language: 'language',
  notifications: 'notification',
  printer: 'printer',
  payment: 'payment',
  about: 'about',
  logout: 'logout',
  settings: 'settings',
  category: 'category',
  items: 'item',
  user: 'user',
  inventory: 'inventory',
};

const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  value,
  icon,
  onPress,
  hasChevron = false,
  disabled = false,
  variant = 'default',
  testID,
}) => {
  const theme = useTheme();
  const responsiveStyles = useResponsiveStyles();

  const textColor =
    variant === 'danger'
      ? theme.colors.error
      : disabled
      ? theme.colors.disabled
      : theme.colors.text;

  const valueColor = disabled
    ? theme.colors.disabled
    : theme.colors.textSecondary;

  // Dynamic responsive styles
  const dynamicStyles = {
    container: {
      paddingVertical: responsiveStyles.componentPadding - 2,
      paddingHorizontal: responsiveStyles.componentPadding,
      minHeight: responsiveStyles.touchTargetMinSize + 4,
    },
    iconContainer: {
      width: Math.round(32 * responsiveStyles.fontScale),
      height: Math.round(32 * responsiveStyles.fontScale),
      marginRight: theme.spacing.md - 4,
    },
    label: {
      fontSize: Math.round(theme.textStyles.body.fontSize * responsiveStyles.fontScale),
    },
    value: {
      fontSize: Math.round(theme.textStyles.bodySmall.fontSize * responsiveStyles.fontScale),
      marginLeft: theme.spacing.sm,
    },
    chevronContainer: {
      marginLeft: theme.spacing.sm,
    },
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        dynamicStyles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.divider,
        },
      ]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      testID={testID}
    >
      {icon && (
        <View style={[styles.iconContainer, dynamicStyles.iconContainer]} testID={testID ? `${testID}-icon` : undefined}>
          <Icon
            name={ICON_NAME_MAP[icon] || 'settings'}
            size="md"
            color={variant === 'danger' ? 'error' : 'secondary'}
          />
        </View>
      )}

      <View style={styles.content}>
        <Text
          style={[
            styles.label,
            dynamicStyles.label,
            { color: textColor, fontWeight: theme.typography.fontWeight.medium },
          ]}
        >
          {label}
        </Text>
      </View>

      {value && (
        <Text
          style={[
            styles.value,
            dynamicStyles.value,
            { color: valueColor },
          ]}
        >
          {value}
        </Text>
      )}

      {hasChevron && (
        <View
          style={[styles.chevronContainer, dynamicStyles.chevronContainer]}
          testID={testID ? `${testID}-chevron` : undefined}
        >
          <Icon name="chevron" size="sm" color="secondary" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    // padding and minHeight set dynamically
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // width, height, marginRight set dynamically
  },
  content: {
    flex: 1,
  },
  label: {
    // fontWeight, fontSize set dynamically via theme tokens
  },
  value: {
    // fontSize and marginLeft set dynamically
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // marginLeft set dynamically
  },
});

export default SettingsRow;

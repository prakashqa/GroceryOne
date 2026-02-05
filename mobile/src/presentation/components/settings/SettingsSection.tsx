/**
 * SettingsSection Component
 * Container component for grouping related settings
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
  testID?: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
  testID,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { marginBottom: theme.spacing.lg }]} testID={testID}>
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
          },
        ]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.content,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
          },
          theme.shadows.sm,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginBottom applied via theme.spacing.lg inline
  },
  title: {
    textTransform: 'uppercase',
    // fontWeight, letterSpacing, marginBottom, marginLeft applied via theme tokens inline
  },
  content: {
    overflow: 'hidden',
  },
});

export default SettingsSection;

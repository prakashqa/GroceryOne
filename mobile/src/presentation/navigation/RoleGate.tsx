/**
 * RoleGate
 *
 * Renders its children only when the current user's role is in the allowed
 * list. Otherwise renders a friendly "Access restricted" fallback.
 *
 * The bottom tab gating in BottomTabNavigator hides Reports from non-admins,
 * but a saved deep link / restored navigation state could still attempt to
 * mount the Reports screen. RoleGate makes that impossible from the UI side.
 * Backend role guards are the real security boundary.
 *
 * Usage:
 *   export default function ReportsScreen() {
 *     return <RoleGate roles={['admin']}>{actualReportsScreen}</RoleGate>;
 *   }
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { selectUserRole } from '../../store/slices/authSlice';
import { useTheme } from '../theme';
import type { User } from '@groceryone/shared';

type Role = NonNullable<User['role']>;

interface RoleGateProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({ roles, children, fallback }) => {
  const role = useSelector(selectUserRole);
  const theme = useTheme();
  const { t } = useTranslation('common');

  if (role && roles.includes(role as Role)) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  // Default fallback: minimal "access restricted" panel
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, padding: theme.spacing.xl },
      ]}
      accessibilityRole="alert"
    >
      <Text style={[styles.icon, { color: theme.colors.warning }]}>⚠️</Text>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginTop: theme.spacing.md,
          },
        ]}
      >
        {t('errors.unauthorized', 'Access restricted')}
      </Text>
      <Text
        style={[
          styles.body,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.md,
            marginTop: theme.spacing.sm,
          },
        ]}
      >
        {t(
          'errors.unauthorizedDescription',
          'This area is only available to the business owner.',
        )}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 56,
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
  },
});

/**
 * EmployeeListScreen
 *
 * Owner-only screen. Lists employees in the current tenant, allows the
 * owner to navigate to "Add employee" and to deactivate existing
 * employees (soft delete — they can no longer PIN-login).
 *
 * Role enforcement: the route is only reachable from the More screen's
 * Employees row, which is hidden for non-admins. Backend additionally
 * returns 403 for non-admin callers.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../presentation/theme';
import {
  Employee,
  useListEmployeesQuery,
  useDeactivateEmployeeMutation,
} from '../api/employeesApi';

// Local navigation typing to avoid a cross-cutting refactor of MoreStackParamList.
type EmployeesStack = {
  EmployeeList: undefined;
  EmployeeCreate: undefined;
};
type NavProp = NativeStackNavigationProp<EmployeesStack>;

export const EmployeeListScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const navigation = useNavigation<NavProp>();

  const { data: employees, isLoading, isFetching, refetch, error } =
    useListEmployeesQuery();
  const [deactivate, { isLoading: isDeactivating }] = useDeactivateEmployeeMutation();

  const handleAdd = useCallback(() => {
    navigation.navigate('EmployeeCreate');
  }, [navigation]);

  const handleDeactivate = useCallback(
    (emp: Employee) => {
      const label = `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || emp.phone;
      Alert.alert(
        t('employees.deactivateConfirmTitle', 'Deactivate employee?'),
        t(
          'employees.confirmDeactivate',
          `${label} will no longer be able to log in. You can recreate them later if needed.`,
        ),
        [
          { text: t('cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('employees.deactivate', 'Deactivate'),
            style: 'destructive',
            onPress: async () => {
              try {
                await deactivate(emp.id).unwrap();
              } catch (e: any) {
                Alert.alert(
                  t('error', 'Error'),
                  e?.data?.message || t('employees.errors.deactivate', 'Could not deactivate employee.'),
                );
              }
            },
          },
        ],
      );
    },
    [deactivate, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: Employee }) => {
      const name = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim();
      const isInactive = item.status !== 'active';
      const isAdminRow = item.role === 'admin';
      return (
        <View
          style={[
            styles.row,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.sm,
              borderRadius: theme.borderRadius.md,
              opacity: isInactive ? 0.5 : 1,
            },
          ]}
        >
          <View style={styles.rowMain}>
            <Text
              style={[
                styles.name,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.md,
                  fontWeight: theme.typography.fontWeight.semibold,
                },
              ]}
            >
              {name || item.phone}
              {isAdminRow ? `  · ${t('employees.ownerTag', 'Owner')}` : ''}
            </Text>
            <Text
              style={[
                styles.meta,
                {
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.sm,
                  marginTop: theme.spacing.xs,
                },
              ]}
            >
              {item.phone}
              {isInactive ? `  · ${t('employees.inactive', 'Inactive')}` : ''}
            </Text>
          </View>

          {!isAdminRow && !isInactive && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => handleDeactivate(item)}
              disabled={isDeactivating}
              style={[
                styles.deactivateBtn,
                {
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  borderColor: theme.colors.error,
                },
              ]}
            >
              <Text style={{ color: theme.colors.error, fontWeight: '600' }}>
                {t('employees.deactivate', 'Deactivate')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [theme, t, handleDeactivate, isDeactivating],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.colors.text === '#1A1A1A' ? 'dark-content' : 'light-content'} />
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
            },
          ]}
        >
          {t('employees.title', 'Employees')}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleAdd}
          style={[
            styles.addBtn,
            {
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: theme.colors.primary,
            },
          ]}
        >
          <Text style={{ color: theme.colors.buttonPrimaryText, fontWeight: '600' }}>
            + {t('employees.add', 'Add')}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={[styles.empty, { padding: theme.spacing.xl }]}>
          <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
            {t('employees.errors.loadFailed', 'Could not load employees. Pull down to retry.')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={employees ?? []}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={[styles.empty, { padding: theme.spacing.xl }]}>
              <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                {t(
                  'employees.empty',
                  'No employees yet. Tap "Add" to create your first one.',
                )}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { flex: 1 },
  addBtn: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowMain: { flex: 1 },
  name: {},
  meta: {},
  deactivateBtn: {
    borderWidth: 1,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

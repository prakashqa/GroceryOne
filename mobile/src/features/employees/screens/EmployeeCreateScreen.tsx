/**
 * EmployeeCreateScreen
 *
 * Form for the owner to add a new employee (cashier role) to the current
 * tenant. tenantId is taken from the caller's JWT server-side — never sent
 * from the client. After success, navigates back so the list refetches via
 * RTK Query invalidation.
 */

import React, { useCallback, useState } from 'react';
import {
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../presentation/theme';
import { useCreateEmployeeMutation } from '../api/employeesApi';

const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
const PIN_REGEX = /^\d{4}$/;

export const EmployeeCreateScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const navigation = useNavigation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [createEmployee, { isLoading }] = useCreateEmployeeMutation();

  const validate = useCallback((): string | null => {
    if (!firstName.trim()) return t('employees.errors.firstNameRequired', 'First name is required');
    if (!PHONE_REGEX.test(phone.trim()))
      return t('employees.errors.invalidPhone', 'Enter a valid phone number (10–15 digits).');
    if (!PIN_REGEX.test(pin))
      return t('employees.errors.invalidPin', 'PIN must be exactly 4 digits.');
    if (pin !== confirmPin)
      return t('employees.errors.pinMismatch', 'PIN and confirmation do not match.');
    return null;
  }, [firstName, phone, pin, confirmPin, t]);

  const handleSubmit = useCallback(async () => {
    const err = validate();
    if (err) {
      Alert.alert(t('error', 'Error'), err);
      return;
    }

    try {
      await createEmployee({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        phone: phone.trim(),
        pin,
      }).unwrap();
      Alert.alert(
        t('employees.created', 'Employee created'),
        t(
          'employees.createdDescription',
          'They can now log in with their phone number and PIN.',
        ),
        [{ text: t('done', 'Done'), onPress: () => navigation.goBack() }],
      );
    } catch (e: any) {
      const status = e?.status;
      const message =
        status === 409
          ? t(
              'employees.errors.duplicatePhone',
              'An employee with this phone number already exists.',
            )
          : e?.data?.message ||
            t('employees.errors.createFailed', 'Could not create employee.');
      Alert.alert(t('error', 'Error'), message);
    }
  }, [validate, createEmployee, firstName, lastName, phone, pin, t, navigation]);

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      color: theme.colors.text,
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      fontSize: theme.typography.fontSize.md,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.colors.text === '#1A1A1A' ? 'dark-content' : 'light-content'} />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          {t('employees.add', 'Add employee')}
        </Text>

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {t('employees.firstName', 'First name')} *
        </Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          style={inputStyle}
          placeholder={t('employees.firstName', 'First name')}
          placeholderTextColor={theme.colors.textLight}
          testID="employee-firstName"
        />

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {t('employees.lastName', 'Last name')}
        </Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          style={inputStyle}
          placeholder={t('employees.lastName', 'Last name')}
          placeholderTextColor={theme.colors.textLight}
          testID="employee-lastName"
        />

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {t('employees.phone', 'Phone')} *
        </Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
          style={inputStyle}
          placeholder="+919999000001"
          placeholderTextColor={theme.colors.textLight}
          testID="employee-phone"
        />

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {t('employees.pin', 'PIN')} *
        </Text>
        <TextInput
          value={pin}
          onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          style={inputStyle}
          placeholder="••••"
          placeholderTextColor={theme.colors.textLight}
          testID="employee-pin"
        />

        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {t('employees.confirmPin', 'Confirm PIN')} *
        </Text>
        <TextInput
          value={confirmPin}
          onChangeText={(v) => setConfirmPin(v.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          style={inputStyle}
          placeholder="••••"
          placeholderTextColor={theme.colors.textLight}
          testID="employee-confirmPin"
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          accessibilityRole="button"
          style={[
            styles.submit,
            {
              backgroundColor: theme.colors.primary,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.sm,
              opacity: isLoading ? 0.6 : 1,
              marginTop: theme.spacing.md,
            },
          ]}
          testID="employee-submit"
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.buttonPrimaryText} />
          ) : (
            <Text
              style={{
                color: theme.colors.buttonPrimaryText,
                fontWeight: '600',
                fontSize: theme.typography.fontSize.md,
                textAlign: 'center',
              }}
            >
              {t('employees.create', 'Create employee')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {},
  label: { fontSize: 13, marginBottom: 4 },
  input: { borderWidth: 1 },
  submit: {},
});

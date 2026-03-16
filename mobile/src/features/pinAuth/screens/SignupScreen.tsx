/**
 * SignupScreen
 * Business registration form for new tenants.
 * Creates tenant + admin user + trial subscription.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../presentation/theme';
import { useAppDispatch } from '../../../core/hooks/useAppDispatch';
import { setTenant } from '../../../store/slices/tenantSlice';
import { setCredentials } from '../../../store/slices/authSlice';
import { PinAuthApi } from '../services/PinAuthApi';
import { PinSecureStorage } from '../services/PinSecureStorage';
import { AuthScreenControls } from '../components/AuthScreenControls';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TENANT_ID_KEY = '@tenant_id';

interface FormErrors {
  businessName?: string;
  ownerFirstName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export const SignupScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation('auth');
  const dispatch = useAppDispatch();

  const [businessName, setBusinessName] = useState('');
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!businessName.trim() || businessName.trim().length < 2) {
      newErrors.businessName = t('signup.businessNameRequired', 'Business name is required (min 2 characters)');
    }

    if (!ownerFirstName.trim()) {
      newErrors.ownerFirstName = t('signup.firstNameRequired', 'First name is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      newErrors.email = t('signup.emailInvalid', 'Please enter a valid email');
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phone.trim() || !phoneRegex.test(phone.trim())) {
      newErrors.phone = t('signup.phoneInvalid', 'Please enter a valid phone number (10-15 digits)');
    }

    if (!password || password.length < 8) {
      newErrors.password = t('signup.passwordWeak', 'Password must be at least 8 characters');
    } else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
      newErrors.password = t('signup.passwordRequirements', 'Must contain 1 uppercase letter and 1 number');
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('signup.passwordMismatch', 'Passwords do not match');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [businessName, ownerFirstName, email, phone, password, confirmPassword, t]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setServerError(null);
    setIsLoading(true);

    try {
      const result = await PinAuthApi.signup({
        businessName: businessName.trim(),
        ownerFirstName: ownerFirstName.trim(),
        ownerLastName: ownerLastName.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      if (result.success && result.data) {
        const { tenantSlug, user, accessToken, refreshToken, expiresIn } = result.data;

        // Store auth credentials
        dispatch(setCredentials({
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role as any,
            tenantId: user.tenantId || '',
          } as any,
          tokens: { accessToken, refreshToken, expiresIn },
        }));

        // Store tenant context
        if (tenantSlug) {
          dispatch(setTenant({
            id: '',
            name: businessName.trim(),
            slug: tenantSlug,
            status: 'active',
            subscriptionPlan: 'basic',
            branding: {
              primaryColor: '#4CAF50',
              secondaryColor: '#2196F3',
              fontFamily: 'Roboto',
            },
            defaultLanguage: 'en',
            supportedLanguages: ['en', 'te'],
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          await PinSecureStorage.storeTenantContext(tenantSlug, email.trim());
          await PinSecureStorage.storeTenantName(businessName.trim());
          await AsyncStorage.setItem(TENANT_ID_KEY, tenantSlug);
        }

        // Navigate to subscription plan selection
        navigation.navigate('SubscriptionPlan');
      } else {
        setServerError(result.error || t('signup.failed', 'Signup failed. Please try again.'));
      }
    } catch {
      setServerError(t('signup.networkError', 'Could not connect to server.'));
    } finally {
      setIsLoading(false);
    }
  }, [validate, businessName, ownerFirstName, ownerLastName, email, phone, password, dispatch, navigation, t]);

  const renderInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    error?: string,
    options?: {
      placeholder?: string;
      keyboardType?: any;
      autoCapitalize?: any;
      secureTextEntry?: boolean;
      testID?: string;
    },
  ) => (
    <View style={{ marginBottom: theme.spacing.sm }}>
      <Text style={[styles.label, { color: theme.colors.text, fontSize: theme.typography.fontSize.md }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.md,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
          },
        ]}
        value={value}
        onChangeText={onChange}
        editable={!isLoading}
        placeholder={options?.placeholder}
        placeholderTextColor={theme.colors.disabled}
        keyboardType={options?.keyboardType}
        autoCapitalize={options?.autoCapitalize ?? 'sentences'}
        secureTextEntry={options?.secureTextEntry}
        testID={options?.testID}
      />
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error, fontSize: theme.typography.fontSize.sm }]}>
          {error}
        </Text>
      )}
    </View>
  );

  const isFormValid = businessName.trim().length >= 2 && ownerFirstName.trim() && email.trim() && phone.trim() && password.length >= 8 && password === confirmPassword;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}>
          {/* Theme & Language Controls */}
          <AuthScreenControls />

          <Text
            style={[styles.title, {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing.xs,
            }]}
          >
            {t('signup.title', 'Create Your Business')}
          </Text>
          <Text
            style={[styles.subtitle, {
              color: theme.colors.textLight,
              fontSize: theme.typography.fontSize.md,
              marginBottom: theme.spacing.lg,
            }]}
          >
            {t('signup.subtitle', 'Start your 14-day free trial')}
          </Text>

          {renderInput(
            t('signup.businessName', 'Business Name'),
            businessName, setBusinessName, errors.businessName,
            { placeholder: 'Fresh Mart Groceries', testID: 'signup-business-name' },
          )}
          {renderInput(
            t('signup.firstName', 'Owner First Name'),
            ownerFirstName, setOwnerFirstName, errors.ownerFirstName,
            { placeholder: 'Rajesh', testID: 'signup-first-name' },
          )}
          {renderInput(
            t('signup.lastName', 'Owner Last Name (Optional)'),
            ownerLastName, setOwnerLastName, undefined,
            { placeholder: 'Kumar', testID: 'signup-last-name' },
          )}
          {renderInput(
            t('signup.email', 'Email'),
            email, setEmail, errors.email,
            { placeholder: 'admin@freshmart.com', keyboardType: 'email-address', autoCapitalize: 'none', testID: 'signup-email' },
          )}
          {renderInput(
            t('signup.phone', 'Phone'),
            phone, setPhone, errors.phone,
            { placeholder: '+919876543210', keyboardType: 'phone-pad', testID: 'signup-phone' },
          )}
          {renderInput(
            t('signup.password', 'Password'),
            password, setPassword, errors.password,
            { secureTextEntry: true, testID: 'signup-password' },
          )}
          {renderInput(
            t('signup.confirmPassword', 'Confirm Password'),
            confirmPassword, setConfirmPassword, errors.confirmPassword,
            { secureTextEntry: true, testID: 'signup-confirm-password' },
          )}

          {serverError && (
            <Text
              style={[styles.serverError, {
                color: theme.colors.error,
                fontSize: theme.typography.fontSize.md,
                marginBottom: theme.spacing.md,
              }]}
              testID="signup-server-error"
            >
              {serverError}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, {
              backgroundColor: isLoading || !isFormValid ? theme.colors.disabled : theme.colors.primary,
              borderRadius: theme.borderRadius.md,
              paddingVertical: theme.spacing.md,
              marginTop: theme.spacing.sm,
            }]}
            onPress={handleSubmit}
            disabled={isLoading}
            testID="signup-submit-button"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={[styles.buttonText, {
                color: '#FFFFFF',
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
              }]}>
                {t('signup.submit', 'Sign Up')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkButton, { marginTop: theme.spacing.lg }]}
            onPress={() => navigation.navigate('TenantSetup')}
            testID="signup-login-link"
          >
            <Text style={[styles.linkText, {
              color: theme.colors.primary,
              fontSize: theme.typography.fontSize.md,
            }]}>
              {t('signup.haveAccount', 'Already have an account? Log in')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { paddingTop: 40 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  label: { marginBottom: 4 },
  input: { borderWidth: 1 },
  errorText: { marginTop: 4 },
  serverError: { textAlign: 'center' },
  button: { alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  buttonText: {},
  linkButton: { alignItems: 'center' },
  linkText: {},
});

export default SignupScreen;

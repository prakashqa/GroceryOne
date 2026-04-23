/**
 * TenantSetupScreen
 * Email entry screen for initial tenant resolution.
 * Shown on first app launch (before PIN setup) to identify which tenant the user belongs to.
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../presentation/theme';
import { useAppDispatch } from '../../../core/hooks/useAppDispatch';
import { setTenant } from '../../../store/slices/tenantSlice';
import { PinAuthApi } from '../services/PinAuthApi';
import { PinSecureStorage } from '../services/PinSecureStorage';
import { AuthScreenControls } from '../components/AuthScreenControls';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Must match TenantProvider / RootNavigator
const TENANT_ID_KEY = '@tenant_id';

export const TenantSetupScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation('auth');
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError(t('tenant.emailRequired', 'Please enter your email address'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await PinAuthApi.resolveTenant(trimmedEmail);

      if (result.success && result.data) {
        const { tenantSlug, tenantName } = result.data;

        // Store tenant context in Redux
        dispatch(setTenant({
          id: '',
          name: tenantName,
          slug: tenantSlug,
          status: 'active',
          subscriptionPlan: 'premium',
          branding: {
            primaryColor: '#4CAF50',
            secondaryColor: '#2196F3',
            fontFamily: 'Roboto',
          },
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'te'],
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        // Persist tenant slug, user email, and friendly name for future PIN logins
        await PinSecureStorage.storeTenantContext(tenantSlug, trimmedEmail);
        await PinSecureStorage.storeTenantName(tenantName);
        await AsyncStorage.setItem(TENANT_ID_KEY, tenantSlug);

        // Navigate to PIN setup
        navigation.navigate('PinSetup');
      } else {
        setError(result.error || t('tenant.notFound', 'No account found for this email'));
      }
    } catch (err) {
      setError(t('tenant.networkError', 'Could not connect to server. Please check your connection.'));
    } finally {
      setIsLoading(false);
    }
  }, [email, dispatch, t, navigation]);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (error) {
      setError(null);
    }
  }, [error]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingHorizontal: theme.spacing.lg }]}>
          {/* Theme & Language Controls */}
          <AuthScreenControls />

          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              {t('tenant.setupTitle', 'Welcome to GroOne')}
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.colors.textLight,
                  fontSize: theme.typography.fontSize.lg,
                  marginBottom: theme.spacing.xl,
                },
              ]}
            >
              {t('tenant.setupSubtitle', 'Enter your email to get started')}
            </Text>
          </View>

          {/* Email Input */}
          <View style={[styles.inputContainer, { marginBottom: theme.spacing.md }]}>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface,
                  borderColor: error ? theme.colors.error : theme.colors.border,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.lg,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.md,
                },
              ]}
              placeholder={t('tenant.emailPlaceholder', 'your@email.com')}
              placeholderTextColor={theme.colors.disabled}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!isLoading}
              testID="tenant-email-input"
            />
          </View>

          {/* Error Message */}
          {error && (
            <Text
              style={[
                styles.errorText,
                {
                  color: theme.colors.error,
                  fontSize: theme.typography.fontSize.md,
                  marginBottom: theme.spacing.md,
                },
              ]}
              testID="tenant-error-message"
            >
              {error}
            </Text>
          )}

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isLoading || !email.trim()
                  ? theme.colors.disabled
                  : theme.colors.primary,
                borderRadius: theme.borderRadius.md,
                paddingVertical: theme.spacing.md,
              },
            ]}
            onPress={handleSubmit}
            disabled={isLoading || !email.trim()}
            accessibilityRole="button"
            testID="tenant-continue-button"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: '#FFFFFF',
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                  },
                ]}
              >
                {t('tenant.continue', 'Continue')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <TouchableOpacity
            style={[styles.signupLink, { marginTop: theme.spacing.lg }]}
            onPress={() => navigation.navigate('Signup')}
            testID="tenant-signup-link"
          >
            <Text
              style={[
                styles.signupLinkText,
                {
                  color: theme.colors.primary,
                  fontSize: theme.typography.fontSize.md,
                },
              ]}
            >
              {t('tenant.signupLink', 'New business? Sign up')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {},
  input: {
    borderWidth: 1,
  },
  errorText: {
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: {},
  signupLink: {
    alignItems: 'center',
  },
  signupLinkText: {},
});

export default TenantSetupScreen;

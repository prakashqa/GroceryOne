/**
 * Payment Settings Screen
 * Configure payment settings including merchant UPI ID for QR code generation
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../theme';
import { SettingsSection } from '../../components/settings';
import { Button } from '../../components/common';
import {
  selectPaymentSettings,
  setPaymentSettings,
} from '../../../store/slices/settingsSlice';
import { saveSettings } from '../../../utils/storage/settingsStorage';
import { selectTenant } from '../../../store/slices/tenantSlice';

const PaymentSettingsScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation('profile');
  const paymentSettings = useSelector(selectPaymentSettings);
  const tenant = useSelector(selectTenant);

  // Local state for editing
  const [merchantUpiId, setMerchantUpiId] = useState(
    paymentSettings.merchantUpiId
  );
  const [merchantName, setMerchantName] = useState(
    paymentSettings.merchantName
  );
  const [hasChanges, setHasChanges] = useState(false);

  const handleUpiIdChange = useCallback((text: string) => {
    setMerchantUpiId(text);
    setHasChanges(true);
  }, []);

  const handleMerchantNameChange = useCallback((text: string) => {
    setMerchantName(text);
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    dispatch(
      setPaymentSettings({
        merchantUpiId: merchantUpiId.trim(),
        merchantName: merchantName.trim(),
      })
    );
    setHasChanges(false);

    // Persist to storage
    if (tenant?.slug) {
      try {
        await saveSettings({
          payment: {
            merchantUpiId: merchantUpiId.trim(),
            merchantName: merchantName.trim(),
          },
        }, tenant.slug);
      } catch (error) {
        console.error('Failed to save payment settings:', error);
      }
    }
  }, [dispatch, merchantUpiId, merchantName, tenant?.slug]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { padding: theme.spacing.md }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* UPI Settings Section */}
          <SettingsSection
            title={t('settings.payment.upiSection', 'UPI Payment Settings')}
          >
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.lg,
                },
              ]}
            >
              {/* UPI ID Input */}
              <View style={styles.fieldContainer}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSize.md,
                      fontWeight: theme.typography.fontWeight.semibold,
                      marginBottom: theme.spacing.xs,
                    },
                  ]}
                >
                  {t('settings.payment.merchantUpiId', 'Merchant UPI ID')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSize.md,
                      paddingHorizontal: theme.spacing.smd,
                      height: theme.buttonHeights.md,
                    },
                  ]}
                  value={merchantUpiId}
                  onChangeText={handleUpiIdChange}
                  placeholder={t(
                    'settings.payment.upiIdPlaceholder',
                    'yourname@upi'
                  )}
                  placeholderTextColor={theme.colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  testID="payment-settings-upi-id"
                />
                <Text
                  style={[
                    styles.helper,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.fontSize.sm,
                      marginTop: theme.spacing.xs,
                    },
                  ]}
                >
                  {t(
                    'settings.payment.upiIdHelper',
                    'This UPI ID will be used to generate QR codes for payment'
                  )}
                </Text>
              </View>

              {/* Merchant Name Input */}
              <View style={[styles.fieldContainer, { marginTop: theme.spacing.lg }]}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSize.md,
                      fontWeight: theme.typography.fontWeight.semibold,
                      marginBottom: theme.spacing.xs,
                    },
                  ]}
                >
                  {t('settings.payment.merchantName', 'Merchant Name')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSize.md,
                      paddingHorizontal: theme.spacing.smd,
                      height: theme.buttonHeights.md,
                    },
                  ]}
                  value={merchantName}
                  onChangeText={handleMerchantNameChange}
                  placeholder={t(
                    'settings.payment.merchantNamePlaceholder',
                    'Your Store Name'
                  )}
                  placeholderTextColor={theme.colors.placeholder}
                  testID="payment-settings-merchant-name"
                />
                <Text
                  style={[
                    styles.helper,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.fontSize.sm,
                      marginTop: theme.spacing.xs,
                    },
                  ]}
                >
                  {t(
                    'settings.payment.merchantNameHelper',
                    'Display name shown in UPI apps when customer scans QR'
                  )}
                </Text>
              </View>
            </View>
          </SettingsSection>

          {/* Info Section */}
          <View
            style={[
              styles.infoContainer,
              {
                backgroundColor: `${theme.colors.info}15`,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg,
                marginTop: theme.spacing.lg,
              },
            ]}
          >
            <Text
              style={[
                styles.infoIcon,
                {
                  fontSize: theme.typography.fontSize.xxl,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              💡
            </Text>
            <Text
              style={[
                styles.infoText,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.sm,
                },
              ]}
            >
              {t(
                'settings.payment.infoText',
                'Configure your UPI ID to enable QR code payments. When you select UPI as payment method, a QR code with your UPI details will be shown for customers to scan and pay.'
              )}
            </Text>
          </View>
        </ScrollView>

        {/* Save Button */}
        {hasChanges && (
          <View
            style={[
              styles.buttonContainer,
              {
                backgroundColor: theme.colors.background,
                borderTopColor: theme.colors.border,
                padding: theme.spacing.lg,
              },
            ]}
          >
            <Button
              title={t('common:save', 'Save')}
              onPress={handleSave}
              variant="primary"
              fullWidth
              testID="payment-settings-save"
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    // padding applied via theme.spacing.md inline
  },
  inputContainer: {
    width: '100%',
  },
  fieldContainer: {
    width: '100%',
  },
  label: {
    // fontWeight applied via theme.typography.fontWeight.semibold inline
  },
  input: {
    borderWidth: 1,
    // paddingHorizontal, height applied via theme tokens inline
  },
  helper: {
    lineHeight: 18,
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoIcon: {
    // fontSize applied via theme.typography.fontSize.xxl inline
  },
  infoText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default PaymentSettingsScreen;

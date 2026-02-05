/**
 * UpiPaymentSection Component
 * Displays UPI QR code for payment with optional transaction reference input
 */

import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { generateUpiDeepLink } from '../../../domain/types/payment';

interface UpiPaymentSectionProps {
  grandTotal: number;
  merchantUpiId: string;
  merchantName: string;
  transactionRef?: string;
  onTransactionRefChange?: (ref: string) => void;
  testID?: string;
}

const UpiPaymentSection: React.FC<UpiPaymentSectionProps> = ({
  grandTotal,
  merchantUpiId,
  merchantName,
  transactionRef = '',
  onTransactionRefChange,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const hasUpiConfig = merchantUpiId && merchantUpiId.length > 0;

  // Generate UPI deep link for QR code
  const upiLink = hasUpiConfig
    ? generateUpiDeepLink(
        merchantUpiId,
        merchantName || 'Merchant',
        grandTotal
      )
    : '';

  return (
    <View style={styles.container} testID={testID}>
      {hasUpiConfig ? (
        <>
          {/* QR Code */}
          <View
            style={[
              styles.qrContainer,
              {
                backgroundColor: '#FFFFFF',
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.md,
              },
            ]}
            testID={testID ? `${testID}-qr` : undefined}
          >
            <QRCode
              value={upiLink}
              size={180}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
          </View>

          {/* Scan to Pay Label */}
          <Text
            style={[
              styles.scanLabel,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.md,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            {t('payment.scanToPay', 'Scan to Pay')}
          </Text>

          {/* Merchant UPI ID */}
          <Text
            style={[
              styles.upiId,
              {
                color: theme.colors.primary,
                fontSize: theme.typography.fontSize.sm,
                marginBottom: theme.spacing.lg,
              },
            ]}
            testID={testID ? `${testID}-upi-id` : undefined}
          >
            {merchantUpiId}
          </Text>

          {/* Optional Transaction Reference Input */}
          {onTransactionRefChange && (
            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                    marginBottom: theme.spacing.xs,
                  },
                ]}
              >
                {t('payment.transactionRef', 'Transaction Reference')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.md,
                    paddingHorizontal: theme.spacing.md,
                  },
                ]}
                value={transactionRef}
                onChangeText={onTransactionRefChange}
                placeholder={t(
                  'payment.transactionRefPlaceholder',
                  'Optional: Enter UPI ref'
                )}
                placeholderTextColor={theme.colors.placeholder}
                testID={testID ? `${testID}-ref-input` : undefined}
              />
            </View>
          )}
        </>
      ) : (
        /* No UPI Configuration Warning */
        <View
          style={[
            styles.noConfigContainer,
            {
              backgroundColor: `${theme.colors.warning}15`,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.lg,
            },
          ]}
          testID={testID ? `${testID}-no-config` : undefined}
        >
          <Text
            style={[
              styles.noConfigIcon,
              {
                fontSize: 32,
                marginBottom: theme.spacing.sm,
              },
            ]}
          >
            ⚠️
          </Text>
          <Text
            style={[
              styles.noConfigTitle,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.md,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            {t('payment.upiNotConfigured', 'UPI Not Configured')}
          </Text>
          <Text
            style={[
              styles.noConfigText,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
              },
            ]}
          >
            {t(
              'payment.upiNotConfiguredDesc',
              'Please configure your merchant UPI ID in Settings to enable QR code payments.'
            )}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  upiId: {
    fontWeight: '500',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    height: 56,
  },
  noConfigContainer: {
    alignItems: 'center',
    width: '100%',
  },
  noConfigIcon: {
    textAlign: 'center',
  },
  noConfigTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  noConfigText: {
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default UpiPaymentSection;

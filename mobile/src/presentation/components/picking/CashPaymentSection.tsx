/**
 * CashPaymentSection Component
 * Input for received amount with change calculation display
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';

interface CashPaymentSectionProps {
  grandTotal: number;
  receivedAmount: string;
  onReceivedAmountChange: (amount: string) => void;
  testID?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

const CashPaymentSection: React.FC<CashPaymentSectionProps> = ({
  grandTotal,
  receivedAmount,
  onReceivedAmountChange,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();

  // Responsive values
  const isTablet = screenWidth >= 600;

  const receivedNum = useMemo(() => {
    const parsed = parseFloat(receivedAmount);
    return isNaN(parsed) ? 0 : parsed;
  }, [receivedAmount]);

  const change = useMemo(() => {
    return receivedNum - grandTotal;
  }, [receivedNum, grandTotal]);

  const hasChange = receivedNum > 0 && change >= 0;
  const isInsufficient = receivedNum > 0 && change < 0;

  return (
    <View style={styles.container} testID={testID}>
      {/* Received Amount Input */}
      <View style={styles.inputContainer}>
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.textSecondary,
              fontSize: isTablet ? theme.typography.fontSize.md : theme.typography.fontSize.sm,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {t('payment.receivedAmount', 'Received Amount')}
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: theme.colors.surface,
              borderColor: isInsufficient
                ? theme.colors.error
                : theme.colors.border,
              borderRadius: theme.borderRadius.md,
              paddingHorizontal: isTablet ? theme.spacing.lg : theme.spacing.md,
              height: isTablet ? 64 : 56,
            },
          ]}
        >
          <Text
            style={[
              styles.currencySymbol,
              {
                color: theme.colors.textSecondary,
                fontSize: isTablet ? theme.typography.fontSize.xxl : theme.typography.fontSize.xl,
              },
            ]}
          >
            ₹
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.colors.text,
                fontSize: isTablet ? theme.typography.fontSize.xxl : theme.typography.fontSize.xl,
              },
            ]}
            value={receivedAmount}
            onChangeText={onReceivedAmountChange}
            keyboardType="decimal-pad"
            placeholder={t('payment.receivedAmountPlaceholder', 'Enter amount received')}
            placeholderTextColor={theme.colors.placeholder}
            testID={testID ? `${testID}-input` : undefined}
          />
        </View>
      </View>

      {/* Change Display */}
      {hasChange && (
        <View
          style={[
            styles.changeContainer,
            {
              backgroundColor: `${theme.colors.success}15`,
              borderRadius: theme.borderRadius.md,
              padding: isTablet ? theme.spacing.lg : theme.spacing.md,
              marginTop: isTablet ? theme.spacing.lg : theme.spacing.md,
            },
          ]}
          testID={testID ? `${testID}-change` : undefined}
        >
          <Text
            style={[
              styles.changeLabel,
              {
                color: theme.colors.textSecondary,
                fontSize: isTablet ? theme.typography.fontSize.md : theme.typography.fontSize.sm,
              },
            ]}
          >
            {t('payment.change', 'Change')}
          </Text>
          <Text
            style={[
              styles.changeValue,
              {
                color: theme.colors.success,
                fontSize: isTablet ? theme.typography.fontSize.xxxl : theme.typography.fontSize.xxl,
              },
            ]}
          >
            {formatCurrency(change)}
          </Text>
        </View>
      )}

      {/* Insufficient Amount Warning */}
      {isInsufficient && (
        <View
          style={[
            styles.warningContainer,
            {
              backgroundColor: `${theme.colors.error}15`,
              borderRadius: theme.borderRadius.md,
              padding: isTablet ? theme.spacing.lg : theme.spacing.md,
              marginTop: isTablet ? theme.spacing.lg : theme.spacing.md,
            },
          ]}
          testID={testID ? `${testID}-warning` : undefined}
        >
          <Text
            style={[
              styles.warningText,
              {
                color: theme.colors.error,
                fontSize: isTablet ? theme.typography.fontSize.md : theme.typography.fontSize.sm,
              },
            ]}
          >
            {t(
              'payment.insufficientAmount',
              'Received amount is less than total'
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
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    // height set dynamically
  },
  currencySymbol: {
    fontWeight: '600',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontWeight: '600',
    height: '100%',
  },
  changeContainer: {
    alignItems: 'center',
  },
  changeLabel: {
    fontWeight: '500',
    marginBottom: 4,
  },
  changeValue: {
    fontWeight: '700',
  },
  warningContainer: {
    alignItems: 'center',
  },
  warningText: {
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CashPaymentSection;

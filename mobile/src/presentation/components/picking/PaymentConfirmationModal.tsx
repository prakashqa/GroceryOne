/**
 * PaymentConfirmationModal Component
 * Modal for confirming payment received
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { ModalContainer, Button } from '../common';
import { useTranslation } from 'react-i18next';

interface PaymentConfirmationModalProps {
  visible: boolean;
  amount: number;
  onConfirm: () => void;
  onCancel: () => void;
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

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  visible,
  amount,
  onConfirm,
  onCancel,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <ModalContainer
      visible={visible}
      onClose={handleCancel}
      title={t('picking.confirmPayment', 'Confirm Payment')}
      icon="💵"
      testID={testID}
    >
      {/* Message */}
      <Text
        style={[
          styles.message,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.lg,
            marginBottom: theme.spacing.lg,
          },
        ]}
      >
        {t('picking.confirmPaymentMessage', 'Confirm payment received for {{amount}}?', {
          amount: formatCurrency(amount),
        })}
      </Text>

      {/* Amount Display */}
      <View
        style={[
          styles.amountContainer,
          {
            backgroundColor: `${theme.colors.success}15`,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.amountLabel,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.md,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {t('picking.totalAmount', 'Total Amount')}
        </Text>
        <Text
          style={[
            styles.amountValue,
            {
              color: theme.colors.success,
              fontSize: theme.typography.fontSize.xxxl,
            },
          ]}
          accessibilityLabel={`Amount: ${formatCurrency(amount)}`}
        >
          {formatCurrency(amount)}
        </Text>
      </View>

      {/* Buttons */}
      <View
        style={[
          styles.buttonContainer,
          { marginTop: theme.spacing.md, gap: theme.spacing.md },
        ]}
      >
        <View style={styles.buttonWrapper}>
          <Button
            title={t('common.cancel', 'Cancel')}
            onPress={handleCancel}
            variant="ghost"
            fullWidth
            testID={testID ? `${testID}-cancel-button` : undefined}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title={t('picking.confirmPayment', 'Confirm Payment')}
            onPress={handleConfirm}
            variant="primary"
            fullWidth
            testID={testID ? `${testID}-confirm-button` : undefined}
          />
        </View>
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  message: {
    textAlign: 'center',
  },
  amountContainer: {
    alignItems: 'center',
  },
  amountLabel: {
    fontWeight: '500',
  },
  amountValue: {
    fontWeight: '700',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  buttonWrapper: {
    flex: 1,
  },
});

export default PaymentConfirmationModal;

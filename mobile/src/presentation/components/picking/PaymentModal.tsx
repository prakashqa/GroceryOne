/**
 * PaymentModal Component
 * Main modal for payment method selection and payment processing
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ModalContainer, Button } from '../common';
import PaymentMethodSelector from './PaymentMethodSelector';
import CashPaymentSection from './CashPaymentSection';
import UpiPaymentSection from './UpiPaymentSection';
import CardPaymentSection from './CardPaymentSection';
import type {
  PaymentMethod,
  PaymentInfo,
} from '../../../domain/types/payment';
import {
  createCashPaymentInfo,
  createUpiPaymentInfo,
  createCardPaymentInfo,
} from '../../../domain/types/payment';
import {
  selectMerchantUpiId,
  selectMerchantName,
} from '../../../store/slices/settingsSlice';

interface PaymentModalProps {
  visible: boolean;
  amount: number;
  onConfirm: (paymentInfo: PaymentInfo) => void;
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

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  amount,
  onConfirm,
  onCancel,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Responsive values
  const isTablet = screenWidth >= 600;
  const scrollViewMaxHeight = isTablet ? Math.min(screenHeight * 0.5, 450) : Math.min(screenHeight * 0.55, 500);

  // Payment settings from Redux
  const merchantUpiId = useSelector(selectMerchantUpiId);
  const merchantName = useSelector(selectMerchantName);

  // Determine if UPI is properly configured
  const isUpiConfigured = Boolean(merchantUpiId && merchantUpiId.length > 0);

  // Local state
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');

  // Two-phase state: 'input' for payment entry, 'success' for change display
  const [paymentPhase, setPaymentPhase] = useState<'input' | 'success'>('input');
  const [confirmedPaymentInfo, setConfirmedPaymentInfo] = useState<PaymentInfo | null>(null);
  const [confirmedChange, setConfirmedChange] = useState<number>(0);
  const [confirmedReceived, setConfirmedReceived] = useState<number>(0);

  // Confirm button should be disabled when UPI is selected but not configured
  const isConfirmDisabled = selectedMethod === 'upi' && !isUpiConfigured;

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelectedMethod('cash');
      setReceivedAmount('');
      setTransactionRef('');
      setLastFourDigits('');
      setPaymentPhase('input');
      setConfirmedPaymentInfo(null);
      setConfirmedChange(0);
      setConfirmedReceived(0);
    }
  }, [visible]);

  const handleConfirmPayment = useCallback(() => {
    let paymentInfo: PaymentInfo;

    switch (selectedMethod) {
      case 'cash': {
        const received = parseFloat(receivedAmount) || 0;
        const change = received > 0 ? received - amount : 0;
        paymentInfo = createCashPaymentInfo(
          received > 0 ? received : undefined,
          change > 0 ? change : undefined
        );

        // Show success screen with change amount for cash payments with change
        if (change > 0) {
          setConfirmedPaymentInfo(paymentInfo);
          setConfirmedChange(change);
          setConfirmedReceived(received);
          setPaymentPhase('success');
          return;
        }
        break;
      }
      case 'upi': {
        if (!isUpiConfigured) {
          return;
        }
        paymentInfo = createUpiPaymentInfo(
          merchantUpiId || undefined,
          transactionRef || undefined
        );
        break;
      }
      case 'card': {
        paymentInfo = createCardPaymentInfo(
          lastFourDigits || undefined
        );
        break;
      }
      default:
        paymentInfo = createCashPaymentInfo();
    }

    onConfirm(paymentInfo);
  }, [
    selectedMethod,
    receivedAmount,
    transactionRef,
    lastFourDigits,
    amount,
    merchantUpiId,
    onConfirm,
  ]);

  const handleDone = useCallback(() => {
    if (confirmedPaymentInfo) {
      onConfirm(confirmedPaymentInfo);
    }
  }, [confirmedPaymentInfo, onConfirm]);

  const renderPaymentSection = () => {
    switch (selectedMethod) {
      case 'cash':
        return (
          <CashPaymentSection
            grandTotal={amount}
            receivedAmount={receivedAmount}
            onReceivedAmountChange={setReceivedAmount}
            testID={testID ? `${testID}-cash-section` : undefined}
          />
        );
      case 'upi':
        return (
          <UpiPaymentSection
            grandTotal={amount}
            merchantUpiId={merchantUpiId}
            merchantName={merchantName}
            transactionRef={transactionRef}
            onTransactionRefChange={setTransactionRef}
            testID={testID ? `${testID}-upi-section` : undefined}
          />
        );
      case 'card':
        return (
          <CardPaymentSection
            lastFourDigits={lastFourDigits}
            onLastFourDigitsChange={setLastFourDigits}
            testID={testID ? `${testID}-card-section` : undefined}
          />
        );
      default:
        return null;
    }
  };

  const renderSuccessScreen = () => (
    <View style={styles.successContainer} testID={testID ? `${testID}-success` : undefined}>
      <Text style={styles.successIcon}>✅</Text>
      <Text
        style={[
          styles.successTitle,
          {
            color: theme.colors.success,
            fontSize: isTablet ? theme.typography.fontSize.xxl : theme.typography.fontSize.xl,
          },
        ]}
      >
        {t('payment.paymentSuccessful', 'Payment Successful')}
      </Text>

      <View
        style={[
          styles.successSummary,
          {
            backgroundColor: theme.colors.background,
            borderRadius: theme.borderRadius.lg,
            padding: isTablet ? theme.spacing.xl : theme.spacing.lg,
            marginTop: isTablet ? theme.spacing.xl : theme.spacing.lg,
          },
        ]}
      >
        <View style={styles.successRow}>
          <Text
            style={[
              styles.successLabel,
              {
                color: theme.colors.textSecondary,
                fontSize: isTablet ? theme.typography.fontSize.lg : theme.typography.fontSize.md,
              },
            ]}
          >
            {t('picking.totalAmount', 'Total Amount')}
          </Text>
          <Text
            style={[
              styles.successValue,
              {
                color: theme.colors.text,
                fontSize: isTablet ? theme.typography.fontSize.xl : theme.typography.fontSize.lg,
              },
            ]}
          >
            {formatCurrency(amount)}
          </Text>
        </View>
        <View style={styles.successRow}>
          <Text
            style={[
              styles.successLabel,
              {
                color: theme.colors.textSecondary,
                fontSize: isTablet ? theme.typography.fontSize.lg : theme.typography.fontSize.md,
              },
            ]}
          >
            {t('payment.receivedAmount', 'Received Amount')}
          </Text>
          <Text
            style={[
              styles.successValue,
              {
                color: theme.colors.text,
                fontSize: isTablet ? theme.typography.fontSize.xl : theme.typography.fontSize.lg,
              },
            ]}
          >
            {formatCurrency(confirmedReceived)}
          </Text>
        </View>
        <View style={[styles.successDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.successRow}>
          <Text
            style={[
              styles.successChangeLabel,
              {
                color: theme.colors.success,
                fontSize: isTablet ? theme.typography.fontSize.xl : theme.typography.fontSize.lg,
              },
            ]}
          >
            {t('payment.returnChange', 'Return Change')}
          </Text>
          <Text
            style={[
              styles.successChangeValue,
              {
                color: theme.colors.success,
                fontSize: isTablet ? theme.typography.fontSize.xxxl : theme.typography.fontSize.xxl,
              },
            ]}
          >
            {formatCurrency(confirmedChange)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <ModalContainer
      visible={visible}
      onClose={paymentPhase === 'success' ? handleDone : onCancel}
      title={paymentPhase === 'success'
        ? t('payment.paymentSuccessful', 'Payment Successful')
        : t('picking.confirmPayment', 'Confirm Payment')}
      icon={paymentPhase === 'success' ? '✅' : '💰'}
      testID={testID}
    >
      {paymentPhase === 'input' ? (
        <>
          <ScrollView
            style={[styles.scrollView, { maxHeight: scrollViewMaxHeight }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Amount Display */}
            <View
              style={[
                styles.amountContainer,
                {
                  backgroundColor: `${theme.colors.success}15`,
                  borderRadius: theme.borderRadius.lg,
                  padding: isTablet ? theme.spacing.xl : theme.spacing.lg,
                  marginBottom: isTablet ? theme.spacing.xl : theme.spacing.lg,
                },
              ]}
            >
              <Text
                style={[
                  styles.amountLabel,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: isTablet ? theme.typography.fontSize.lg : theme.typography.fontSize.md,
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
                    fontSize: isTablet ? theme.typography.fontSize.xxxl + 4 : theme.typography.fontSize.xxxl,
                  },
                ]}
                accessibilityLabel={`Amount: ${formatCurrency(amount)}`}
                testID={testID ? `${testID}-amount` : undefined}
              >
                {formatCurrency(amount)}
              </Text>
            </View>

            {/* Payment Method Selector */}
            <View style={[styles.sectionContainer, { marginBottom: isTablet ? theme.spacing.xl : theme.spacing.lg }]}>
              <PaymentMethodSelector
                selectedMethod={selectedMethod}
                onMethodChange={setSelectedMethod}
                testID={testID ? `${testID}-method-selector` : undefined}
              />
            </View>

            {/* Payment Method Specific Section */}
            <View
              style={[
                styles.paymentSection,
                {
                  backgroundColor: theme.colors.background,
                  borderRadius: theme.borderRadius.lg,
                  padding: isTablet ? theme.spacing.xl : theme.spacing.lg,
                },
              ]}
            >
              {renderPaymentSection()}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View
            style={[
              styles.buttonContainer,
              {
                marginTop: isTablet ? theme.spacing.lg : theme.spacing.md,
                gap: isTablet ? theme.spacing.md : theme.spacing.sm,
              },
            ]}
          >
            <Button
              title={t('common.cancel', 'Cancel')}
              onPress={onCancel}
              variant="ghost"
              testID={testID ? `${testID}-cancel-button` : undefined}
            />
            <Button
              title={t('common.confirm', 'Confirm')}
              onPress={handleConfirmPayment}
              variant="primary"
              disabled={isConfirmDisabled}
              testID={testID ? `${testID}-confirm-button` : undefined}
            />
          </View>
        </>
      ) : (
        <>
          {renderSuccessScreen()}
          <View
            style={[
              styles.buttonContainer,
              {
                marginTop: isTablet ? theme.spacing.lg : theme.spacing.md,
                justifyContent: 'center',
              },
            ]}
          >
            <Button
              title={t('common.done', 'Done')}
              onPress={handleDone}
              variant="primary"
              testID={testID ? `${testID}-done-button` : undefined}
            />
          </View>
        </>
      )}
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    // maxHeight set dynamically based on screen size
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
  sectionContainer: {
    width: '100%',
  },
  paymentSection: {
    width: '100%',
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  successTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  successSummary: {
    width: '100%',
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  successLabel: {
    fontWeight: '500',
  },
  successValue: {
    fontWeight: '600',
  },
  successDivider: {
    height: 1,
    marginVertical: 4,
  },
  successChangeLabel: {
    fontWeight: '700',
  },
  successChangeValue: {
    fontWeight: '700',
  },
});

export default PaymentModal;

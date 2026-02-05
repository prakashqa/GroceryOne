/**
 * PaymentMethodBadge Component
 * Displays payment method on paid carts with appropriate icon and label
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import type { PaymentInfo, PaymentMethod } from '../../../domain/types/payment';
import { getPaymentMethodIcon } from '../../../domain/types/payment';

interface PaymentMethodBadgeProps {
  paymentInfo: PaymentInfo;
  size?: 'sm' | 'md';
  testID?: string;
}

const PaymentMethodBadge: React.FC<PaymentMethodBadgeProps> = ({
  paymentInfo,
  size = 'md',
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const getMethodLabel = (method: PaymentMethod): string => {
    switch (method) {
      case 'cash':
        return t('payment.methodCash', 'Cash');
      case 'upi':
        return t('payment.methodUpi', 'UPI');
      case 'card':
        return t('payment.methodCard', 'Card');
      default:
        return '';
    }
  };

  const getCardSuffix = (): string => {
    if (
      paymentInfo.method === 'card' &&
      paymentInfo.details.method === 'card' &&
      paymentInfo.details.lastFourDigits
    ) {
      return ` ****${paymentInfo.details.lastFourDigits}`;
    }
    return '';
  };

  const icon = getPaymentMethodIcon(paymentInfo.method);
  const label = getMethodLabel(paymentInfo.method) + getCardSuffix();

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${theme.colors.success}20`,
          paddingHorizontal: isSmall ? theme.spacing.xs : theme.spacing.sm,
          paddingVertical: isSmall ? 2 : theme.spacing.xs,
          borderRadius: theme.borderRadius.sm,
        },
      ]}
      testID={testID}
    >
      <Text
        style={[
          styles.icon,
          {
            fontSize: isSmall ? 12 : 14,
            marginRight: theme.spacing.xs,
          },
        ]}
      >
        {icon}
      </Text>
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.success,
            fontSize: isSmall
              ? theme.typography.fontSize.xs
              : theme.typography.fontSize.sm,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    lineHeight: 16,
  },
  label: {
    fontWeight: '600',
  },
});

export default PaymentMethodBadge;

/**
 * PaymentMethodSelector Component
 * Radio group for selecting payment method (Cash, UPI, Card)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import type { PaymentMethod } from '../../../domain/types/payment';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  testID?: string;
}

interface PaymentOption {
  value: PaymentMethod;
  icon: string;
  labelKey: string;
  defaultLabel: string;
  descKey: string;
  defaultDesc: string;
}

const paymentOptions: PaymentOption[] = [
  {
    value: 'cash',
    icon: '💵',
    labelKey: 'payment.cash',
    defaultLabel: 'Cash',
    descKey: 'payment.cashDesc',
    defaultDesc: 'Pay with cash',
  },
  {
    value: 'upi',
    icon: '📱',
    labelKey: 'payment.upi',
    defaultLabel: 'UPI',
    descKey: 'payment.upiDesc',
    defaultDesc: 'Pay via UPI transfer',
  },
  {
    value: 'card',
    icon: '💳',
    labelKey: 'payment.card',
    defaultLabel: 'Card',
    descKey: 'payment.cardDesc',
    defaultDesc: 'Pay by debit/credit card',
  },
];

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();

  // Responsive values
  const isTablet = screenWidth >= 600;

  return (
    <View style={styles.container} testID={testID}>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.textSecondary,
            fontSize: isTablet ? theme.typography.fontSize.md : theme.typography.fontSize.sm,
            marginBottom: theme.spacing.sm,
          },
        ]}
      >
        {t('payment.selectMethod', 'SELECT PAYMENT METHOD')}
      </Text>

      <View
        style={[
          styles.optionsContainer,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            overflow: 'hidden',
          },
        ]}
      >
        {paymentOptions.map((option, index) => {
          const isSelected = option.value === selectedMethod;
          const isLast = index === paymentOptions.length - 1;

          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected
                    ? `${theme.colors.primary}10`
                    : 'transparent',
                  borderBottomColor: theme.colors.divider,
                  borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                  paddingVertical: isTablet ? theme.spacing.lg : theme.spacing.md,
                  paddingHorizontal: isTablet ? theme.spacing.lg : theme.spacing.md,
                  minHeight: isTablet ? 64 : 56,
                },
              ]}
              onPress={() => onMethodChange(option.value)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              testID={testID ? `${testID}-option-${option.value}` : undefined}
            >
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isSelected
                      ? `${theme.colors.primary}20`
                      : theme.colors.background,
                    borderRadius: theme.borderRadius.md,
                    marginRight: theme.spacing.md,
                    width: isTablet ? 44 : 36,
                    height: isTablet ? 44 : 36,
                  },
                ]}
              >
                <Text style={[styles.icon, { fontSize: isTablet ? 22 : 18 }]}>{option.icon}</Text>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: isSelected
                        ? theme.colors.primary
                        : theme.colors.text,
                      fontSize: isTablet ? theme.typography.fontSize.lg : theme.typography.fontSize.md,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {t(option.labelKey, option.defaultLabel)}
                </Text>
                <Text
                  style={[
                    styles.description,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: isTablet ? theme.typography.fontSize.sm : theme.typography.fontSize.xs,
                      marginTop: theme.spacing.xs,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {t(option.descKey, option.defaultDesc)}
                </Text>
              </View>

              {/* Radio Button */}
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.border,
                    width: isTablet ? 24 : 20,
                    height: isTablet ? 24 : 20,
                    borderRadius: isTablet ? 12 : 10,
                  },
                ]}
              >
                {isSelected && (
                  <View
                    style={[
                      styles.radioInner,
                      {
                        backgroundColor: theme.colors.primary,
                        width: isTablet ? 12 : 10,
                        height: isTablet ? 12 : 10,
                        borderRadius: isTablet ? 6 : 5,
                      },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  optionsContainer: {
    width: '100%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    // minHeight set dynamically
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // width, height set dynamically
  },
  icon: {
    // fontSize set dynamically
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontWeight: '600',
  },
  description: {},
  radio: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    // width, height, borderRadius set dynamically
  },
  radioInner: {
    // width, height, borderRadius set dynamically
  },
});

export default PaymentMethodSelector;

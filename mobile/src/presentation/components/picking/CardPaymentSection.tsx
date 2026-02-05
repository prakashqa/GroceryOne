/**
 * CardPaymentSection Component
 * Optional input for card last 4 digits
 */

import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';

interface CardPaymentSectionProps {
  lastFourDigits: string;
  onLastFourDigitsChange: (digits: string) => void;
  testID?: string;
}

const CardPaymentSection: React.FC<CardPaymentSectionProps> = ({
  lastFourDigits,
  onLastFourDigitsChange,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleChange = (text: string) => {
    // Only allow digits and limit to 4 characters
    const filtered = text.replace(/[^0-9]/g, '').slice(0, 4);
    onLastFourDigitsChange(filtered);
  };

  return (
    <View style={styles.container} testID={testID}>
      {/* Last 4 Digits Input (Optional) */}
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
          {t('payment.lastFourDigits', 'Last 4 Digits')} ({t('common.optional', 'Optional')})
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.md,
            },
          ]}
        >
          <Text
            style={[
              styles.prefix,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.lg,
              },
            ]}
          >
            ****
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.lg,
              },
            ]}
            value={lastFourDigits}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={4}
            placeholder={t('payment.lastFourPlaceholder', '1234')}
            placeholderTextColor={theme.colors.placeholder}
            testID={testID ? `${testID}-input` : undefined}
          />
        </View>
        <Text
          style={[
            styles.helper,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.xs,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {t('payment.lastFourHelper', 'For your records only')}
        </Text>
      </View>
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
    paddingHorizontal: 12,
    height: 48,
  },
  prefix: {
    fontWeight: '500',
    letterSpacing: 2,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontWeight: '600',
    letterSpacing: 4,
    height: '100%',
  },
  helper: {
    fontStyle: 'italic',
  },
});

export default CardPaymentSection;

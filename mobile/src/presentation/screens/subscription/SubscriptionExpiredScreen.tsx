/**
 * SubscriptionExpiredScreen
 * Shown when the tenant's subscription has expired.
 * Offers renewal options (Monthly or Yearly).
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { useAppDispatch } from '../../../core/hooks/useAppDispatch';
import { setSubscription } from '../../../store/slices/subscriptionSlice';
import { useCreateSubscriptionMutation } from '../../../data/api/subscriptionApi';
import { SUBSCRIPTION_PLANS } from '@groceryone/shared';
import type { SubscriptionPlanType } from '@groceryone/shared';

export const SubscriptionExpiredScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation('auth');
  const dispatch = useAppDispatch();
  const [createSubscription] = useCreateSubscriptionMutation();
  const [isLoading, setIsLoading] = useState(false);

  const handleRenew = useCallback(async (plan: SubscriptionPlanType) => {
    setIsLoading(true);
    try {
      const result = await createSubscription({ plan }).unwrap();
      dispatch(setSubscription(result));
    } catch {
      Alert.alert(
        t('subscription.error', 'Error'),
        t('subscription.renewFailed', 'Failed to renew subscription. Please try again.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [createSubscription, dispatch, t]);

  const monthlyPlan = SUBSCRIPTION_PLANS?.monthly ?? { amount: 1000, currency: 'INR', durationDays: 30, label: 'Monthly' };
  const yearlyPlan = SUBSCRIPTION_PLANS?.yearly ?? { amount: 9000, currency: 'INR', durationDays: 365, label: 'Yearly' };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.content, { padding: theme.spacing.lg }]}>
        <Text
          style={[styles.title, {
            color: theme.colors.error,
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.sm,
          }]}
          testID="expired-title"
        >
          {t('subscription.expiredTitle', 'Subscription Expired')}
        </Text>
        <Text
          style={[styles.subtitle, {
            color: theme.colors.textLight,
            fontSize: theme.typography.fontSize.md,
            marginBottom: theme.spacing.xl,
          }]}
          testID="expired-message"
        >
          {t('subscription.expiredMessage', 'Your subscription has expired. Please renew to continue using the app.')}
        </Text>

        {/* Monthly Renewal */}
        <TouchableOpacity
          style={[styles.planCard, {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.md,
          }]}
          onPress={() => handleRenew('monthly')}
          disabled={isLoading}
          testID="renew-monthly"
        >
          <Text style={[styles.planName, {
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
          }]}>
            {t('subscription.monthly', 'Monthly')}
          </Text>
          <Text style={[styles.planPrice, {
            color: theme.colors.primary,
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            marginTop: theme.spacing.xs,
          }]}>
            {`\u20B9${monthlyPlan.amount}`}
            <Text style={{ fontSize: theme.typography.fontSize.md, color: theme.colors.textLight }}>
              {t('subscription.perMonth', '/month')}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Yearly Renewal */}
        <TouchableOpacity
          style={[styles.planCard, {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.primary,
            borderWidth: 2,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
          }]}
          onPress={() => handleRenew('yearly')}
          disabled={isLoading}
          testID="renew-yearly"
        >
          <View style={styles.planHeader}>
            <Text style={[styles.planName, {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
            }]}>
              {t('subscription.yearly', 'Yearly')}
            </Text>
            <View style={[styles.saveBadge, { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.sm }]}>
              <Text style={[styles.saveText, { color: '#FFFFFF', fontSize: theme.typography.fontSize.sm }]}>
                {t('subscription.save25', 'Save 25%')}
              </Text>
            </View>
          </View>
          <Text style={[styles.planPrice, {
            color: theme.colors.primary,
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            marginTop: theme.spacing.xs,
          }]}>
            {`\u20B9${yearlyPlan.amount}`}
            <Text style={{ fontSize: theme.typography.fontSize.md, color: theme.colors.textLight }}>
              {t('subscription.perYear', '/year')}
            </Text>
          </Text>
        </TouchableOpacity>

        {isLoading && (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginBottom: theme.spacing.md }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center' },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', lineHeight: 22 },
  planCard: { borderWidth: 1 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: {},
  planPrice: {},
  saveBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  saveText: { fontWeight: '600' },
});

export default SubscriptionExpiredScreen;

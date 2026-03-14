/**
 * SubscriptionPlanScreen
 * Plan selection after signup — Monthly or Yearly, with option to skip (trial).
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
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../presentation/theme';
import { useAppDispatch } from '../../../core/hooks/useAppDispatch';
import { setSubscription } from '../../../store/slices/subscriptionSlice';
import { useCreateSubscriptionMutation } from '../../../data/api/subscriptionApi';
import { SUBSCRIPTION_PLANS } from '@groceryone/shared';
import type { SubscriptionPlanType } from '@groceryone/shared';

export const SubscriptionPlanScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation('auth');
  const dispatch = useAppDispatch();
  const [createSubscription] = useCreateSubscriptionMutation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = useCallback(async (plan: SubscriptionPlanType) => {
    setIsLoading(true);
    try {
      const result = await createSubscription({ plan }).unwrap();
      dispatch(setSubscription(result));
      navigation.navigate('PinSetup');
    } catch {
      Alert.alert(
        t('subscription.error', 'Error'),
        t('subscription.createFailed', 'Failed to create subscription. Please try again.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [createSubscription, dispatch, navigation, t]);

  const handleSkipTrial = useCallback(() => {
    navigation.navigate('PinSetup');
  }, [navigation]);

  const monthlyPlan = SUBSCRIPTION_PLANS.monthly;
  const yearlyPlan = SUBSCRIPTION_PLANS.yearly;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.content, { padding: theme.spacing.lg }]}>
        <Text
          style={[styles.title, {
            color: theme.colors.text,
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.xs,
          }]}
        >
          {t('subscription.title', 'Choose Your Plan')}
        </Text>
        <Text
          style={[styles.subtitle, {
            color: theme.colors.textLight,
            fontSize: theme.typography.fontSize.md,
            marginBottom: theme.spacing.xl,
          }]}
        >
          {t('subscription.subtitle', 'Select a plan to get started')}
        </Text>

        {/* Monthly Plan Card */}
        <TouchableOpacity
          style={[styles.planCard, {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.md,
          }]}
          onPress={() => handleSelectPlan('monthly')}
          disabled={isLoading}
          testID="plan-monthly"
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
            {`${monthlyPlan.currency === 'INR' ? '\u20B9' : '$'}${monthlyPlan.amount}`}
            <Text style={{ fontSize: theme.typography.fontSize.md, color: theme.colors.textLight }}>
              {t('subscription.perMonth', '/month')}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Yearly Plan Card */}
        <TouchableOpacity
          style={[styles.planCard, {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.primary,
            borderWidth: 2,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
          }]}
          onPress={() => handleSelectPlan('yearly')}
          disabled={isLoading}
          testID="plan-yearly"
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
            {`${yearlyPlan.currency === 'INR' ? '\u20B9' : '$'}${yearlyPlan.amount}`}
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

        {/* Skip (Trial) Button */}
        <TouchableOpacity
          style={[styles.skipButton, { paddingVertical: theme.spacing.md }]}
          onPress={handleSkipTrial}
          disabled={isLoading}
          testID="plan-skip-trial"
        >
          <Text style={[styles.skipText, {
            color: theme.colors.textLight,
            fontSize: theme.typography.fontSize.md,
          }]}>
            {t('subscription.skipTrial', 'Skip (Start 14-day Trial)')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingTop: 60 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  planCard: { borderWidth: 1 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: {},
  planPrice: {},
  saveBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  saveText: { fontWeight: '600' },
  skipButton: { alignItems: 'center' },
  skipText: { textDecorationLine: 'underline' },
});

export default SubscriptionPlanScreen;

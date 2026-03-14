/**
 * Subscription-related type definitions
 */

export type SubscriptionPlanType = 'monthly' | 'yearly';

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';

export interface Subscription {
  id: string;
  tenantId: string;
  plan: SubscriptionPlanType;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  startsAt: Date;
  expiresAt: Date;
  cancelledAt?: Date;
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlanInfo {
  amount: number;
  currency: string;
  durationDays: number;
  label: string;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanType, SubscriptionPlanInfo> = {
  monthly: { amount: 1000, currency: 'INR', durationDays: 30, label: 'Monthly' },
  yearly: { amount: 9000, currency: 'INR', durationDays: 365, label: 'Yearly' },
};

/**
 * Subscription API (shared)
 */

import { baseApi } from './baseApi';
import type { Subscription, SubscriptionPlanType } from '@groceryone/shared';

interface CreateSubscriptionRequest {
  plan: SubscriptionPlanType;
  paymentReference?: string;
}

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptionStatus: builder.query<Subscription | null, void>({
      query: () => '/subscriptions/current',
      providesTags: ['Subscription'],
    }),
    createSubscription: builder.mutation<Subscription, CreateSubscriptionRequest>({
      query: (body) => ({ url: '/subscriptions', method: 'POST', body }),
      invalidatesTags: ['Subscription'],
    }),
    getSubscriptionHistory: builder.query<Subscription[], void>({
      query: () => '/subscriptions/history',
      providesTags: ['Subscription'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSubscriptionStatusQuery,
  useCreateSubscriptionMutation,
  useGetSubscriptionHistoryQuery,
} = subscriptionApi;

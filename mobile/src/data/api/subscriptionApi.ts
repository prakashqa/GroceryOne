/**
 * Subscription API
 * RTK Query endpoints for subscription management
 */

import { baseApi } from './baseApi';
import { API_ENDPOINTS } from '../../core/config/api.config';
import type { Subscription, SubscriptionPlanType } from '@groceryone/shared';

interface CreateSubscriptionRequest {
  plan: SubscriptionPlanType;
  paymentReference?: string;
}

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptionStatus: builder.query<Subscription | null, void>({
      query: () => API_ENDPOINTS.SUBSCRIPTIONS.CURRENT,
      providesTags: ['Subscription'],
    }),

    createSubscription: builder.mutation<Subscription, CreateSubscriptionRequest>({
      query: (body) => ({
        url: API_ENDPOINTS.SUBSCRIPTIONS.CREATE,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscription'],
    }),

    getSubscriptionHistory: builder.query<Subscription[], void>({
      query: () => API_ENDPOINTS.SUBSCRIPTIONS.HISTORY,
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

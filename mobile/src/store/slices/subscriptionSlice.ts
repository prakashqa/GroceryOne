/**
 * Subscription Slice
 * Manages subscription state and expiry detection
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Subscription } from '@groceryone/shared';
import type { RootState } from '../rootReducer';

interface SubscriptionState {
  subscription: Subscription | null;
  isActive: boolean;
  isExpired: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  subscription: null,
  isActive: false,
  isExpired: false,
  isLoading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscription: (state, action: PayloadAction<Subscription>) => {
      state.subscription = action.payload;
      state.isActive = ['trial', 'active'].includes(action.payload.status);
      state.isExpired = false;
      state.error = null;
    },
    setExpired: (state) => {
      state.isExpired = true;
      state.isActive = false;
    },
    clearSubscription: (state) => {
      state.subscription = null;
      state.isActive = false;
      state.isExpired = false;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setSubscription,
  setExpired,
  clearSubscription,
  setLoading,
  setError,
} = subscriptionSlice.actions;

// Selectors
export const selectSubscription = (state: RootState) => state.subscription.subscription;
export const selectIsSubscriptionActive = (state: RootState) => state.subscription.isActive;
export const selectIsSubscriptionExpired = (state: RootState) => state.subscription.isExpired;
export const selectSubscriptionLoading = (state: RootState) => state.subscription.isLoading;
export const selectSubscriptionError = (state: RootState) => state.subscription.error;

export default subscriptionSlice.reducer;

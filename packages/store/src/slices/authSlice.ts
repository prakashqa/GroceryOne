/**
 * Authentication Slice (shared)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthTokens } from '@groceryone/shared';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresPinSetup: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  requiresPinSetup: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; tokens: AuthTokens; requiresPinSetup?: boolean }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.tokens.accessToken;
      state.refreshToken = action.payload.tokens.refreshToken;
      state.isAuthenticated = true;
      state.error = null;
      state.requiresPinSetup = action.payload.requiresPinSetup ?? true;
    },
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.requiresPinSetup = false;
    },
    setRequiresPinSetup: (state, action: PayloadAction<boolean>) => {
      state.requiresPinSetup = action.payload;
    },
  },
});

export const {
  setCredentials,
  setTokens,
  updateUser,
  setLoading,
  setError,
  logout,
  setRequiresPinSetup,
} = authSlice.actions;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectRequiresPinSetup = (state: { auth: AuthState }) => state.auth.requiresPinSetup;

// Role-based access control selectors.
// `selectIsAdmin` is the primary gate for Reports + Employees management.
export const selectUserRole = (state: { auth: AuthState }) => state.auth.user?.role ?? null;
export const selectIsAdmin = (state: { auth: AuthState }) => state.auth.user?.role === 'admin';

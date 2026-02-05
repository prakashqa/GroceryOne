/**
 * UI Slice - Global UI state management
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface Modal {
  id: string;
  type: string;
  props?: Record<string, unknown>;
}

interface UiState {
  isLoading: boolean;
  loadingMessage: string | null;
  toasts: Toast[];
  modals: Modal[];
  isOnline: boolean;
  isKeyboardVisible: boolean;
}

const initialState: UiState = {
  isLoading: false,
  loadingMessage: null,
  toasts: [],
  modals: [],
  isOnline: true,
  isKeyboardVisible: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (
      state,
      action: PayloadAction<{ isLoading: boolean; message?: string }>
    ) => {
      state.isLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message ?? null;
    },

    showToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = `toast_${Date.now()}`;
      state.toasts.push({ ...action.payload, id });
    },

    hideToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },

    clearAllToasts: (state) => {
      state.toasts = [];
    },

    openModal: (state, action: PayloadAction<Omit<Modal, 'id'>>) => {
      const id = `modal_${Date.now()}`;
      state.modals.push({ ...action.payload, id });
    },

    closeModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter((modal) => modal.id !== action.payload);
    },

    closeAllModals: (state) => {
      state.modals = [];
    },

    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },

    setKeyboardVisible: (state, action: PayloadAction<boolean>) => {
      state.isKeyboardVisible = action.payload;
    },
  },
});

export const {
  setLoading,
  showToast,
  hideToast,
  clearAllToasts,
  openModal,
  closeModal,
  closeAllModals,
  setOnlineStatus,
  setKeyboardVisible,
} = uiSlice.actions;

// Selectors
export const selectIsLoading = (state: { ui: UiState }) => state.ui.isLoading;
export const selectLoadingMessage = (state: { ui: UiState }) =>
  state.ui.loadingMessage;
export const selectToasts = (state: { ui: UiState }) => state.ui.toasts;
export const selectModals = (state: { ui: UiState }) => state.ui.modals;
export const selectIsOnline = (state: { ui: UiState }) => state.ui.isOnline;
export const selectIsKeyboardVisible = (state: { ui: UiState }) =>
  state.ui.isKeyboardVisible;

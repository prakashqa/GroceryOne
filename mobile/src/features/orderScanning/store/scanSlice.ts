/**
 * scanSlice
 * Redux slice for managing paper order scanning state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Item } from '../../../domain/types/picking';
import {
  ScanState,
  ScanSession,
  OcrResult,
  MatchResult,
  MatchConfidence,
  ProcessingStep,
  ScanSessionStatus,
} from '../types/scanning.types';

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
  return `scan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const initialState: ScanState = {
  currentSession: null,
  isProcessing: false,
  processingStep: null,
  error: null,
};

const scanSlice = createSlice({
  name: 'scan',
  initialState,
  reducers: {
    /**
     * Start a new scanning session with an image
     */
    startSession: (state, action: PayloadAction<string>) => {
      const now = new Date().toISOString();
      state.currentSession = {
        id: generateSessionId(),
        imageUri: action.payload,
        ocrResult: null,
        matchResults: [],
        selectedCartId: null,
        status: 'capturing',
        createdAt: now,
      };
      state.isProcessing = false;
      state.processingStep = null;
      state.error = null;
    },

    /**
     * Set processing state with current step
     */
    setProcessing: (state, action: PayloadAction<ProcessingStep>) => {
      state.isProcessing = true;
      state.processingStep = action.payload;
      if (state.currentSession) {
        state.currentSession.status = 'processing';
      }
    },

    /**
     * Set OCR result on current session
     */
    setOcrResult: (state, action: PayloadAction<OcrResult>) => {
      if (state.currentSession) {
        state.currentSession.ocrResult = action.payload;
      }
    },

    /**
     * Set match results and transition to reviewing status
     */
    setMatchResults: (state, action: PayloadAction<MatchResult[]>) => {
      if (state.currentSession) {
        state.currentSession.matchResults = action.payload;
        state.currentSession.status = 'reviewing';
      }
      state.isProcessing = false;
      state.processingStep = null;
    },

    /**
     * Update a specific match result (user override)
     */
    updateMatchResult: (
      state,
      action: PayloadAction<{
        index: number;
        matchedItem: Item;
        confidence: MatchConfidence;
        confidenceScore: number;
      }>
    ) => {
      const { index, matchedItem, confidence, confidenceScore } = action.payload;
      if (
        state.currentSession &&
        index >= 0 &&
        index < state.currentSession.matchResults.length
      ) {
        const currentMatch = state.currentSession.matchResults[index];
        state.currentSession.matchResults[index] = {
          ...currentMatch,
          matchedItem,
          confidence,
          confidenceScore,
          userOverride: {
            selectedItemId: matchedItem.id,
            selectedQuantity:
              currentMatch.userOverride?.selectedQuantity ||
              currentMatch.parsedItem.quantity ||
              matchedItem.defaultQuantity,
          },
        };
      }
    },

    /**
     * Update quantity for a match result
     */
    updateMatchQuantity: (
      state,
      action: PayloadAction<{ index: number; quantity: number }>
    ) => {
      const { index, quantity } = action.payload;
      if (
        state.currentSession &&
        index >= 0 &&
        index < state.currentSession.matchResults.length
      ) {
        const currentMatch = state.currentSession.matchResults[index];
        state.currentSession.matchResults[index] = {
          ...currentMatch,
          userOverride: {
            selectedItemId:
              currentMatch.userOverride?.selectedItemId ||
              currentMatch.matchedItem?.id ||
              '',
            selectedQuantity: quantity,
          },
        };
      }
    },

    /**
     * Remove/skip a match result
     */
    removeMatch: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (
        state.currentSession &&
        index >= 0 &&
        index < state.currentSession.matchResults.length
      ) {
        state.currentSession.matchResults[index].isSkipped = true;
      }
    },

    /**
     * Select target cart for adding items
     */
    selectCart: (state, action: PayloadAction<string>) => {
      if (state.currentSession) {
        state.currentSession.selectedCartId = action.payload;
      }
    },

    /**
     * Set session status
     */
    setSessionStatus: (state, action: PayloadAction<ScanSessionStatus>) => {
      if (state.currentSession) {
        state.currentSession.status = action.payload;
      }
    },

    /**
     * Set error state
     */
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isProcessing = false;
      state.processingStep = null;
      if (state.currentSession) {
        state.currentSession.status = 'error';
        state.currentSession.error = action.payload;
      }
    },

    /**
     * Clear the current session and reset state
     */
    clearSession: (state) => {
      state.currentSession = null;
      state.isProcessing = false;
      state.processingStep = null;
      state.error = null;
    },
  },
});

// Export actions
export const {
  startSession,
  setProcessing,
  setOcrResult,
  setMatchResults,
  updateMatchResult,
  updateMatchQuantity,
  removeMatch,
  selectCart,
  setSessionStatus,
  setError,
  clearSession,
} = scanSlice.actions;

// Selectors
interface RootState {
  scan: ScanState;
}

export const selectCurrentSession = (state: RootState): ScanSession | null =>
  state.scan.currentSession;

export const selectIsProcessing = (state: RootState): boolean =>
  state.scan.isProcessing;

export const selectProcessingStep = (state: RootState): ProcessingStep | null =>
  state.scan.processingStep;

export const selectMatchResults = (state: RootState): MatchResult[] =>
  state.scan.currentSession?.matchResults || [];

export const selectError = (state: RootState): string | null =>
  state.scan.error;

export const selectSessionStatus = (state: RootState): ScanSessionStatus | null =>
  state.scan.currentSession?.status || null;

export const selectSelectedCartId = (state: RootState): string | null =>
  state.scan.currentSession?.selectedCartId || null;

export const selectOcrResult = (state: RootState): OcrResult | null =>
  state.scan.currentSession?.ocrResult || null;

// Export reducer
export default scanSlice.reducer;

/**
 * scanSlice Tests
 * TDD: Tests written first to define expected behavior
 */

import scanReducer, {
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
  selectCurrentSession,
  selectIsProcessing,
  selectProcessingStep,
  selectMatchResults,
  selectError,
  setScanError,
  setRetryState,
  selectScanError,
  selectRetryAttempt,
  selectMaxRetries,
} from '../scanSlice';
import { ScanState, ScanError, OcrResult, MatchResult, MatchConfidence } from '../../types/scanning.types';
import { Item } from '../../../../domain/types/picking';

// Mock items for testing
const mockItem: Item = {
  id: 'dal-1',
  categoryId: 'dal-pulses',
  name: 'Toor Dal',
  unit: 'kg',
  defaultQuantity: 1,
};

const mockMatchResult: MatchResult = {
  parsedItem: {
    rawText: 'Toor Dal 1 kg',
    itemName: 'Toor Dal',
    quantity: 1,
    unit: 'kg',
    language: 'en',
    lineIndex: 0,
  },
  matchedItem: mockItem,
  confidence: 'exact' as MatchConfidence,
  confidenceScore: 100,
  alternatives: [],
};

const mockOcrResult: OcrResult = {
  success: true,
  rawText: 'Toor Dal 1 kg',
  lines: ['Toor Dal 1 kg'],
  detectedLanguage: 'en',
};

describe('scanSlice', () => {
  const initialState: ScanState = {
    currentSession: null,
    isProcessing: false,
    processingStep: null,
    error: null,
    scanError: null,
    retryAttempt: 0,
    maxRetries: 2,
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      const state = scanReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('startSession', () => {
    it('should create a new session with image URI', () => {
      const imageUri = 'file://test-image.jpg';
      const state = scanReducer(initialState, startSession(imageUri));

      expect(state.currentSession).not.toBeNull();
      expect(state.currentSession?.imageUri).toBe(imageUri);
      expect(state.currentSession?.status).toBe('capturing');
      expect(state.currentSession?.id).toBeDefined();
      expect(state.currentSession?.matchResults).toEqual([]);
      expect(state.currentSession?.selectedCartId).toBeNull();
      expect(state.currentSession?.ocrResult).toBeNull();
    });

    it('should clear previous session when starting new one', () => {
      const stateWithSession: ScanState = {
        ...initialState,
        currentSession: {
          id: 'old-session',
          imageUri: 'old-image.jpg',
          status: 'reviewing',
          matchResults: [mockMatchResult],
          selectedCartId: 'cart-1',
          ocrResult: mockOcrResult,
          createdAt: new Date().toISOString(),
        },
      };

      const newState = scanReducer(stateWithSession, startSession('new-image.jpg'));

      expect(newState.currentSession?.id).not.toBe('old-session');
      expect(newState.currentSession?.imageUri).toBe('new-image.jpg');
      expect(newState.currentSession?.matchResults).toEqual([]);
    });
  });

  describe('setProcessing', () => {
    it('should set processing state to true with step', () => {
      const stateWithSession: ScanState = {
        ...initialState,
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'capturing',
          matchResults: [],
          selectedCartId: null,
          ocrResult: null,
          createdAt: new Date().toISOString(),
        },
      };

      const state = scanReducer(stateWithSession, setProcessing('ocr'));

      expect(state.isProcessing).toBe(true);
      expect(state.processingStep).toBe('ocr');
      expect(state.currentSession?.status).toBe('processing');
    });

    it('should update processing step', () => {
      const processingState: ScanState = {
        ...initialState,
        isProcessing: true,
        processingStep: 'ocr',
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'processing',
          matchResults: [],
          selectedCartId: null,
          ocrResult: null,
          createdAt: new Date().toISOString(),
        },
      };

      const state = scanReducer(processingState, setProcessing('matching'));

      expect(state.processingStep).toBe('matching');
    });
  });

  describe('setOcrResult', () => {
    it('should set OCR result on session', () => {
      const stateWithSession: ScanState = {
        ...initialState,
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'processing',
          matchResults: [],
          selectedCartId: null,
          ocrResult: null,
          createdAt: new Date().toISOString(),
        },
      };

      const state = scanReducer(stateWithSession, setOcrResult(mockOcrResult));

      expect(state.currentSession?.ocrResult).toEqual(mockOcrResult);
    });
  });

  describe('setMatchResults', () => {
    it('should set match results and update status to reviewing', () => {
      const stateWithSession: ScanState = {
        ...initialState,
        isProcessing: true,
        processingStep: 'matching',
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'processing',
          matchResults: [],
          selectedCartId: null,
          ocrResult: mockOcrResult,
          createdAt: new Date().toISOString(),
        },
      };

      const state = scanReducer(stateWithSession, setMatchResults([mockMatchResult]));

      expect(state.currentSession?.matchResults).toHaveLength(1);
      expect(state.currentSession?.matchResults[0]).toEqual(mockMatchResult);
      expect(state.currentSession?.status).toBe('reviewing');
      expect(state.isProcessing).toBe(false);
      expect(state.processingStep).toBeNull();
    });
  });

  describe('updateMatchResult', () => {
    it('should update a match result with user override', () => {
      const newItem: Item = {
        id: 'dal-2',
        categoryId: 'dal-pulses',
        name: 'Moong Dal',
        unit: 'kg',
        defaultQuantity: 1,
      };

      const stateWithMatches: ScanState = {
        ...initialState,
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'reviewing',
          matchResults: [mockMatchResult],
          selectedCartId: null,
          ocrResult: mockOcrResult,
          createdAt: new Date().toISOString(),
        },
      };

      const state = scanReducer(
        stateWithMatches,
        updateMatchResult({
          index: 0,
          matchedItem: newItem,
          confidence: 'exact',
          confidenceScore: 100,
        })
      );

      expect(state.currentSession?.matchResults[0].matchedItem?.id).toBe('dal-2');
      expect(state.currentSession?.matchResults[0].userOverride).toBeDefined();
      expect(state.currentSession?.matchResults[0].userOverride?.selectedItemId).toBe('dal-2');
    });

    it('should not update if index is out of bounds', () => {
      const stateWithMatches: ScanState = {
        ...initialState,
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'reviewing',
          matchResults: [mockMatchResult],
          selectedCartId: null,
          ocrResult: mockOcrResult,
          createdAt: new Date().toISOString(),
        },
      };

      const state = scanReducer(
        stateWithMatches,
        updateMatchResult({
          index: 5,
          matchedItem: mockItem,
          confidence: 'exact',
          confidenceScore: 100,
        })
      );

      expect(state.currentSession?.matchResults).toHaveLength(1);
    });
  });

  describe('updateMatchQuantity', () => {
    it('should update quantity in user override', () => {
      const stateWithMatches: ScanState = {
        ...initialState,
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'reviewing',
          matchResults: [mockMatchResult],
          selectedCartId: null,
          ocrResult: mockOcrResult,
          createdAt: new Date().toISOString(),
        },
      };

      const state = scanReducer(
        stateWithMatches,
        updateMatchQuantity({ index: 0, quantity: 5 })
      );

      expect(state.currentSession?.matchResults[0].userOverride?.selectedQuantity).toBe(5);
    });
  });

  describe('removeMatch', () => {
    it('should mark match as skipped', () => {
      const stateWithMatches: ScanState = {
        ...initialState,
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'reviewing',
          matchResults: [mockMatchResult],
          selectedCartId: null,
          ocrResult: mockOcrResult,
          createdAt: new Date().toISOString(),
        },
      };

      const state = scanReducer(stateWithMatches, removeMatch(0));

      expect(state.currentSession?.matchResults[0].isSkipped).toBe(true);
    });
  });

  describe('selectCart', () => {
    it('should set selected cart ID', () => {
      const stateWithSession: ScanState = {
        ...initialState,
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'reviewing',
          matchResults: [],
          selectedCartId: null,
          ocrResult: mockOcrResult,
          createdAt: new Date().toISOString(),
        },
      };

      const state = scanReducer(stateWithSession, selectCart('cart-123'));

      expect(state.currentSession?.selectedCartId).toBe('cart-123');
    });
  });

  describe('setSessionStatus', () => {
    it('should update session status', () => {
      const stateWithSession: ScanState = {
        ...initialState,
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'reviewing',
          matchResults: [],
          selectedCartId: null,
          ocrResult: mockOcrResult,
          createdAt: new Date().toISOString(),
        },
      };

      const state = scanReducer(stateWithSession, setSessionStatus('completed'));

      expect(state.currentSession?.status).toBe('completed');
    });
  });

  describe('setError', () => {
    it('should set error and update session status', () => {
      const stateWithSession: ScanState = {
        ...initialState,
        isProcessing: true,
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'processing',
          matchResults: [],
          selectedCartId: null,
          ocrResult: null,
          createdAt: new Date().toISOString(),
        },
      };

      const state = scanReducer(stateWithSession, setError('OCR failed'));

      expect(state.error).toBe('OCR failed');
      expect(state.isProcessing).toBe(false);
      expect(state.currentSession?.status).toBe('error');
    });
  });

  describe('clearSession', () => {
    it('should reset all state to initial', () => {
      const fullState: ScanState = {
        isProcessing: true,
        processingStep: 'matching',
        error: 'Some error',
        scanError: {
          type: 'api_error',
          message: 'Server error',
          retryable: true,
        },
        retryAttempt: 2,
        maxRetries: 2,
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'reviewing',
          matchResults: [mockMatchResult],
          selectedCartId: 'cart-1',
          ocrResult: mockOcrResult,
          createdAt: new Date().toISOString(),
        },
      };

      const state = scanReducer(fullState, clearSession());

      expect(state).toEqual(initialState);
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      scan: {
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'reviewing' as const,
          matchResults: [mockMatchResult],
          selectedCartId: 'cart-1',
          ocrResult: mockOcrResult,
          createdAt: new Date().toISOString(),
        },
        isProcessing: true,
        processingStep: 'matching' as const,
        error: 'Test error',
        scanError: {
          type: 'timeout' as const,
          message: 'Request timed out',
          retryable: true,
        },
        retryAttempt: 1,
        maxRetries: 2,
      },
    };

    it('selectCurrentSession should return current session', () => {
      expect(selectCurrentSession(mockRootState)).toBe(mockRootState.scan.currentSession);
    });

    it('selectIsProcessing should return processing state', () => {
      expect(selectIsProcessing(mockRootState)).toBe(true);
    });

    it('selectProcessingStep should return current step', () => {
      expect(selectProcessingStep(mockRootState)).toBe('matching');
    });

    it('selectMatchResults should return match results', () => {
      expect(selectMatchResults(mockRootState)).toEqual([mockMatchResult]);
    });

    it('selectMatchResults should return empty array if no session', () => {
      const noSessionState = { scan: { ...mockRootState.scan, currentSession: null } };
      expect(selectMatchResults(noSessionState)).toEqual([]);
    });

    it('selectError should return error', () => {
      expect(selectError(mockRootState)).toBe('Test error');
    });

    it('selectScanError should return structured scan error', () => {
      expect(selectScanError(mockRootState)).toEqual({
        type: 'timeout',
        message: 'Request timed out',
        retryable: true,
      });
    });

    it('selectScanError should return null when no error', () => {
      const noErrorState = {
        scan: { ...mockRootState.scan, scanError: null },
      };
      expect(selectScanError(noErrorState)).toBeNull();
    });

    it('selectRetryAttempt should return current retry attempt', () => {
      expect(selectRetryAttempt(mockRootState)).toBe(1);
    });

    it('selectMaxRetries should return max retries', () => {
      expect(selectMaxRetries(mockRootState)).toBe(2);
    });
  });

  describe('setScanError', () => {
    it('should set structured scan error with type, message, and retryable', () => {
      const stateWithSession: ScanState = {
        ...initialState,
        isProcessing: true,
        processingStep: 'ocr',
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'processing',
          matchResults: [],
          selectedCartId: null,
          ocrResult: null,
          createdAt: new Date().toISOString(),
        },
      };

      const scanError: ScanError = {
        type: 'timeout',
        message: 'Request timed out. Please try again.',
        retryable: true,
      };

      const state = scanReducer(stateWithSession, setScanError(scanError));

      expect(state.scanError).toEqual(scanError);
      expect(state.isProcessing).toBe(false);
      expect(state.currentSession?.status).toBe('error');
    });

    it('should set non-retryable error for cancelled scans', () => {
      const stateWithSession: ScanState = {
        ...initialState,
        isProcessing: true,
        currentSession: {
          id: 'test',
          imageUri: 'test.jpg',
          status: 'processing',
          matchResults: [],
          selectedCartId: null,
          ocrResult: null,
          createdAt: new Date().toISOString(),
        },
      };

      const scanError: ScanError = {
        type: 'cancelled',
        message: 'Scan cancelled.',
        retryable: false,
      };

      const state = scanReducer(stateWithSession, setScanError(scanError));

      expect(state.scanError?.type).toBe('cancelled');
      expect(state.scanError?.retryable).toBe(false);
      expect(state.isProcessing).toBe(false);
    });

    it('should preserve statusCode when provided', () => {
      const scanError: ScanError = {
        type: 'api_error',
        message: 'Server error',
        retryable: true,
        statusCode: 503,
      };

      const state = scanReducer(initialState, setScanError(scanError));

      expect(state.scanError?.statusCode).toBe(503);
    });
  });

  describe('setRetryState', () => {
    it('should set retry attempt and max retries', () => {
      const state = scanReducer(
        initialState,
        setRetryState({ attempt: 1, maxRetries: 3 })
      );

      expect(state.retryAttempt).toBe(1);
      expect(state.maxRetries).toBe(3);
    });

    it('should update retry attempt on subsequent retries', () => {
      const stateAfterFirstRetry: ScanState = {
        ...initialState,
        retryAttempt: 1,
        maxRetries: 3,
      };

      const state = scanReducer(
        stateAfterFirstRetry,
        setRetryState({ attempt: 2, maxRetries: 3 })
      );

      expect(state.retryAttempt).toBe(2);
    });
  });

  describe('startSession clears error/retry state', () => {
    it('should clear scanError and retryAttempt when starting a new session', () => {
      const stateWithError: ScanState = {
        ...initialState,
        scanError: {
          type: 'timeout',
          message: 'Request timed out',
          retryable: true,
        },
        retryAttempt: 2,
        error: 'old error',
      };

      const state = scanReducer(stateWithError, startSession('new-image.jpg'));

      expect(state.scanError).toBeNull();
      expect(state.retryAttempt).toBe(0);
      expect(state.error).toBeNull();
    });
  });

  describe('clearSession clears error/retry state', () => {
    it('should clear scanError and retryAttempt when clearing session', () => {
      const stateWithError: ScanState = {
        ...initialState,
        scanError: {
          type: 'offline',
          message: 'No internet',
          retryable: true,
        },
        retryAttempt: 1,
        isProcessing: true,
        error: 'some error',
      };

      const state = scanReducer(stateWithError, clearSession());

      expect(state.scanError).toBeNull();
      expect(state.retryAttempt).toBe(0);
      expect(state).toEqual(initialState);
    });
  });
});

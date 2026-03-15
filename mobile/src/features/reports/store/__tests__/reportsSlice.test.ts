/**
 * Tests for reportsSlice
 * Following TDD: Write tests first, then implement
 */

import reportsReducer, {
  setDateRange,
  setLoading,
  setError,
  clearError,
  selectSelectedDateRange,
  selectIsReportLoading,
  selectReportError,
  ReportsState,
} from '../reportsSlice';
import { DateRange } from '../../types/reports.types';

describe('reportsSlice', () => {
  describe('reducers', () => {
    describe('setDateRange', () => {
      it('should update selected date range', () => {
        const newRange: DateRange = {
          startDate: '2024-01-10T00:00:00.000Z',
          endDate: '2024-01-20T23:59:59.999Z',
          preset: 'custom',
        };

        const state = reportsReducer(undefined, setDateRange(newRange));

        expect(state.selectedDateRange).toEqual(newRange);
      });

      it('should clear error when date range changes', () => {
        const stateWithError: ReportsState = {
          selectedDateRange: {
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-01T23:59:59.999Z',
            preset: 'today',
          },
          isLoading: false,
          error: 'Some error',
        };

        const newRange: DateRange = {
          startDate: '2024-01-10T00:00:00.000Z',
          endDate: '2024-01-20T23:59:59.999Z',
          preset: 'last7days',
        };

        const state = reportsReducer(stateWithError, setDateRange(newRange));

        expect(state.error).toBeNull();
      });
    });

    describe('setLoading', () => {
      it('should set loading to true', () => {
        const state = reportsReducer(undefined, setLoading(true));

        expect(state.isLoading).toBe(true);
      });

      it('should set loading to false', () => {
        const loadingState: ReportsState = {
          selectedDateRange: {
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-01T23:59:59.999Z',
            preset: 'today',
          },
          isLoading: true,
          error: null,
        };

        const state = reportsReducer(loadingState, setLoading(false));

        expect(state.isLoading).toBe(false);
      });
    });

    describe('setError', () => {
      it('should set error message', () => {
        const state = reportsReducer(undefined, setError('Something went wrong'));

        expect(state.error).toBe('Something went wrong');
      });

      it('should set loading to false when error is set', () => {
        const loadingState: ReportsState = {
          selectedDateRange: {
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-01T23:59:59.999Z',
            preset: 'today',
          },
          isLoading: true,
          error: null,
        };

        const state = reportsReducer(loadingState, setError('Error'));

        expect(state.isLoading).toBe(false);
      });
    });

    describe('clearError', () => {
      it('should clear error message', () => {
        const stateWithError: ReportsState = {
          selectedDateRange: {
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-01T23:59:59.999Z',
            preset: 'today',
          },
          isLoading: false,
          error: 'Some error',
        };

        const state = reportsReducer(stateWithError, clearError());

        expect(state.error).toBeNull();
      });
    });
  });

  describe('selectors', () => {
    const mockState = {
      reports: {
        selectedDateRange: {
          startDate: '2024-01-10T00:00:00.000Z',
          endDate: '2024-01-20T23:59:59.999Z',
          preset: 'last7days' as const,
        },
        isLoading: true,
        error: 'Test error',
      },
    };

    describe('selectSelectedDateRange', () => {
      it('should return selected date range', () => {
        const result = selectSelectedDateRange(mockState);

        expect(result).toEqual(mockState.reports.selectedDateRange);
      });
    });

    describe('selectIsReportLoading', () => {
      it('should return loading state', () => {
        const result = selectIsReportLoading(mockState);

        expect(result).toBe(true);
      });
    });

    describe('selectReportError', () => {
      it('should return error message', () => {
        const result = selectReportError(mockState);

        expect(result).toBe('Test error');
      });

      it('should return null when no error', () => {
        const stateNoError = {
          reports: {
            ...mockState.reports,
            error: null,
          },
        };

        const result = selectReportError(stateNoError);

        expect(result).toBeNull();
      });
    });
  });
});

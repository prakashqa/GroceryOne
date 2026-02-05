/**
 * Reports Slice
 * Redux slice for managing reports state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateRange, ReportsState } from '../types/reports.types';
import { getDateRangeForPreset } from '../utils/dateRangeUtils';

// Initial state with today's date range
const initialState: ReportsState = {
  selectedDateRange: getDateRangeForPreset('today'),
  isLoading: false,
  error: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    /**
     * Set the selected date range
     * Clears any existing error when date range changes
     */
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.selectedDateRange = action.payload;
      state.error = null;
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Set error message
     * Also sets loading to false
     */
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    /**
     * Clear error message
     */
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Export actions
export const { setDateRange, setLoading, setError, clearError } =
  reportsSlice.actions;

// Selectors
interface RootState {
  reports: ReportsState;
}

export const selectSelectedDateRange = (state: RootState): DateRange =>
  state.reports.selectedDateRange;

export const selectIsReportLoading = (state: RootState): boolean =>
  state.reports.isLoading;

export const selectReportError = (state: RootState): string | null =>
  state.reports.error;

// Re-export state type
export type { ReportsState };

// Export reducer
export default reportsSlice.reducer;

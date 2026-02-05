/**
 * Date Range Utilities
 * Helper functions for date range selection and filtering
 */

import { DateRange, DateRangePreset } from '../types/reports.types';

/**
 * Get the start of a day (00:00:00.000)
 */
export const getStartOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get the end of a day (23:59:59.999)
 */
export const getEndOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Get date range based on preset selection
 */
export const getDateRangeForPreset = (preset: DateRangePreset): DateRange => {
  const now = new Date();
  const today = getStartOfDay(now);
  const todayEnd = getEndOfDay(now);

  switch (preset) {
    case 'today': {
      return {
        startDate: today.toISOString(),
        endDate: todayEnd.toISOString(),
        preset,
      };
    }

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: getStartOfDay(yesterday).toISOString(),
        endDate: getEndOfDay(yesterday).toISOString(),
        preset,
      };
    }

    case 'last7days': {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6); // 6 days before today = 7 days total
      return {
        startDate: getStartOfDay(startDate).toISOString(),
        endDate: todayEnd.toISOString(),
        preset,
      };
    }

    case 'last30days': {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29); // 29 days before today = 30 days total
      return {
        startDate: getStartOfDay(startDate).toISOString(),
        endDate: todayEnd.toISOString(),
        preset,
      };
    }

    case 'thisMonth': {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: getStartOfDay(firstOfMonth).toISOString(),
        endDate: todayEnd.toISOString(),
        preset,
      };
    }

    case 'lastMonth': {
      const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: getStartOfDay(firstOfLastMonth).toISOString(),
        endDate: getEndOfDay(lastOfLastMonth).toISOString(),
        preset,
      };
    }

    case 'custom':
    default: {
      // Default to today for custom (user will override)
      return {
        startDate: today.toISOString(),
        endDate: todayEnd.toISOString(),
        preset: 'custom',
      };
    }
  }
};

/**
 * Check if a date is within a given date range (inclusive)
 */
export const isDateInRange = (dateString: string, range: DateRange): boolean => {
  const date = new Date(dateString).getTime();
  const start = new Date(range.startDate).getTime();
  const end = new Date(range.endDate).getTime();

  return date >= start && date <= end;
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (
  dateString: string,
  format: 'short' | 'day' | 'full' = 'short'
): string => {
  const date = new Date(dateString);

  switch (format) {
    case 'day':
      return date.toLocaleDateString('en-US', { weekday: 'short' });

    case 'full':
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

    case 'short':
    default:
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
  }
};

/**
 * Get number of days between two dates (inclusive)
 */
export const getDaysBetween = (startDate: string, endDate: string): number => {
  const start = getStartOfDay(new Date(startDate));
  const end = getStartOfDay(new Date(endDate));

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1; // +1 to include both start and end days
};

/**
 * Generate array of dates between start and end (inclusive)
 */
export const groupDatesByDay = (range: DateRange): string[] => {
  const dates: string[] = [];
  const current = getStartOfDay(new Date(range.startDate));
  const end = getStartOfDay(new Date(range.endDate));

  while (current <= end) {
    dates.push(current.toISOString());
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/**
 * Create a custom date range
 */
export const createCustomDateRange = (
  startDate: Date,
  endDate: Date
): DateRange => {
  return {
    startDate: getStartOfDay(startDate).toISOString(),
    endDate: getEndOfDay(endDate).toISOString(),
    preset: 'custom',
  };
};

/**
 * Get a human-readable label for the date range
 */
export const getDateRangeLabel = (range: DateRange): string => {
  switch (range.preset) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'last7days':
      return 'Last 7 Days';
    case 'last30days':
      return 'Last 30 Days';
    case 'thisMonth':
      return 'This Month';
    case 'lastMonth':
      return 'Last Month';
    case 'custom': {
      const start = formatDateForDisplay(range.startDate, 'short');
      const end = formatDateForDisplay(range.endDate, 'short');
      return `${start} - ${end}`;
    }
    default:
      return 'Custom';
  }
};

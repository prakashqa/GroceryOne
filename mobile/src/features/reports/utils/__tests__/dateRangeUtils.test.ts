/**
 * Tests for dateRangeUtils
 * Following TDD: Write tests first, then implement
 */

import {
  getDateRangeForPreset,
  isDateInRange,
  formatDateForDisplay,
  getStartOfDay,
  getEndOfDay,
  getDaysBetween,
  groupDatesByDay,
} from '../dateRangeUtils';
import { DateRange } from '../../types/reports.types';

describe('dateRangeUtils', () => {
  // Mock current date for consistent testing
  const mockDate = new Date(2024, 0, 15, 12, 0, 0); // Jan 15, 2024 at noon local time

  beforeAll(() => {
    // Mock Date constructor
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('getStartOfDay', () => {
    it('should return start of day (00:00:00.000)', () => {
      const date = new Date(2024, 0, 15, 14, 30, 45, 123);
      const result = getStartOfDay(date);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should preserve the date', () => {
      const date = new Date(2024, 0, 15, 14, 30, 45, 123);
      const result = getStartOfDay(date);

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });
  });

  describe('getEndOfDay', () => {
    it('should return end of day (23:59:59.999)', () => {
      const date = new Date(2024, 0, 15, 14, 30, 45, 123);
      const result = getEndOfDay(date);

      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });

    it('should preserve the date', () => {
      const date = new Date(2024, 0, 15, 14, 30, 45, 123);
      const result = getEndOfDay(date);

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });
  });

  describe('getDateRangeForPreset', () => {
    describe('today preset', () => {
      it('should return start and end of today', () => {
        const result = getDateRangeForPreset('today');

        expect(result.preset).toBe('today');
        expect(new Date(result.startDate).getDate()).toBe(15);
        expect(new Date(result.endDate).getDate()).toBe(15);
      });

      it('should have start time at 00:00:00', () => {
        const result = getDateRangeForPreset('today');
        const startDate = new Date(result.startDate);

        expect(startDate.getHours()).toBe(0);
        expect(startDate.getMinutes()).toBe(0);
        expect(startDate.getSeconds()).toBe(0);
      });

      it('should have end time at 23:59:59', () => {
        const result = getDateRangeForPreset('today');
        const endDate = new Date(result.endDate);

        expect(endDate.getHours()).toBe(23);
        expect(endDate.getMinutes()).toBe(59);
        expect(endDate.getSeconds()).toBe(59);
      });
    });

    describe('yesterday preset', () => {
      it('should return start and end of yesterday', () => {
        const result = getDateRangeForPreset('yesterday');

        expect(result.preset).toBe('yesterday');
        expect(new Date(result.startDate).getDate()).toBe(14);
        expect(new Date(result.endDate).getDate()).toBe(14);
      });
    });

    describe('last7days preset', () => {
      it('should return range from 7 days ago to today', () => {
        const result = getDateRangeForPreset('last7days');
        const startDate = new Date(result.startDate);
        const endDate = new Date(result.endDate);

        expect(result.preset).toBe('last7days');
        // Start should be 6 days before today (7 days including today)
        expect(startDate.getDate()).toBe(9); // Jan 15 - 6 = Jan 9
        expect(endDate.getDate()).toBe(15);
      });

      it('should include exactly 7 days', () => {
        const result = getDateRangeForPreset('last7days');
        const days = getDaysBetween(result.startDate, result.endDate);

        expect(days).toBe(7);
      });
    });

    describe('last30days preset', () => {
      it('should return range from 30 days ago to today', () => {
        const result = getDateRangeForPreset('last30days');
        const endDate = new Date(result.endDate);

        expect(result.preset).toBe('last30days');
        expect(endDate.getDate()).toBe(15);
      });

      it('should include exactly 30 days', () => {
        const result = getDateRangeForPreset('last30days');
        const days = getDaysBetween(result.startDate, result.endDate);

        expect(days).toBe(30);
      });
    });

    describe('thisMonth preset', () => {
      it('should return range from first of month to today', () => {
        const result = getDateRangeForPreset('thisMonth');
        const startDate = new Date(result.startDate);
        const endDate = new Date(result.endDate);

        expect(result.preset).toBe('thisMonth');
        expect(startDate.getDate()).toBe(1);
        expect(startDate.getMonth()).toBe(0); // January
        expect(endDate.getDate()).toBe(15);
      });
    });

    describe('lastMonth preset', () => {
      it('should return range for entire last month', () => {
        const result = getDateRangeForPreset('lastMonth');
        const startDate = new Date(result.startDate);
        const endDate = new Date(result.endDate);

        expect(result.preset).toBe('lastMonth');
        // Last month is December 2023
        expect(startDate.getMonth()).toBe(11); // December
        expect(startDate.getDate()).toBe(1);
        expect(endDate.getMonth()).toBe(11); // December
        expect(endDate.getDate()).toBe(31);
      });
    });

    describe('custom preset', () => {
      it('should return default range for today when custom', () => {
        const result = getDateRangeForPreset('custom');

        expect(result.preset).toBe('custom');
        // Default to today's range
        expect(new Date(result.startDate).getDate()).toBe(15);
      });
    });
  });

  describe('isDateInRange', () => {
    // Use local time dates for range
    const startOfRange = new Date(2024, 0, 10, 0, 0, 0, 0);
    const endOfRange = new Date(2024, 0, 20, 23, 59, 59, 999);
    const range: DateRange = {
      startDate: startOfRange.toISOString(),
      endDate: endOfRange.toISOString(),
      preset: 'custom',
    };

    it('should return true for date within range', () => {
      const midDate = new Date(2024, 0, 15, 12, 0, 0);
      expect(isDateInRange(midDate.toISOString(), range)).toBe(true);
    });

    it('should return true for start date (inclusive)', () => {
      expect(isDateInRange(startOfRange.toISOString(), range)).toBe(true);
    });

    it('should return true for end date (inclusive)', () => {
      expect(isDateInRange(endOfRange.toISOString(), range)).toBe(true);
    });

    it('should return false for date before range', () => {
      const beforeDate = new Date(2024, 0, 9, 23, 59, 59, 999);
      expect(isDateInRange(beforeDate.toISOString(), range)).toBe(false);
    });

    it('should return false for date after range', () => {
      const afterDate = new Date(2024, 0, 21, 0, 0, 0, 0);
      expect(isDateInRange(afterDate.toISOString(), range)).toBe(false);
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format date as short format (Jan 15)', () => {
      const date = new Date(2024, 0, 15, 12, 0, 0);
      const result = formatDateForDisplay(date.toISOString(), 'short');
      expect(result).toMatch(/Jan\s*15/i);
    });

    it('should format date as full format with month, day, year', () => {
      const date = new Date(2024, 0, 15, 12, 0, 0);
      const result = formatDateForDisplay(date.toISOString(), 'full');
      expect(result).toMatch(/January/i);
      expect(result).toMatch(/15/);
      expect(result).toMatch(/2024/);
    });

    it('should default to short format', () => {
      const date = new Date(2024, 0, 15, 12, 0, 0);
      const shortResult = formatDateForDisplay(date.toISOString(), 'short');
      const defaultResult = formatDateForDisplay(date.toISOString());
      expect(defaultResult).toBe(shortResult);
    });
  });

  describe('getDaysBetween', () => {
    it('should return 1 for same day', () => {
      const start = new Date(2024, 0, 15, 0, 0, 0, 0);
      const end = new Date(2024, 0, 15, 23, 59, 59, 999);
      const result = getDaysBetween(start.toISOString(), end.toISOString());
      expect(result).toBe(1);
    });

    it('should return correct number of days for range', () => {
      const start = new Date(2024, 0, 10, 0, 0, 0, 0);
      const end = new Date(2024, 0, 15, 23, 59, 59, 999);
      const result = getDaysBetween(start.toISOString(), end.toISOString());
      expect(result).toBe(6);
    });

    it('should handle month boundaries', () => {
      const start = new Date(2024, 0, 28, 0, 0, 0, 0);
      const end = new Date(2024, 1, 3, 23, 59, 59, 999);
      const result = getDaysBetween(start.toISOString(), end.toISOString());
      expect(result).toBe(7);
    });
  });

  describe('groupDatesByDay', () => {
    it('should generate array of dates between start and end', () => {
      const start = new Date(2024, 0, 10, 0, 0, 0, 0);
      const end = new Date(2024, 0, 12, 23, 59, 59, 999);
      const range: DateRange = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        preset: 'custom',
      };

      const result = groupDatesByDay(range);

      expect(result).toHaveLength(3);
      expect(new Date(result[0]).getDate()).toBe(10);
      expect(new Date(result[1]).getDate()).toBe(11);
      expect(new Date(result[2]).getDate()).toBe(12);
    });

    it('should return single date for same day range', () => {
      const start = new Date(2024, 0, 15, 0, 0, 0, 0);
      const end = new Date(2024, 0, 15, 23, 59, 59, 999);
      const range: DateRange = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        preset: 'today',
      };

      const result = groupDatesByDay(range);

      expect(result).toHaveLength(1);
    });
  });
});

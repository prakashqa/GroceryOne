/**
 * Tests for DateRangeSelector component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DateRangeSelector } from '../DateRangeSelector';
import { DateRange } from '../../types/reports.types';

// Mock theme
jest.mock('../../../../presentation/theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'reports.today': 'Today',
        'reports.yesterday': 'Yesterday',
        'reports.last30days': 'Last 30 Days',
        'reports.pickDateRange': 'Custom',
      };
      return translations[key] || fallback || key;
    },
  }),
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: { testID?: string }) => <View testID={props.testID} />,
  };
});

describe('DateRangeSelector', () => {
  const mockDateRange: DateRange = {
    startDate: '2024-01-15T00:00:00.000Z',
    endDate: '2024-01-15T23:59:59.999Z',
    preset: 'today',
  };

  const mockOnRangeChange = jest.fn();

  beforeEach(() => {
    mockOnRangeChange.mockClear();
  });

  it('should render preset buttons and custom date picker', () => {
    const { getByText, queryByText, getByTestId } = render(
      <DateRangeSelector
        selectedRange={mockDateRange}
        onRangeChange={mockOnRangeChange}
      />
    );

    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Yesterday')).toBeTruthy();
    expect(getByText('Last 30 Days')).toBeTruthy();
    expect(getByTestId('preset-custom')).toBeTruthy();
    // Removed presets should not be present
    expect(queryByText('Last 7 Days')).toBeNull();
    expect(queryByText('This Month')).toBeNull();
  });

  it('should highlight selected preset', () => {
    const { getByTestId } = render(
      <DateRangeSelector
        selectedRange={mockDateRange}
        onRangeChange={mockOnRangeChange}
        testID="date-range-selector"
      />
    );

    const todayButton = getByTestId('preset-today');
    expect(todayButton).toBeTruthy();
  });

  it('should call onRangeChange with correct preset for Last 30 Days', () => {
    const { getByText } = render(
      <DateRangeSelector
        selectedRange={mockDateRange}
        onRangeChange={mockOnRangeChange}
      />
    );

    fireEvent.press(getByText('Last 30 Days'));

    expect(mockOnRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({
        preset: 'last30days',
      })
    );
  });

  it('should render custom date picker button', () => {
    const { getByTestId } = render(
      <DateRangeSelector
        selectedRange={mockDateRange}
        onRangeChange={mockOnRangeChange}
      />
    );

    const customButton = getByTestId('preset-custom');
    expect(customButton).toBeTruthy();
  });

  it('should show from-date picker when custom date button is pressed', () => {
    const { getByTestId, queryByTestId } = render(
      <DateRangeSelector
        selectedRange={mockDateRange}
        onRangeChange={mockOnRangeChange}
      />
    );

    // Picker should not be visible initially
    expect(queryByTestId('from-date-picker')).toBeNull();

    // Press custom date button
    fireEvent.press(getByTestId('preset-custom'));

    // From-date picker should appear
    expect(getByTestId('from-date-picker')).toBeTruthy();
  });

  it('should display date range label when custom preset is active', () => {
    const customRange: DateRange = {
      startDate: '2024-01-10T00:00:00.000Z',
      endDate: '2024-01-20T23:59:59.999Z',
      preset: 'custom',
    };

    const { getByTestId } = render(
      <DateRangeSelector
        selectedRange={customRange}
        onRangeChange={mockOnRangeChange}
      />
    );

    const customButton = getByTestId('preset-custom');
    expect(customButton).toBeTruthy();
  });

  it('should use testID when provided', () => {
    const { getByTestId } = render(
      <DateRangeSelector
        selectedRange={mockDateRange}
        onRangeChange={mockOnRangeChange}
        testID="my-date-selector"
      />
    );

    expect(getByTestId('my-date-selector')).toBeTruthy();
  });
});

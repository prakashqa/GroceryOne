/**
 * Tests for DateFilterBar component
 * Date filter component for ManageCartsScreen
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DateFilterBar } from '../DateFilterBar';

// Mock theme
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'manageCarts.today': 'Today',
        'manageCarts.yesterday': 'Yesterday',
        'manageCarts.pickDate': 'Pick Date',
        'manageCarts.allCarts': 'All',
      };
      return translations[key] || key;
    },
  }),
}));

describe('DateFilterBar', () => {
  const mockOnFilterChange = jest.fn();
  const mockOnDatePick = jest.fn();

  beforeEach(() => {
    mockOnFilterChange.mockClear();
    mockOnDatePick.mockClear();
  });

  it('should render all filter buttons', () => {
    const { getByText } = render(
      <DateFilterBar
        selectedFilter="today"
        onFilterChange={mockOnFilterChange}
        onDatePick={mockOnDatePick}
      />
    );

    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Yesterday')).toBeTruthy();
    expect(getByText('Pick Date')).toBeTruthy();
  });

  it('should highlight selected filter (Today)', () => {
    const { getByTestId } = render(
      <DateFilterBar
        selectedFilter="today"
        onFilterChange={mockOnFilterChange}
        onDatePick={mockOnDatePick}
        testID="date-filter-bar"
      />
    );

    const todayButton = getByTestId('filter-today');
    expect(todayButton).toBeTruthy();
  });

  it('should highlight selected filter (Yesterday)', () => {
    const { getByTestId } = render(
      <DateFilterBar
        selectedFilter="yesterday"
        onFilterChange={mockOnFilterChange}
        onDatePick={mockOnDatePick}
        testID="date-filter-bar"
      />
    );

    const yesterdayButton = getByTestId('filter-yesterday');
    expect(yesterdayButton).toBeTruthy();
  });

  it('should call onFilterChange when Today is tapped', () => {
    const { getByText } = render(
      <DateFilterBar
        selectedFilter="yesterday"
        onFilterChange={mockOnFilterChange}
        onDatePick={mockOnDatePick}
      />
    );

    fireEvent.press(getByText('Today'));

    expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
    expect(mockOnFilterChange).toHaveBeenCalledWith('today');
  });

  it('should call onFilterChange when Yesterday is tapped', () => {
    const { getByText } = render(
      <DateFilterBar
        selectedFilter="today"
        onFilterChange={mockOnFilterChange}
        onDatePick={mockOnDatePick}
      />
    );

    fireEvent.press(getByText('Yesterday'));

    expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
    expect(mockOnFilterChange).toHaveBeenCalledWith('yesterday');
  });

  it('should call onDatePick when Pick Date is tapped', () => {
    const { getByText } = render(
      <DateFilterBar
        selectedFilter="today"
        onFilterChange={mockOnFilterChange}
        onDatePick={mockOnDatePick}
      />
    );

    fireEvent.press(getByText('Pick Date'));

    expect(mockOnDatePick).toHaveBeenCalledTimes(1);
  });

  it('should show custom date when selectedFilter is custom', () => {
    const customDate = new Date('2024-06-15');
    const { getByText } = render(
      <DateFilterBar
        selectedFilter="custom"
        selectedDate={customDate}
        onFilterChange={mockOnFilterChange}
        onDatePick={mockOnDatePick}
      />
    );

    // Should show the formatted date
    expect(getByText('Jun 15')).toBeTruthy();
  });

  it('should use testID when provided', () => {
    const { getByTestId } = render(
      <DateFilterBar
        selectedFilter="today"
        onFilterChange={mockOnFilterChange}
        onDatePick={mockOnDatePick}
        testID="my-filter-bar"
      />
    );

    expect(getByTestId('my-filter-bar')).toBeTruthy();
  });

  it('should render All filter button when showAll is true', () => {
    const { getByText } = render(
      <DateFilterBar
        selectedFilter="today"
        onFilterChange={mockOnFilterChange}
        onDatePick={mockOnDatePick}
        showAll={true}
      />
    );

    expect(getByText('All')).toBeTruthy();
  });

  it('should call onFilterChange with all when All is tapped', () => {
    const { getByText } = render(
      <DateFilterBar
        selectedFilter="today"
        onFilterChange={mockOnFilterChange}
        onDatePick={mockOnDatePick}
        showAll={true}
      />
    );

    fireEvent.press(getByText('All'));

    expect(mockOnFilterChange).toHaveBeenCalledWith('all');
  });
});

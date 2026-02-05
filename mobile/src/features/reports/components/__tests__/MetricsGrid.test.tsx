/**
 * Tests for MetricsGrid component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { MetricsGrid } from '../MetricsGrid';
import { ReportMetrics } from '../../types/reports.types';

// Mock theme
jest.mock('../../../../presentation/theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#2E7D32',
      success: '#4CAF50',
      warning: '#FF9800',
      info: '#2196F3',
      surface: '#FFFFFF',
      background: '#F5F5F5',
      text: '#000000',
      textSecondary: '#666666',
      card: '#FFFFFF',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
    },
    shadows: {
      sm: {},
    },
    animation: {
      normal: 200,
    },
  }),
  useIsDarkMode: () => false,
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'reports.totalSales': 'Total Sales',
        'reports.totalCarts': 'Total Carts',
        'reports.itemsSold': 'Items Sold',
        'reports.avgCartValue': 'Avg Cart Value',
        'reports.paidCarts': 'Paid Carts',
        'reports.pendingCarts': 'Pending',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock SummaryCard
jest.mock('../../../../presentation/components/dashboard/SummaryCard', () => ({
  SummaryCard: ({ title, value, testID }: { title: string; value: string | number; testID?: string }) => {
    const { View, Text } = require('react-native');
    return (
      <View testID={testID}>
        <Text>{title}</Text>
        <Text>{value}</Text>
      </View>
    );
  },
}));

describe('MetricsGrid', () => {
  const mockMetrics: ReportMetrics = {
    totalSales: 15000,
    totalCarts: 25,
    totalItemsSold: 45,
    totalQuantitySold: 120,
    averageCartValue: 600,
    paidCartsCount: 20,
    unpaidCartsCount: 5,
  };

  it('should render all metric cards', () => {
    const { getByText } = render(
      <MetricsGrid metrics={mockMetrics} />
    );

    expect(getByText('Total Sales')).toBeTruthy();
    expect(getByText('Total Carts')).toBeTruthy();
    expect(getByText('Items Sold')).toBeTruthy();
    expect(getByText('Avg Cart Value')).toBeTruthy();
  });

  it('should display formatted sales value', () => {
    const { getByText } = render(
      <MetricsGrid metrics={mockMetrics} />
    );

    // Should display formatted currency
    expect(getByText(/15,000/)).toBeTruthy();
  });

  it('should display cart count', () => {
    const { getByText } = render(
      <MetricsGrid metrics={mockMetrics} />
    );

    expect(getByText('25')).toBeTruthy();
  });

  it('should display items sold count', () => {
    const { getByText } = render(
      <MetricsGrid metrics={mockMetrics} />
    );

    expect(getByText('45')).toBeTruthy();
  });

  it('should display average cart value', () => {
    const { getByText } = render(
      <MetricsGrid metrics={mockMetrics} />
    );

    expect(getByText(/600/)).toBeTruthy();
  });

  it('should use testID when provided', () => {
    const { getByTestId } = render(
      <MetricsGrid metrics={mockMetrics} testID="metrics-grid" />
    );

    expect(getByTestId('metrics-grid')).toBeTruthy();
  });

  it('should handle zero values', () => {
    const zeroMetrics: ReportMetrics = {
      totalSales: 0,
      totalCarts: 0,
      totalItemsSold: 0,
      totalQuantitySold: 0,
      averageCartValue: 0,
      paidCartsCount: 0,
      unpaidCartsCount: 0,
    };

    const { getAllByText } = render(
      <MetricsGrid metrics={zeroMetrics} />
    );

    // Should still render with zero values - multiple cards will show '0'
    expect(getAllByText('0').length).toBeGreaterThanOrEqual(2);
    // Total sales and avg cart value show ₹0
    expect(getAllByText(/₹0/).length).toBeGreaterThanOrEqual(1);
  });
});

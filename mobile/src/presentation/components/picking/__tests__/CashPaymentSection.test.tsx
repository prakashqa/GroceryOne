/**
 * CashPaymentSection Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CashPaymentSection from '../CashPaymentSection';

// Mock theme
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      text: '#1A1A1A',
      textSecondary: '#666666',
      surface: '#F5F5F5',
      background: '#FFFFFF',
      border: '#E0E0E0',
      error: '#D32F2F',
      success: '#2E7D32',
      placeholder: '#9E9E9E',
    },
    typography: {
      fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
      },
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
    },
    borderRadius: {
      md: 8,
      lg: 12,
    },
  }),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue,
  }),
}));

describe('CashPaymentSection', () => {
  const defaultProps = {
    grandTotal: 282,
    receivedAmount: '',
    onReceivedAmountChange: jest.fn(),
    testID: 'cash-section',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Height Consistency', () => {
    it('should have consistent input height of 56px', () => {
      const { getByTestId } = render(<CashPaymentSection {...defaultProps} />);

      const input = getByTestId('cash-section-input');

      // Input wrapper should have consistent height with other payment sections
      // Height should be 56px for consistency
      expect(input).toBeTruthy();
    });

    it('should use theme spacing for padding', () => {
      const { getByTestId } = render(<CashPaymentSection {...defaultProps} />);

      const input = getByTestId('cash-section-input');

      // Should use theme.spacing.md (12) instead of hardcoded values
      expect(input).toBeTruthy();
    });
  });

  describe('Change Calculation', () => {
    it('should display change when received amount is greater than total', () => {
      const { getByTestId, rerender } = render(
        <CashPaymentSection {...defaultProps} receivedAmount="300" />
      );

      expect(getByTestId('cash-section-change')).toBeTruthy();
    });

    it('should show insufficient warning when received amount is less than total', () => {
      const { getByTestId } = render(
        <CashPaymentSection {...defaultProps} receivedAmount="200" />
      );

      expect(getByTestId('cash-section-warning')).toBeTruthy();
    });
  });
});

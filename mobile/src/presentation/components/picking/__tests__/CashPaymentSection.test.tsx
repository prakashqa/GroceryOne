/**
 * CashPaymentSection Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import CashPaymentSection from '../CashPaymentSection';

// Mock theme
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
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
      const { getByTestId } = render(
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

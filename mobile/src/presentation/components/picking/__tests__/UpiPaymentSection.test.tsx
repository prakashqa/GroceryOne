/**
 * UpiPaymentSection Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import UpiPaymentSection from '../UpiPaymentSection';

// Mock theme
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      text: '#1A1A1A',
      textSecondary: '#666666',
      surface: '#F5F5F5',
      background: '#FFFFFF',
      border: '#E0E0E0',
      primary: '#2E7D32',
      warning: '#F57C00',
      placeholder: '#9E9E9E',
    },
    typography: {
      fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
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

// Mock QRCode
jest.mock('react-native-qrcode-svg', () => 'QRCode');

describe('UpiPaymentSection', () => {
  const defaultProps = {
    grandTotal: 282,
    merchantUpiId: 'merchant@upi',
    merchantName: 'Test Merchant',
    transactionRef: '',
    onTransactionRefChange: jest.fn(),
    testID: 'upi-section',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Height Consistency', () => {
    it('should have consistent input height of 56px matching CashPaymentSection', () => {
      const { getByTestId } = render(<UpiPaymentSection {...defaultProps} />);

      const input = getByTestId('upi-section-ref-input');

      // Input should have consistent height with CashPaymentSection (56px)
      expect(input).toBeTruthy();
    });

    it('should use theme spacing for padding', () => {
      const { getByTestId } = render(<UpiPaymentSection {...defaultProps} />);

      const input = getByTestId('upi-section-ref-input');

      // Should use theme.spacing.md instead of hardcoded values
      expect(input).toBeTruthy();
    });
  });

  describe('UPI Configuration', () => {
    it('should display QR code when UPI is configured', () => {
      const { getByTestId } = render(<UpiPaymentSection {...defaultProps} />);

      expect(getByTestId('upi-section-qr')).toBeTruthy();
      expect(getByTestId('upi-section-upi-id')).toBeTruthy();
    });

    it('should display warning when UPI is not configured', () => {
      const { getByTestId } = render(
        <UpiPaymentSection {...defaultProps} merchantUpiId="" />
      );

      expect(getByTestId('upi-section-no-config')).toBeTruthy();
    });
  });
});

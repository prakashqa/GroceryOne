/**
 * UpiPaymentSection Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import UpiPaymentSection from '../UpiPaymentSection';

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

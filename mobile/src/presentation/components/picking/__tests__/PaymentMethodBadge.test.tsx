/**
 * PaymentMethodBadge Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import PaymentMethodBadge from '../PaymentMethodBadge';
import {
  createCashPaymentInfo,
  createUpiPaymentInfo,
  createCardPaymentInfo,
} from '../../../../domain/types/payment';

// Mock theme
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      success: '#2E7D32',
      text: '#000000',
    },
    typography: {
      fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
      },
    },
    spacing: {
      xs: 4,
      sm: 8,
    },
    borderRadius: {
      sm: 4,
    },
  }),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue,
  }),
}));

describe('PaymentMethodBadge', () => {
  describe('Cash payment', () => {
    it('should render cash icon and label', () => {
      const paymentInfo = createCashPaymentInfo(200, 0);
      const { getByText } = render(
        <PaymentMethodBadge paymentInfo={paymentInfo} testID="badge" />
      );

      expect(getByText('Cash')).toBeTruthy();
    });
  });

  describe('UPI payment', () => {
    it('should render UPI icon and label', () => {
      const paymentInfo = createUpiPaymentInfo('merchant@upi');
      const { getByText } = render(
        <PaymentMethodBadge paymentInfo={paymentInfo} testID="badge" />
      );

      expect(getByText('UPI')).toBeTruthy();
    });
  });

  describe('Card payment', () => {
    it('should render card label without last 4 digits when not provided', () => {
      const paymentInfo = createCardPaymentInfo();
      const { getByText } = render(
        <PaymentMethodBadge paymentInfo={paymentInfo} testID="badge" />
      );

      expect(getByText('Card')).toBeTruthy();
    });

    it('should render card with last 4 digits when provided', () => {
      const paymentInfo = createCardPaymentInfo('4242');
      const { getByText } = render(
        <PaymentMethodBadge paymentInfo={paymentInfo} testID="badge" />
      );

      expect(getByText('Card ****4242')).toBeTruthy();
    });
  });

  describe('Size variants', () => {
    it('should render in medium size by default', () => {
      const paymentInfo = createCashPaymentInfo(200, 0);
      const { getByTestId } = render(
        <PaymentMethodBadge paymentInfo={paymentInfo} testID="badge" />
      );

      expect(getByTestId('badge')).toBeTruthy();
    });

    it('should render in small size when specified', () => {
      const paymentInfo = createCashPaymentInfo(200, 0);
      const { getByTestId } = render(
        <PaymentMethodBadge paymentInfo={paymentInfo} size="sm" testID="badge" />
      );

      expect(getByTestId('badge')).toBeTruthy();
    });
  });
});

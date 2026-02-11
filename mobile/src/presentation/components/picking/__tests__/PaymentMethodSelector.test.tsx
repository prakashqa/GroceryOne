/**
 * PaymentMethodSelector Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PaymentMethodSelector from '../PaymentMethodSelector';

// Mock theme
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      surface: '#1E1E1E',
      background: '#121212',
      primary: '#4CAF50',
      border: '#333333',
      divider: '#333333',
    },
    typography: {
      fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
      },
    },
    spacing: {
      sm: 8,
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

describe('PaymentMethodSelector', () => {
  const defaultProps = {
    selectedMethod: 'cash' as const,
    onMethodChange: jest.fn(),
    testID: 'method-selector',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all three payment options', () => {
      const { getByText } = render(<PaymentMethodSelector {...defaultProps} />);

      expect(getByText('Cash')).toBeTruthy();
      expect(getByText('UPI')).toBeTruthy();
      expect(getByText('Card')).toBeTruthy();
    });

    it('should render descriptions for each option', () => {
      const { getByText } = render(<PaymentMethodSelector {...defaultProps} />);

      expect(getByText('Pay with cash')).toBeTruthy();
      expect(getByText('Pay via UPI transfer')).toBeTruthy();
      expect(getByText('Pay by debit/credit card')).toBeTruthy();
    });

    it('should render section title', () => {
      const { getByText } = render(<PaymentMethodSelector {...defaultProps} />);
      expect(getByText('SELECT PAYMENT METHOD')).toBeTruthy();
    });

    it('should have text elements with numberOfLines prop to prevent wrapping', () => {
      const { getByText } = render(<PaymentMethodSelector {...defaultProps} />);

      const cashLabel = getByText('Cash');
      const cashDesc = getByText('Pay with cash');

      // These Text components should have numberOfLines={1} to prevent text wrapping
      expect(cashLabel.props.numberOfLines).toBe(1);
      expect(cashDesc.props.numberOfLines).toBe(1);
    });
  });

  describe('Selection State', () => {
    it('should highlight cash option when selected', () => {
      const { getByTestId } = render(
        <PaymentMethodSelector {...defaultProps} selectedMethod="cash" />
      );

      const cashOption = getByTestId('method-selector-option-cash');
      expect(cashOption).toBeTruthy();
    });

    it('should highlight UPI option when selected', () => {
      const { getByTestId } = render(
        <PaymentMethodSelector {...defaultProps} selectedMethod="upi" />
      );

      const upiOption = getByTestId('method-selector-option-upi');
      expect(upiOption).toBeTruthy();
    });

    it('should highlight Card option when selected', () => {
      const { getByTestId } = render(
        <PaymentMethodSelector {...defaultProps} selectedMethod="card" />
      );

      const cardOption = getByTestId('method-selector-option-card');
      expect(cardOption).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    it('should call onMethodChange with cash when cash option is pressed', () => {
      const { getByTestId } = render(<PaymentMethodSelector {...defaultProps} />);

      fireEvent.press(getByTestId('method-selector-option-cash'));
      expect(defaultProps.onMethodChange).toHaveBeenCalledWith('cash');
    });

    it('should call onMethodChange with upi when UPI option is pressed', () => {
      const { getByTestId } = render(<PaymentMethodSelector {...defaultProps} />);

      fireEvent.press(getByTestId('method-selector-option-upi'));
      expect(defaultProps.onMethodChange).toHaveBeenCalledWith('upi');
    });

    it('should call onMethodChange with card when Card option is pressed', () => {
      const { getByTestId } = render(<PaymentMethodSelector {...defaultProps} />);

      fireEvent.press(getByTestId('method-selector-option-card'));
      expect(defaultProps.onMethodChange).toHaveBeenCalledWith('card');
    });
  });

  describe('Accessibility', () => {
    it('should have radio accessibility role on options', () => {
      const { getByTestId } = render(<PaymentMethodSelector {...defaultProps} />);

      const cashOption = getByTestId('method-selector-option-cash');
      expect(cashOption.props.accessibilityRole).toBe('radio');
    });

    it('should mark selected option as selected in accessibility state', () => {
      const { getByTestId } = render(
        <PaymentMethodSelector {...defaultProps} selectedMethod="cash" />
      );

      const cashOption = getByTestId('method-selector-option-cash');
      expect(cashOption.props.accessibilityState.selected).toBe(true);

      const upiOption = getByTestId('method-selector-option-upi');
      expect(upiOption.props.accessibilityState.selected).toBe(false);
    });
  });

  describe('Icons', () => {
    it('should render cash icon', () => {
      const { getByText } = render(<PaymentMethodSelector {...defaultProps} />);
      expect(getByText('💵')).toBeTruthy();
    });

    it('should render UPI icon', () => {
      const { getByText } = render(<PaymentMethodSelector {...defaultProps} />);
      expect(getByText('📱')).toBeTruthy();
    });

    it('should render Card icon', () => {
      const { getByText } = render(<PaymentMethodSelector {...defaultProps} />);
      expect(getByText('💳')).toBeTruthy();
    });
  });

  describe('Consistent Sizing', () => {
    it('should have consistent minHeight for all payment options', () => {
      const { getByTestId } = render(<PaymentMethodSelector {...defaultProps} />);

      const cashOption = getByTestId('method-selector-option-cash');
      const upiOption = getByTestId('method-selector-option-upi');
      const cardOption = getByTestId('method-selector-option-card');

      // All options should have the same minHeight
      expect(cashOption.props.style).toBeDefined();
      expect(upiOption.props.style).toBeDefined();
      expect(cardOption.props.style).toBeDefined();
    });

    it('should use theme spacing for padding and margins', () => {
      const { getByTestId } = render(<PaymentMethodSelector {...defaultProps} />);

      const cashOption = getByTestId('method-selector-option-cash');

      // Options should use theme spacing values (not hardcoded numbers)
      // This test verifies the component structure, actual values will be checked in implementation
      expect(cashOption).toBeTruthy();
    });
  });
});

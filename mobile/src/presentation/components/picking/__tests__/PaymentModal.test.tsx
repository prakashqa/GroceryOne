/**
 * PaymentModal Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useSelector } from 'react-redux';
import PaymentModal from '../PaymentModal';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

// Mock theme
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      success: '#2E7D32',
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      textLight: '#888888',
      background: '#121212',
      surface: '#1E1E1E',
      primary: '#4CAF50',
      border: '#333333',
      divider: '#333333',
      modalOverlay: 'rgba(0,0,0,0.7)',
      iconMuted: '#333333',
      iconDanger: '#F4433620',
      error: '#F44336',
      disabled: '#555555',
      buttonPrimary: '#4CAF50',
      buttonPrimaryText: '#FFFFFF',
      buttonSecondaryText: '#4CAF50',
      buttonDangerText: '#FFFFFF',
      buttonGhostText: '#FFFFFF',
    },
    typography: {
      fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 20,
        xxxl: 28,
      },
    },
    spacing: {
      xs: 4,
      sm: 8,
      smd: 10,
      md: 12,
      lg: 16,
      xl: 20,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    },
    buttonHeights: {
      sm: 32,
      md: 44,
      lg: 52,
    },
    textStyles: {
      h2: {
        fontSize: 20,
        fontWeight: '700',
      },
      button: {
        fontSize: 16,
        fontWeight: '600',
      },
      buttonSmall: {
        fontSize: 14,
        fontWeight: '600',
      },
    },
    shadows: {
      xl: {},
    },
  }),
}));

// Mock useResponsiveStyles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: () => ({
    gridColumns: 2,
    contentPadding: 16,
    contentMaxWidth: undefined,
    tabBarHeight: 60,
    iconSize: 24,
    fontScale: 1,
    cardMinWidth: 140,
    listColumns: 1,
    gridGap: 12,
    tabBarIconSize: 24,
    tabBarLabelSize: 11,
    touchTargetMinSize: 48,
    componentPadding: 16,
    iconContainerSize: 44,
    cardBorderRadius: 12,
    buttonBorderRadius: 8,
    modalWidth: 358,
    sectionSpacing: 16,
  }),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    // @ts-expect-error TS6133: kept for future use
    t: (key: string, defaultValue: string) => defaultValue,
  }),
}));

// Mock Redux
jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => {
    if (selector.name === 'selectMerchantUpiId') return 'merchant@upi';
    if (selector.name === 'selectMerchantName') return 'Test Merchant';
    return null;
  }),
  useDispatch: () => jest.fn(),
  useStore: () => ({}),
}));

// Mock child components
jest.mock('../PaymentMethodSelector', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockPaymentMethodSelector({ selectedMethod, onMethodChange, testID }: any) {
    return (
      <View testID={testID}>
        <Text>Selected: {selectedMethod}</Text>
        <TouchableOpacity testID={`${testID}-cash`} onPress={() => onMethodChange('cash')}>
          <Text>Cash</Text>
        </TouchableOpacity>
        <TouchableOpacity testID={`${testID}-upi`} onPress={() => onMethodChange('upi')}>
          <Text>UPI</Text>
        </TouchableOpacity>
        <TouchableOpacity testID={`${testID}-card`} onPress={() => onMethodChange('card')}>
          <Text>Card</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock('../CashPaymentSection', () => {
  const React = require('react');
  const { View, Text, TextInput } = require('react-native');
  return function MockCashPaymentSection({ receivedAmount, onReceivedAmountChange, testID }: any) {
    return (
      <View testID={testID}>
        <Text>Cash Payment Section</Text>
        <TextInput
          testID={`${testID}-input`}
          value={receivedAmount}
          onChangeText={onReceivedAmountChange}
        />
      </View>
    );
  };
});

jest.mock('../UpiPaymentSection', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function MockUpiPaymentSection({ testID }: any) {
    return (
      <View testID={testID}>
        <Text>UPI Payment Section</Text>
      </View>
    );
  };
});

jest.mock('../CardPaymentSection', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function MockCardPaymentSection({ testID }: any) {
    return (
      <View testID={testID}>
        <Text>Card Payment Section</Text>
      </View>
    );
  };
});

describe('PaymentModal', () => {
  const defaultProps = {
    visible: true,
    amount: 389,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    testID: 'payment-modal',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when visible', () => {
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);
      expect(getByTestId('payment-modal-container')).toBeTruthy();
    });

    it('should not render modal when not visible', () => {
      const { queryByTestId } = render(
        <PaymentModal {...defaultProps} visible={false} />
      );
      expect(queryByTestId('payment-modal-container')).toBeNull();
    });

    it('should display formatted amount correctly', () => {
      const { getByText } = render(<PaymentModal {...defaultProps} />);
      // Amount should be formatted as INR currency
      expect(getByText('₹389')).toBeTruthy();
    });

    it('should display Total Amount label', () => {
      const { getByText } = render(<PaymentModal {...defaultProps} />);
      expect(getByText('Total Amount')).toBeTruthy();
    });
  });

  describe('Action Buttons', () => {
    it('should render Cancel button with correct text', () => {
      const { getByText } = render(<PaymentModal {...defaultProps} />);
      expect(getByText('Cancel')).toBeTruthy();
    });

    it('should render Confirm button with correct text', () => {
      const { getByText } = render(<PaymentModal {...defaultProps} />);
      expect(getByText('Confirm')).toBeTruthy();
    });

    it('should call onCancel when Cancel button is pressed', () => {
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);
      fireEvent.press(getByTestId('payment-modal-cancel-button'));
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm with payment info when Confirm button is pressed', () => {
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);
      fireEvent.press(getByTestId('payment-modal-confirm-button'));
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'cash',
          confirmedAt: expect.any(String),
        })
      );
    });
  });

  describe('Payment Method Selection', () => {
    it('should render PaymentMethodSelector', () => {
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);
      expect(getByTestId('payment-modal-method-selector')).toBeTruthy();
    });

    it('should default to cash payment method', () => {
      const { getByText } = render(<PaymentModal {...defaultProps} />);
      expect(getByText('Selected: cash')).toBeTruthy();
    });

    it('should show CashPaymentSection when cash is selected', () => {
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);
      expect(getByTestId('payment-modal-cash-section')).toBeTruthy();
    });

    it('should show UpiPaymentSection when UPI is selected', () => {
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);
      fireEvent.press(getByTestId('payment-modal-method-selector-upi'));
      expect(getByTestId('payment-modal-upi-section')).toBeTruthy();
    });

    it('should show CardPaymentSection when Card is selected', () => {
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);
      fireEvent.press(getByTestId('payment-modal-method-selector-card'));
      expect(getByTestId('payment-modal-card-section')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible amount label', () => {
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);
      const amountElement = getByTestId('payment-modal-amount');
      expect(amountElement.props.accessibilityLabel).toBe('Amount: ₹389');
    });
  });

  describe('Payment Success Phase', () => {
    it('should show success screen with change amount for cash payment with change', () => {
      const { getByTestId, getAllByText, queryByTestId } = render(
        <PaymentModal {...defaultProps} />
      );

      // Enter received amount via the mock CashPaymentSection input
      fireEvent.changeText(getByTestId('payment-modal-cash-section-input'), '500');

      // Press Confirm
      fireEvent.press(getByTestId('payment-modal-confirm-button'));

      // Should show success screen
      expect(getByTestId('payment-modal-success')).toBeTruthy();
      // "Payment Successful" appears in both modal title and success screen body
      expect(getAllByText('Payment Successful').length).toBeGreaterThanOrEqual(1);

      // Should show the change amount (500 - 389 = 111)
      expect(getAllByText('₹111').length).toBeGreaterThanOrEqual(1);

      // Done button should be visible, Confirm button should not
      expect(getByTestId('payment-modal-done-button')).toBeTruthy();
      expect(queryByTestId('payment-modal-confirm-button')).toBeNull();

      // onConfirm should NOT have been called yet
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    it('should call onConfirm with payment info when Done is pressed on success screen', () => {
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);

      // Enter received amount and confirm
      fireEvent.changeText(getByTestId('payment-modal-cash-section-input'), '500');
      fireEvent.press(getByTestId('payment-modal-confirm-button'));

      // Press Done on success screen
      fireEvent.press(getByTestId('payment-modal-done-button'));

      // onConfirm should be called with correct payment info
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'cash',
          details: expect.objectContaining({
            method: 'cash',
            receivedAmount: 500,
            changeGiven: 111,
          }),
          confirmedAt: expect.any(String),
        })
      );
    });

    it('should call onConfirm directly for UPI payment without success screen', () => {
      const { getByTestId, queryByTestId } = render(
        <PaymentModal {...defaultProps} />
      );

      // Switch to UPI
      fireEvent.press(getByTestId('payment-modal-method-selector-upi'));

      // Press Confirm
      fireEvent.press(getByTestId('payment-modal-confirm-button'));

      // onConfirm should be called immediately
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      // No success screen
      expect(queryByTestId('payment-modal-success')).toBeNull();
    });

    it('should call onConfirm directly for Card payment without success screen', () => {
      const { getByTestId, queryByTestId } = render(
        <PaymentModal {...defaultProps} />
      );

      // Switch to Card
      fireEvent.press(getByTestId('payment-modal-method-selector-card'));

      // Press Confirm
      fireEvent.press(getByTestId('payment-modal-confirm-button'));

      // onConfirm should be called immediately
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      expect(queryByTestId('payment-modal-success')).toBeNull();
    });

    it('should call onConfirm directly for cash payment with exact amount (no change)', () => {
      const { getByTestId, queryByTestId } = render(
        <PaymentModal {...defaultProps} />
      );

      // Enter exact amount (389 = amount, change = 0)
      fireEvent.changeText(getByTestId('payment-modal-cash-section-input'), '389');
      fireEvent.press(getByTestId('payment-modal-confirm-button'));

      // onConfirm should be called immediately (no success screen)
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      expect(queryByTestId('payment-modal-success')).toBeNull();
    });

    it('should call onConfirm directly for cash payment with no received amount entered', () => {
      const { getByTestId, queryByTestId } = render(
        <PaymentModal {...defaultProps} />
      );

      // Leave receivedAmount empty (default), press Confirm
      fireEvent.press(getByTestId('payment-modal-confirm-button'));

      // onConfirm should be called immediately
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      expect(queryByTestId('payment-modal-success')).toBeNull();
    });

    it('should reset to input phase when modal reopens', () => {
      const { getByTestId, queryByTestId, rerender } = render(
        <PaymentModal {...defaultProps} />
      );

      // Get to success screen
      fireEvent.changeText(getByTestId('payment-modal-cash-section-input'), '500');
      fireEvent.press(getByTestId('payment-modal-confirm-button'));
      expect(getByTestId('payment-modal-success')).toBeTruthy();

      // Close and reopen modal
      rerender(<PaymentModal {...defaultProps} visible={false} />);
      rerender(<PaymentModal {...defaultProps} visible={true} />);

      // Should be back to input phase
      expect(queryByTestId('payment-modal-success')).toBeNull();
      expect(getByTestId('payment-modal-confirm-button')).toBeTruthy();
    });

    it('should display total amount, received amount, and change on success screen', () => {
      const { getByTestId, getByText } = render(
        <PaymentModal {...defaultProps} amount={500} />
      );

      // Enter received amount of 700
      fireEvent.changeText(getByTestId('payment-modal-cash-section-input'), '700');
      fireEvent.press(getByTestId('payment-modal-confirm-button'));

      // Should show all amounts
      expect(getByText('₹500')).toBeTruthy();
      expect(getByText('₹700')).toBeTruthy();
      expect(getByText('₹200')).toBeTruthy();
    });
  });

  describe('UPI Not Configured - Payment Blocked', () => {
    const mockUpiNotConfigured = () => {
      (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
        if (selector.name === 'selectMerchantUpiId') return '';
        if (selector.name === 'selectMerchantName') return 'Test Merchant';
        return null;
      });
    };

    afterEach(() => {
      // Restore default mock after each test in this block
      (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
        if (selector.name === 'selectMerchantUpiId') return 'merchant@upi';
        if (selector.name === 'selectMerchantName') return 'Test Merchant';
        return null;
      });
    });

    it('should disable Confirm button when UPI is selected and UPI is not configured', () => {
      mockUpiNotConfigured();
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);

      // Switch to UPI
      fireEvent.press(getByTestId('payment-modal-method-selector-upi'));

      // Confirm button should be disabled
      const confirmButton = getByTestId('payment-modal-confirm-button');
      expect(
        confirmButton.props.accessibilityState?.disabled || confirmButton.props.disabled
      ).toBeTruthy();
    });

    it('should not call onConfirm when UPI is selected, UPI is not configured, and Confirm is pressed', () => {
      mockUpiNotConfigured();
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);

      // Switch to UPI
      fireEvent.press(getByTestId('payment-modal-method-selector-upi'));

      // Attempt to press Confirm
      fireEvent.press(getByTestId('payment-modal-confirm-button'));

      // onConfirm should NOT have been called
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    it('should enable Confirm button when UPI is selected and UPI IS configured', () => {
      // Default mock already has merchantUpiId configured
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);

      // Switch to UPI
      fireEvent.press(getByTestId('payment-modal-method-selector-upi'));

      // Confirm button should NOT be disabled
      const confirmButton = getByTestId('payment-modal-confirm-button');
      expect(confirmButton.props.accessibilityState?.disabled).toBeFalsy();
    });

    it('should not disable Confirm button for cash when UPI is not configured', () => {
      mockUpiNotConfigured();
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);

      // Stay on cash (default)
      const confirmButton = getByTestId('payment-modal-confirm-button');
      expect(confirmButton.props.accessibilityState?.disabled).toBeFalsy();
    });

    it('should not disable Confirm button for card when UPI is not configured', () => {
      mockUpiNotConfigured();
      const { getByTestId } = render(<PaymentModal {...defaultProps} />);

      // Switch to card
      fireEvent.press(getByTestId('payment-modal-method-selector-card'));

      const confirmButton = getByTestId('payment-modal-confirm-button');
      expect(confirmButton.props.accessibilityState?.disabled).toBeFalsy();
    });

    it('should disable Confirm when merchantUpiId is null and UPI is selected', () => {
      (useSelector as unknown as jest.Mock).mockImplementation((selector: any) => {
        if (selector.name === 'selectMerchantUpiId') return null;
        if (selector.name === 'selectMerchantName') return 'Test Merchant';
        return null;
      });

      const { getByTestId } = render(<PaymentModal {...defaultProps} />);
      fireEvent.press(getByTestId('payment-modal-method-selector-upi'));

      const confirmButton = getByTestId('payment-modal-confirm-button');
      expect(
        confirmButton.props.accessibilityState?.disabled || confirmButton.props.disabled
      ).toBeTruthy();
    });
  });
});

/**
 * NewOrderConfirmModal Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NewOrderConfirmModal from '../NewOrderConfirmModal';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4CAF50',
      primaryDark: '#388E3C',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#212121',
      textSecondary: '#757575',
      textLight: '#9e9e9e',
      border: '#e0e0e0',
      card: '#ffffff',
      error: '#f44336',
      warning: '#FF9800',
      disabled: '#bdbdbd',
      buttonPrimary: '#2E7D32',
      buttonPrimaryText: '#FFFFFF',
      buttonPrimaryPressed: '#1B5E20',
      buttonSecondaryText: '#2E7D32',
      buttonDangerText: '#FFFFFF',
      buttonGhostText: '#666666',
      buttonGhostPressed: 'rgba(0, 0, 0, 0.05)',
      iconMuted: 'rgba(46, 125, 50, 0.1)',
      modalOverlay: 'rgba(0, 0, 0, 0.6)',
      inputBackground: '#F5F5F5',
      inputFocus: '#2E7D32',
      placeholder: '#9E9E9E',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
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
      fontWeight: {
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    },
    shadows: {
      xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
      },
    },
    buttonHeights: {
      sm: 36,
      md: 48,
      lg: 56,
    },
    textStyles: {
      button: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
      },
      buttonSmall: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.2,
      },
    },
  }),
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        'picking.newCartConfirmTitle': 'Start New Order?',
        'picking.newCartConfirmMessage': `Your current order has ${options?.count || 0} items. Starting a new order will save this order to your Order List.`,
        'picking.startNewCart': 'Start New',
        'picking.keepCurrent': 'Keep Current',
      };
      return translations[key] || key;
    },
  }),
}));

describe('NewOrderConfirmModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible is true', () => {
    const { getByText } = render(
      <NewOrderConfirmModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        itemCount={5}
      />
    );

    expect(getByText('Start New Order?')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(
      <NewOrderConfirmModal
        visible={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        itemCount={5}
      />
    );

    expect(queryByText('Start New Order?')).toBeNull();
  });

  it('displays correct item count in message', () => {
    const { getByText } = render(
      <NewOrderConfirmModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        itemCount={5}
      />
    );

    expect(getByText(/Your current order has 5 items/)).toBeTruthy();
  });

  it('renders Keep Current and Start New buttons', () => {
    const { getByText } = render(
      <NewOrderConfirmModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        itemCount={3}
      />
    );

    expect(getByText('Keep Current')).toBeTruthy();
    expect(getByText('Start New')).toBeTruthy();
  });

  it('calls onClose when Keep Current button is pressed', () => {
    const { getByText } = render(
      <NewOrderConfirmModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        itemCount={3}
      />
    );

    fireEvent.press(getByText('Keep Current'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onConfirm when Start New button is pressed', () => {
    const { getByText } = render(
      <NewOrderConfirmModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        itemCount={3}
      />
    );

    fireEvent.press(getByText('Start New'));
    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('displays warning icon', () => {
    const { getByText } = render(
      <NewOrderConfirmModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        itemCount={3}
      />
    );

    // The modal should display a warning emoji
    expect(getByText('⚠️')).toBeTruthy();
  });

  it('renders with testID when provided', () => {
    const { getByTestId } = render(
      <NewOrderConfirmModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        itemCount={3}
        testID="new-cart-confirm-modal"
      />
    );

    expect(getByTestId('new-cart-confirm-modal-keep-button')).toBeTruthy();
    expect(getByTestId('new-cart-confirm-modal-confirm-button')).toBeTruthy();
  });
});

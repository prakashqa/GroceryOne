/**
 * CreateCartModal Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CreateCartModal from '../CreateCartModal';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'picking.createCart': 'Create New Cart',
        'picking.cartName': 'Cart Name',
        'picking.enterCartName': 'Enter cart name',
        'picking.create': 'Create',
        'picking.duplicateName': 'A cart with this name already exists',
        'cancel': 'Cancel',
      };
      return translations[key] || key;
    },
  }),
}));

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

describe('CreateCartModal', () => {
  const mockOnClose = jest.fn();
  const mockOnCreate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible is true', () => {
    const { getByText } = render(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    expect(getByText('Create New Cart')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(
      <CreateCartModal
        visible={false}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    expect(queryByText('Create New Cart')).toBeNull();
  });

  it('renders text input for cart name', () => {
    const { getByPlaceholderText, getByText } = render(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    expect(getByPlaceholderText('Enter cart name')).toBeTruthy();
    expect(getByText('Cart Name')).toBeTruthy(); // Label should be visible
  });

  it('renders create and cancel buttons', () => {
    const { getByText } = render(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    expect(getByText('Create')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('calls onClose when cancel button is pressed', () => {
    const { getByText } = render(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    fireEvent.press(getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onCreateCart with input value when create is pressed', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    const input = getByPlaceholderText('Enter cart name');
    fireEvent.changeText(input, 'My New Cart');
    fireEvent.press(getByText('Create'));

    expect(mockOnCreate).toHaveBeenCalledWith('My New Cart');
  });

  it('disables create button when input is empty', () => {
    const { getByTestId } = render(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
        testID="modal"
      />
    );

    const createButton = getByTestId('modal-create-button');
    fireEvent.press(createButton);

    // Should not call onCreateCart with empty input
    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it('trims whitespace from cart name', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    const input = getByPlaceholderText('Enter cart name');
    fireEvent.changeText(input, '  Cart Name  ');
    fireEvent.press(getByText('Create'));

    expect(mockOnCreate).toHaveBeenCalledWith('Cart Name');
  });

  it('clears input after creating cart', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    const input = getByPlaceholderText('Enter cart name');
    fireEvent.changeText(input, 'My Cart');
    fireEvent.press(getByText('Create'));

    // Input should be cleared
    expect(input.props.value).toBe('');
  });

  it('shows error message for duplicate cart name', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
        existingNames={['Cart 1', 'Cart 2']}
      />
    );

    const input = getByPlaceholderText('Enter cart name');
    fireEvent.changeText(input, 'Cart 1');

    expect(getByText('A cart with this name already exists')).toBeTruthy();
  });

  it('does not call onCreateCart when name is duplicate', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
        existingNames={['Cart 1', 'Cart 2']}
      />
    );

    const input = getByPlaceholderText('Enter cart name');
    fireEvent.changeText(input, 'Cart 1');
    fireEvent.press(getByText('Create'));

    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it('displays character count', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    const input = getByPlaceholderText('Enter cart name');
    fireEvent.changeText(input, 'Hello');

    expect(getByText('5/50')).toBeTruthy();
  });

  it('renders cart icon in header', () => {
    const { getByText } = render(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    // The modal should display the shopping cart emoji
    expect(getByText('🛒')).toBeTruthy();
  });
});

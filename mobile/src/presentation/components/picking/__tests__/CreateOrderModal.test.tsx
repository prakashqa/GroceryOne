/**
 * CreateOrderModal Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CreateOrderModal from '../CreateOrderModal';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'picking.createCart': 'Create New Order',
        'picking.cartName': 'Order Name',
        'picking.enterCartName': 'Enter order name',
        'picking.create': 'Create',
        'picking.duplicateName': 'An order with this name already exists',
        'cancel': 'Cancel',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

describe('CreateOrderModal', () => {
  const mockOnClose = jest.fn();
  const mockOnCreate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible is true', () => {
    const { getByText } = render(
      <CreateOrderModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    expect(getByText('Create New Order')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(
      <CreateOrderModal
        visible={false}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    expect(queryByText('Create New Order')).toBeNull();
  });

  it('renders text input for order name', () => {
    const { getByPlaceholderText, getByText } = render(
      <CreateOrderModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    expect(getByPlaceholderText('Enter order name')).toBeTruthy();
    expect(getByText('Order Name')).toBeTruthy(); // Label should be visible
  });

  it('renders create and cancel buttons', () => {
    const { getByText } = render(
      <CreateOrderModal
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
      <CreateOrderModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    fireEvent.press(getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onCreateOrder with input value when create is pressed', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateOrderModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    const input = getByPlaceholderText('Enter order name');
    fireEvent.changeText(input, 'My New Order');
    fireEvent.press(getByText('Create'));

    expect(mockOnCreate).toHaveBeenCalledWith('My New Order');
  });

  it('disables create button when input is empty', () => {
    const { getByTestId } = render(
      <CreateOrderModal
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

  it('trims whitespace from order name', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateOrderModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    const input = getByPlaceholderText('Enter order name');
    fireEvent.changeText(input, '  Order Name  ');
    fireEvent.press(getByText('Create'));

    expect(mockOnCreate).toHaveBeenCalledWith('Order Name');
  });

  it('clears input after creating order', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateOrderModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    const input = getByPlaceholderText('Enter order name');
    fireEvent.changeText(input, 'My Order');
    fireEvent.press(getByText('Create'));

    // Input should be cleared
    expect(input.props.value).toBe('');
  });

  it('shows error message for duplicate order name', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateOrderModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
        existingNames={['Cart 1', 'Cart 2']}
      />
    );

    const input = getByPlaceholderText('Enter order name');
    fireEvent.changeText(input, 'Cart 1');

    expect(getByText('An order with this name already exists')).toBeTruthy();
  });

  it('does not call onCreateOrder when name is duplicate', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateOrderModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
        existingNames={['Cart 1', 'Cart 2']}
      />
    );

    const input = getByPlaceholderText('Enter order name');
    fireEvent.changeText(input, 'Cart 1');
    fireEvent.press(getByText('Create'));

    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it('displays character count', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateOrderModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    const input = getByPlaceholderText('Enter order name');
    fireEvent.changeText(input, 'Hello');

    expect(getByText('5/50')).toBeTruthy();
  });

  it('renders order icon in header', () => {
    const { getByText } = render(
      <CreateOrderModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    // The modal should display the shopping cart emoji
    expect(getByText('🛒')).toBeTruthy();
  });
});

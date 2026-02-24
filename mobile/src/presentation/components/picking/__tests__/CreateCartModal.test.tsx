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
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
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

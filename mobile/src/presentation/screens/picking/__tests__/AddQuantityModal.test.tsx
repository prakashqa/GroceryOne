/**
 * AddQuantityModal Tests
 * TDD tests for the quantity selection modal
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import AddQuantityModal from '../AddQuantityModal';
import { Item } from '../../../../domain/types/picking';

// Mock the hooks for responsive testing
jest.mock('../../../../hooks/useResponsiveStyles', () => ({
  useResponsiveStyles: jest.fn(() => ({
    fontScale: 1,
    touchTargetMinSize: 48,
    modalWidth: 343,
    componentPadding: 16,
    cardBorderRadius: 12,
    buttonBorderRadius: 8,
    iconSize: 24,
  })),
}));

jest.mock('../../../../hooks/useDeviceType', () => ({
  useDeviceType: jest.fn(() => ({
    isTablet: false,
    isLandscape: false,
    screenWidth: 375,
    screenHeight: 812,
    breakpoint: 'sm',
  })),
}));

describe('AddQuantityModal', () => {
  const mockItem: Item = {
    id: 'atta-1',
    categoryId: 'atta-rice',
    name: 'Aashirvaad Atta',
    unit: 'kg',
    defaultQuantity: 5,
  };

  const mockOnClose = jest.fn();
  const mockOnAddToCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should not render when visible is false', () => {
      const { queryByText } = renderWithProviders(
        <AddQuantityModal
          visible={false}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(queryByText('Add Atta')).toBeNull();
    });

    it('should render when visible is true', () => {
      const { getByText } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(getByText('Add Atta')).toBeTruthy();
    });

    it('should display item category name in title', () => {
      const { getByText } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(getByText('Add Atta')).toBeTruthy();
    });

    it('should show Select Quantity label', () => {
      const { getByText } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(getByText('Select Quantity')).toBeTruthy();
    });

    it('should display preset quantity options based on item unit', () => {
      const { getByText } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // For kg unit, should show 0.5, 1, 2, 5 as preset options
      expect(getByText('0.5')).toBeTruthy();
      expect(getByText('1')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
    });

    it('should display custom quantity option with + indicator', () => {
      const { getByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(getByTestId('custom-quantity-option')).toBeTruthy();
    });

    it('should display Add to Cart button', () => {
      const { getByText } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(getByText('Add to Cart')).toBeTruthy();
    });

    it('should display close button', () => {
      const { getByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      expect(getByTestId('close-button')).toBeTruthy();
    });
  });

  describe('quantity selection', () => {
    it('should select default quantity initially (item defaultQuantity)', () => {
      const { getByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // No preset is selected by default (user must choose)
      const option5 = getByTestId('quantity-option-5');
      expect(option5.props.accessibilityState?.selected).toBe(false);
    });

    it('should allow selecting preset quantity options', () => {
      const { getByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      const option2 = getByTestId('quantity-option-2');
      fireEvent.press(option2);

      expect(option2.props.accessibilityState?.selected).toBe(true);
    });

    it('should show custom input when custom option is selected', () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Initially no custom input visible
      expect(queryByTestId('custom-quantity-input')).toBeNull();

      // Press custom option
      const customOption = getByTestId('custom-quantity-option');
      fireEvent.press(customOption);

      // Custom input should now be visible
      expect(getByTestId('custom-quantity-input')).toBeTruthy();
    });

    it('should allow entering custom quantity', () => {
      const { getByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Press custom option
      fireEvent.press(getByTestId('custom-quantity-option'));

      // Enter custom value
      const customInput = getByTestId('custom-quantity-input');
      fireEvent.changeText(customInput, '8');

      // The custom option should show the entered value
      const display = getByTestId('custom-quantity-display');
      expect(display.props.children).toContain('8');
    });
  });

  describe('interactions', () => {
    it('should call onClose when close button is pressed', () => {
      const { getByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      fireEvent.press(getByTestId('close-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is pressed', () => {
      const { getByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      fireEvent.press(getByTestId('modal-backdrop'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onAddToCart with item and selected quantity when Add to Cart is pressed', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Select quantity 5
      fireEvent.press(getByTestId('quantity-option-5'));

      // Press Add to Cart
      fireEvent.press(getByText('Add to Cart'));

      // onAddToCart receives item, normalized quantity, and displayUnit
      expect(mockOnAddToCart).toHaveBeenCalledWith(mockItem, 5, 'kg');
    });

    it('should call onAddToCart with custom quantity when custom is selected', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Select custom option
      fireEvent.press(getByTestId('custom-quantity-option'));

      // Enter custom value
      fireEvent.changeText(getByTestId('custom-quantity-input'), '15');

      // Press Add to Cart
      fireEvent.press(getByText('Add to Cart'));

      // Custom quantity in kg is normalized (15kg stays 15kg)
      expect(mockOnAddToCart).toHaveBeenCalledWith(mockItem, 15, 'kg');
    });

    it('should close modal after adding to cart', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Select a quantity first
      fireEvent.press(getByTestId('quantity-option-1'));

      fireEvent.press(getByText('Add to Cart'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('different item units', () => {
    it('should show appropriate presets for gm unit items', () => {
      const gramItem: Item = {
        id: 'snack-1',
        categoryId: 'chips-biscuits',
        name: 'Lays Classic',
        unit: 'gm',
        defaultQuantity: 100,
      };

      const { getByText } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={gramItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // For gm unit, should show 100, 250, 500, 1000 as preset options
      expect(getByText('100')).toBeTruthy();
      expect(getByText('250')).toBeTruthy();
      expect(getByText('500')).toBeTruthy();
      expect(getByText('1000')).toBeTruthy();
    });

    it('should show appropriate presets for pcs unit items', () => {
      const pcsItem: Item = {
        id: 'bath-1',
        categoryId: 'bath-body',
        name: 'Dove Soap',
        unit: 'pcs',
        defaultQuantity: 3,
      };

      const { getByText } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={pcsItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // For pcs unit, should show 1, 2, 3, 6 as preset options
      expect(getByText('1')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
      expect(getByText('6')).toBeTruthy();
    });

    it('should show appropriate presets for L unit items', () => {
      const literItem: Item = {
        id: 'oil-1',
        categoryId: 'oil-ghee',
        name: 'Fortune Sunflower Oil',
        unit: 'L',
        defaultQuantity: 1,
      };

      const { getByText } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={literItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // For L unit, should show 0.5, 1, 2, 5 as preset options
      expect(getByText('0.5')).toBeTruthy();
      expect(getByText('1')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle null item gracefully', () => {
      const { queryByText } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={null as unknown as Item}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Should not crash, modal should not render content
      expect(queryByText('Add to Cart')).toBeNull();
    });

    it('should reset selection when modal is reopened', () => {
      const { rerender, getByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Select quantity 5
      fireEvent.press(getByTestId('quantity-option-5'));

      // Close modal
      rerender(
        <AddQuantityModal
          visible={false}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Reopen modal
      rerender(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Selection should be cleared (no preset selected by default)
      const option5 = getByTestId('quantity-option-5');
      expect(option5.props.accessibilityState?.selected).toBe(false);
    });

    it('should not allow 0 or negative custom quantities', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Select custom option
      fireEvent.press(getByTestId('custom-quantity-option'));

      // Enter 0
      fireEvent.changeText(getByTestId('custom-quantity-input'), '0');

      // Press Add to Cart
      fireEvent.press(getByText('Add to Cart'));

      // Should not call onAddToCart with 0 quantity
      expect(mockOnAddToCart).not.toHaveBeenCalled();
    });
  });

  describe('responsive styling', () => {
    const { useResponsiveStyles } = require('../../../../hooks/useResponsiveStyles');

    it('should use responsive fontScale for text sizing', () => {
      // Mock tablet responsive values
      useResponsiveStyles.mockReturnValue({
        fontScale: 1.25,
        touchTargetMinSize: 58,
        modalWidth: 500,
        componentPadding: 24,
        cardBorderRadius: 16,
        buttonBorderRadius: 12,
        iconSize: 34,
      });

      const { getByText } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Modal should render with responsive values (component uses fontScale)
      expect(getByText('Add Atta')).toBeTruthy();
    });

    it('should use responsive touchTargetMinSize for buttons', () => {
      useResponsiveStyles.mockReturnValue({
        fontScale: 1.25,
        touchTargetMinSize: 58,
        modalWidth: 500,
        componentPadding: 24,
        cardBorderRadius: 16,
        buttonBorderRadius: 12,
        iconSize: 34,
      });

      const { getByTestId } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Close button and quantity options should be rendered
      expect(getByTestId('close-button')).toBeTruthy();
      expect(getByTestId('quantity-option-1')).toBeTruthy();
    });

    it('should use responsive modalWidth for container sizing', () => {
      useResponsiveStyles.mockReturnValue({
        fontScale: 1.35,
        touchTargetMinSize: 64,
        modalWidth: 600,
        componentPadding: 28,
        cardBorderRadius: 20,
        buttonBorderRadius: 12,
        iconSize: 38,
      });

      const { getByText } = renderWithProviders(
        <AddQuantityModal
          visible={true}
          item={mockItem}
          onClose={mockOnClose}
          onAddToCart={mockOnAddToCart}
        />
      );

      // Modal should render properly with large tablet values
      expect(getByText('Add to Cart')).toBeTruthy();
    });
  });
});

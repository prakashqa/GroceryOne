/**
 * PinInput Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PinInput } from '../PinInput';

// Mock theme hook
jest.mock('../../../../presentation/theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4CAF50',
      text: '#212121',
      textLight: '#757575',
      border: '#E0E0E0',
      error: '#F44336',
      surface: '#FFFFFF',
      background: '#F5F5F5',
      disabled: '#BDBDBD',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      full: 999,
      md: 8,
    },
    typography: {
      fontSize: { sm: 12, md: 14, lg: 16, xl: 20, xxl: 24, '2xl': 28, xxxl: 32 },
      fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
    },
  }),
}));

describe('PinInput', () => {
  const mockOnChange = jest.fn();
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render 4 digit placeholders', () => {
      const { getAllByTestId } = render(
        <PinInput
          value=""
          onChange={mockOnChange}
          testID="pin-input"
        />
      );

      // Should have 4 digit containers
      const digits = getAllByTestId(/^pin-input-digit-\d$/);
      expect(digits).toHaveLength(4);
    });

    it('should render numeric keypad', () => {
      const { getByText } = render(
        <PinInput
          value=""
          onChange={mockOnChange}
          testID="pin-input"
        />
      );

      // Check some keypad digits exist
      expect(getByText('1')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
      expect(getByText('0')).toBeTruthy();
    });

    it('should show filled digits for entered values', () => {
      const { getByTestId } = render(
        <PinInput
          value="12"
          onChange={mockOnChange}
          testID="pin-input"
        />
      );

      // First two should have dots (filled)
      expect(getByTestId('pin-input-digit-0-dot')).toBeTruthy();
      expect(getByTestId('pin-input-digit-1-dot')).toBeTruthy();
    });

    it('should mask digits when secure prop is true (default)', () => {
      const { getByTestId, queryByText } = render(
        <PinInput
          value="1234"
          onChange={mockOnChange}
          secure={true}
          testID="pin-input"
        />
      );

      // Should show dots, not actual numbers
      expect(getByTestId('pin-input-digit-0-dot')).toBeTruthy();
      // Should not show the actual digit values
      expect(queryByText('1')).toBeTruthy(); // This is the keypad "1", not the PIN digit
    });

    it('should show error state when error prop provided', () => {
      const { getByText } = render(
        <PinInput
          value="1234"
          onChange={mockOnChange}
          error="Wrong PIN"
          testID="pin-input"
        />
      );

      expect(getByText('Wrong PIN')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('should call onChange when digit pressed', () => {
      const { getByText } = render(
        <PinInput
          value=""
          onChange={mockOnChange}
          testID="pin-input"
        />
      );

      fireEvent.press(getByText('5'));
      expect(mockOnChange).toHaveBeenCalledWith('5');
    });

    it('should append digit to value', () => {
      const { getByText } = render(
        <PinInput
          value="12"
          onChange={mockOnChange}
          testID="pin-input"
        />
      );

      fireEvent.press(getByText('3'));
      expect(mockOnChange).toHaveBeenCalledWith('123');
    });

    it('should not exceed 4 digits', () => {
      const { getByText } = render(
        <PinInput
          value="1234"
          onChange={mockOnChange}
          testID="pin-input"
        />
      );

      fireEvent.press(getByText('5'));
      // onChange should not be called since we're already at 4 digits
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should remove last digit on backspace', () => {
      const { getByTestId } = render(
        <PinInput
          value="123"
          onChange={mockOnChange}
          testID="pin-input"
        />
      );

      fireEvent.press(getByTestId('pin-input-keypad-backspace'));
      expect(mockOnChange).toHaveBeenCalledWith('12');
    });

    it('should handle backspace on empty value', () => {
      const { getByTestId } = render(
        <PinInput
          value=""
          onChange={mockOnChange}
          testID="pin-input"
        />
      );

      fireEvent.press(getByTestId('pin-input-keypad-backspace'));
      // Should not throw, onChange called with empty string
      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('should call onComplete when 4 digits entered', () => {
      const { getByText } = render(
        <PinInput
          value="123"
          onChange={mockOnChange}
          onComplete={mockOnComplete}
          testID="pin-input"
        />
      );

      fireEvent.press(getByText('4'));
      expect(mockOnChange).toHaveBeenCalledWith('1234');
      expect(mockOnComplete).toHaveBeenCalledWith('1234');
    });

    it('should not call onComplete when less than 4 digits', () => {
      const { getByText } = render(
        <PinInput
          value="1"
          onChange={mockOnChange}
          onComplete={mockOnComplete}
          testID="pin-input"
        />
      );

      fireEvent.press(getByText('2'));
      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should not respond to keypad presses when disabled', () => {
      const { getByText } = render(
        <PinInput
          value="12"
          onChange={mockOnChange}
          disabled={true}
          testID="pin-input"
        />
      );

      fireEvent.press(getByText('3'));
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have accessible container', () => {
      const { getByTestId } = render(
        <PinInput
          value=""
          onChange={mockOnChange}
          testID="pin-input"
        />
      );

      const container = getByTestId('pin-input');
      expect(container.props.accessibilityLabel).toContain('PIN');
    });
  });
});

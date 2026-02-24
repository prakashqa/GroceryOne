/**
 * PinKeypad Component Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PinKeypad, getKeySize } from '../PinKeypad';

// Mock theme hook
jest.mock('../../../../presentation/theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

describe('PinKeypad', () => {
  const mockOnDigitPress = jest.fn();
  const mockOnBackspace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render buttons 0-9', () => {
      const { getByText } = render(
        <PinKeypad
          onDigitPress={mockOnDigitPress}
          onBackspace={mockOnBackspace}
          testID="keypad"
        />
      );

      for (let i = 0; i <= 9; i++) {
        expect(getByText(String(i))).toBeTruthy();
      }
    });

    it('should render backspace button', () => {
      const { getByTestId } = render(
        <PinKeypad
          onDigitPress={mockOnDigitPress}
          onBackspace={mockOnBackspace}
          testID="keypad"
        />
      );

      expect(getByTestId('keypad-backspace')).toBeTruthy();
    });

    it('should render in a 3x4 grid layout', () => {
      const { getByTestId } = render(
        <PinKeypad
          onDigitPress={mockOnDigitPress}
          onBackspace={mockOnBackspace}
          testID="keypad"
        />
      );

      // Check rows exist
      expect(getByTestId('keypad-row-0')).toBeTruthy(); // 1, 2, 3
      expect(getByTestId('keypad-row-1')).toBeTruthy(); // 4, 5, 6
      expect(getByTestId('keypad-row-2')).toBeTruthy(); // 7, 8, 9
      expect(getByTestId('keypad-row-3')).toBeTruthy(); // empty, 0, backspace
    });
  });

  describe('interactions', () => {
    it('should call onDigitPress with correct digit when 1 pressed', () => {
      const { getByText } = render(
        <PinKeypad
          onDigitPress={mockOnDigitPress}
          onBackspace={mockOnBackspace}
        />
      );

      fireEvent.press(getByText('1'));
      expect(mockOnDigitPress).toHaveBeenCalledWith('1');
    });

    it('should call onDigitPress with correct digit when 0 pressed', () => {
      const { getByText } = render(
        <PinKeypad
          onDigitPress={mockOnDigitPress}
          onBackspace={mockOnBackspace}
        />
      );

      fireEvent.press(getByText('0'));
      expect(mockOnDigitPress).toHaveBeenCalledWith('0');
    });

    it('should call onDigitPress with correct digit for each digit', () => {
      const { getByText } = render(
        <PinKeypad
          onDigitPress={mockOnDigitPress}
          onBackspace={mockOnBackspace}
        />
      );

      const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
      digits.forEach((digit) => {
        fireEvent.press(getByText(digit));
      });

      digits.forEach((digit, index) => {
        expect(mockOnDigitPress).toHaveBeenNthCalledWith(index + 1, digit);
      });
    });

    it('should call onBackspace when backspace pressed', () => {
      const { getByTestId } = render(
        <PinKeypad
          onDigitPress={mockOnDigitPress}
          onBackspace={mockOnBackspace}
          testID="keypad"
        />
      );

      fireEvent.press(getByTestId('keypad-backspace'));
      expect(mockOnBackspace).toHaveBeenCalledTimes(1);
    });
  });

  describe('disabled state', () => {
    it('should not respond to digit presses when disabled', () => {
      const { getByText } = render(
        <PinKeypad
          onDigitPress={mockOnDigitPress}
          onBackspace={mockOnBackspace}
          disabled={true}
        />
      );

      fireEvent.press(getByText('5'));
      expect(mockOnDigitPress).not.toHaveBeenCalled();
    });

    it('should not respond to backspace when disabled', () => {
      const { getByTestId } = render(
        <PinKeypad
          onDigitPress={mockOnDigitPress}
          onBackspace={mockOnBackspace}
          disabled={true}
          testID="keypad"
        />
      );

      fireEvent.press(getByTestId('keypad-backspace'));
      expect(mockOnBackspace).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have accessible labels on digit buttons', () => {
      const { getByTestId } = render(
        <PinKeypad
          onDigitPress={mockOnDigitPress}
          onBackspace={mockOnBackspace}
          testID="keypad"
        />
      );

      const button5 = getByTestId('keypad-key-5');
      expect(button5.props.accessibilityLabel).toContain('5');
    });

    it('should have accessible label on backspace button', () => {
      const { getByTestId } = render(
        <PinKeypad
          onDigitPress={mockOnDigitPress}
          onBackspace={mockOnBackspace}
          testID="keypad"
        />
      );

      const backspace = getByTestId('keypad-backspace');
      expect(backspace.props.accessibilityLabel).toContain('delete');
    });
  });

  describe('responsive layout (getKeySize)', () => {
    it('should return smaller key size in landscape orientation', () => {
      // Landscape: width > height
      const keySize = getKeySize(844, 390);
      expect(keySize).toBeLessThan(72);
    });

    it('should return default key size (72) in portrait orientation', () => {
      // Portrait: height > width
      const keySize = getKeySize(390, 844);
      expect(keySize).toBe(72);
    });

    it('should cap landscape key size at 48', () => {
      // Large landscape screen
      const keySize = getKeySize(1024, 768);
      expect(keySize).toBeLessThanOrEqual(48);
    });

    it('should scale landscape key size with screen height', () => {
      // Small landscape height
      const keySize = getKeySize(600, 300);
      expect(keySize).toBe(Math.min(48, Math.floor(300 * 0.1)));
      expect(keySize).toBe(30);
    });
  });
});

/**
 * Input Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';
import { flattenStyle } from '../../../../__test-utils__';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
}));

describe('Input', () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders with placeholder', () => {
      const { getByPlaceholderText } = render(
        <Input
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter text"
        />
      );

      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('renders with label', () => {
      const { getByText } = render(
        <Input
          value=""
          onChangeText={mockOnChangeText}
          label="Cart Name"
        />
      );

      expect(getByText('Cart Name')).toBeTruthy();
    });

    it('renders with value', () => {
      const { getByDisplayValue } = render(
        <Input
          value="Test Value"
          onChangeText={mockOnChangeText}
        />
      );

      expect(getByDisplayValue('Test Value')).toBeTruthy();
    });

    it('renders helper text', () => {
      const { getByText } = render(
        <Input
          value=""
          onChangeText={mockOnChangeText}
          helperText="This is a hint"
        />
      );

      expect(getByText('This is a hint')).toBeTruthy();
    });

    it('renders character count when maxLength is provided', () => {
      const { getByText } = render(
        <Input
          value="Hello"
          onChangeText={mockOnChangeText}
          maxLength={50}
        />
      );

      expect(getByText('5/50')).toBeTruthy();
    });

    it('renders with icon', () => {
      const { getByText } = render(
        <Input
          value=""
          onChangeText={mockOnChangeText}
          icon="search"
        />
      );

      expect(getByText('search')).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('renders error message', () => {
      const { getByText } = render(
        <Input
          value=""
          onChangeText={mockOnChangeText}
          error="This field is required"
        />
      );

      expect(getByText('This field is required')).toBeTruthy();
    });

    it('hides helper text when error is present', () => {
      const { queryByText, getByText } = render(
        <Input
          value=""
          onChangeText={mockOnChangeText}
          helperText="This is a hint"
          error="This is an error"
        />
      );

      expect(getByText('This is an error')).toBeTruthy();
      expect(queryByText('This is a hint')).toBeNull();
    });
  });

  describe('Interactions', () => {
    it('calls onChangeText when text changes', () => {
      const { getByTestId } = render(
        <Input
          value=""
          onChangeText={mockOnChangeText}
          testID="input"
        />
      );

      const input = getByTestId('input-field');
      fireEvent.changeText(input, 'New Text');

      expect(mockOnChangeText).toHaveBeenCalledWith('New Text');
    });

    it('handles focus and blur events', () => {
      const { getByTestId } = render(
        <Input
          value=""
          onChangeText={mockOnChangeText}
          testID="input"
        />
      );

      const input = getByTestId('input-field');

      fireEvent(input, 'focus');
      fireEvent(input, 'blur');

      expect(input).toBeTruthy();
    });
  });

  describe('Props', () => {
    it('respects maxLength prop', () => {
      const { getByTestId } = render(
        <Input
          value=""
          onChangeText={mockOnChangeText}
          maxLength={10}
          testID="input"
        />
      );

      const input = getByTestId('input-field');
      expect(input.props.maxLength).toBe(10);
    });

    it('respects autoFocus prop', () => {
      const { getByTestId } = render(
        <Input
          value=""
          onChangeText={mockOnChangeText}
          autoFocus
          testID="input"
        />
      );

      const input = getByTestId('input-field');
      expect(input.props.autoFocus).toBe(true);
    });

    it('respects multiline prop', () => {
      const { getByTestId } = render(
        <Input
          value=""
          onChangeText={mockOnChangeText}
          multiline
          testID="input"
        />
      );

      const input = getByTestId('input-field');
      expect(input.props.multiline).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('has accessible label from label prop', () => {
      const { getByTestId } = render(
        <Input
          value=""
          onChangeText={mockOnChangeText}
          label="Email Address"
          testID="input"
        />
      );

      const input = getByTestId('input-field');
      expect(input.props.accessibilityLabel).toBe('Email Address');
    });
  });

  describe('Clear Button', () => {
    it('does not show clear button when showClearButton is false', () => {
      const { queryByTestId } = render(
        <Input
          value="Some text"
          onChangeText={mockOnChangeText}
          showClearButton={false}
          testID="input"
        />
      );

      expect(queryByTestId('input-clear')).toBeNull();
    });

    it('shows clear button when showClearButton is true and value exists', () => {
      const { getByTestId } = render(
        <Input
          value="Some text"
          onChangeText={mockOnChangeText}
          showClearButton
          testID="input"
        />
      );

      expect(getByTestId('input-clear')).toBeTruthy();
    });

    it('hides clear button when value is empty', () => {
      const { queryByTestId } = render(
        <Input
          value=""
          onChangeText={mockOnChangeText}
          showClearButton
          testID="input"
        />
      );

      expect(queryByTestId('input-clear')).toBeNull();
    });

    it('calls onChangeText with empty string when clear button is pressed', () => {
      const { getByTestId } = render(
        <Input
          value="Some text"
          onChangeText={mockOnChangeText}
          showClearButton
          testID="input"
        />
      );

      const clearButton = getByTestId('input-clear');
      fireEvent.press(clearButton);

      expect(mockOnChangeText).toHaveBeenCalledWith('');
    });

    it('renders clear button with minimum touch-friendly size', () => {
      const { getByTestId } = render(
        <Input
          value="Some text"
          onChangeText={mockOnChangeText}
          showClearButton
          testID="input"
        />
      );

      const clearButton = getByTestId('input-clear');
      const flatStyle = flattenStyle(clearButton.props.style);
      // Minimum size should be 28px for touch-friendliness
      expect(flatStyle.width).toBeGreaterThanOrEqual(28);
      expect(flatStyle.height).toBeGreaterThanOrEqual(28);
    });
  });

  describe('Success State', () => {
    it('renders with success state', () => {
      const { getByTestId } = render(
        <Input
          value="Valid input"
          onChangeText={mockOnChangeText}
          success
          testID="input"
        />
      );

      expect(getByTestId('input')).toBeTruthy();
    });

    it('shows success icon when success is true', () => {
      const { getByTestId } = render(
        <Input
          value="Valid input"
          onChangeText={mockOnChangeText}
          success
          testID="input"
        />
      );

      expect(getByTestId('input-success-icon')).toBeTruthy();
    });

    it('does not show success icon when success is false', () => {
      const { queryByTestId } = render(
        <Input
          value="Some input"
          onChangeText={mockOnChangeText}
          success={false}
          testID="input"
        />
      );

      expect(queryByTestId('input-success-icon')).toBeNull();
    });

    it('error state takes precedence over success state', () => {
      const { queryByTestId, getByText } = render(
        <Input
          value="Some input"
          onChangeText={mockOnChangeText}
          success
          error="This is an error"
          testID="input"
        />
      );

      expect(getByText('This is an error')).toBeTruthy();
      expect(queryByTestId('input-success-icon')).toBeNull();
    });
  });
});

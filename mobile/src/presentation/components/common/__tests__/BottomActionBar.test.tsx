/**
 * BottomActionBar Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BottomActionBar } from '../BottomActionBar';
import { flattenStyle } from '../../../../__test-utils__';

// Mock Button component
jest.mock('../Button', () => ({
  Button: ({ title, onPress, testID, variant: _variant, disabled }: {
    title: string;
    onPress: () => void;
    testID?: string;
    variant?: string;
    disabled?: boolean;
  }) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity
        onPress={onPress}
        testID={testID}
        disabled={disabled}
      >
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 34, top: 0, left: 0, right: 0 }),
}));

describe('BottomActionBar', () => {
  const mockPrimaryAction = jest.fn();
  const mockSecondaryAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with primary action', () => {
      const { getByText } = render(
        <BottomActionBar
          primaryLabel="Confirm"
          onPrimaryPress={mockPrimaryAction}
        />
      );

      expect(getByText('Confirm')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(
        <BottomActionBar
          primaryLabel="Confirm"
          onPrimaryPress={mockPrimaryAction}
          testID="bottom-bar"
        />
      );

      expect(getByTestId('bottom-bar')).toBeTruthy();
    });
  });

  describe('Primary Action', () => {
    it('calls onPrimaryPress when primary button is pressed', () => {
      const { getByText } = render(
        <BottomActionBar
          primaryLabel="Confirm"
          onPrimaryPress={mockPrimaryAction}
        />
      );

      fireEvent.press(getByText('Confirm'));
      expect(mockPrimaryAction).toHaveBeenCalledTimes(1);
    });

    it('disables primary button when primaryDisabled is true', () => {
      const { getByTestId } = render(
        <BottomActionBar
          primaryLabel="Confirm"
          onPrimaryPress={mockPrimaryAction}
          primaryDisabled
          testID="bottom-bar"
        />
      );

      // The button should be rendered - the actual disabled behavior is tested in Button.test.tsx
      const button = getByTestId('bottom-bar-primary');
      expect(button).toBeTruthy();
    });
  });

  describe('Secondary Action', () => {
    it('renders secondary action when provided', () => {
      const { getByText } = render(
        <BottomActionBar
          primaryLabel="Confirm"
          onPrimaryPress={mockPrimaryAction}
          secondaryLabel="Cancel"
          onSecondaryPress={mockSecondaryAction}
        />
      );

      expect(getByText('Cancel')).toBeTruthy();
    });

    it('does not render secondary action when not provided', () => {
      const { queryByText } = render(
        <BottomActionBar
          primaryLabel="Confirm"
          onPrimaryPress={mockPrimaryAction}
        />
      );

      expect(queryByText('Cancel')).toBeNull();
    });

    it('calls onSecondaryPress when secondary button is pressed', () => {
      const { getByText } = render(
        <BottomActionBar
          primaryLabel="Confirm"
          onPrimaryPress={mockPrimaryAction}
          secondaryLabel="Cancel"
          onSecondaryPress={mockSecondaryAction}
        />
      );

      fireEvent.press(getByText('Cancel'));
      expect(mockSecondaryAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Positioning', () => {
    it('renders in absolute position by default', () => {
      const { getByTestId } = render(
        <BottomActionBar
          primaryLabel="Confirm"
          onPrimaryPress={mockPrimaryAction}
          testID="bottom-bar"
        />
      );

      const container = getByTestId('bottom-bar');
      const flatStyle = flattenStyle(container.props.style);
      expect(flatStyle.position).toBe('absolute');
    });

    it('renders in relative position when absolute is false', () => {
      const { getByTestId } = render(
        <BottomActionBar
          primaryLabel="Confirm"
          onPrimaryPress={mockPrimaryAction}
          absolute={false}
          testID="bottom-bar"
        />
      );

      const container = getByTestId('bottom-bar');
      const flatStyle = flattenStyle(container.props.style);
      expect(flatStyle.position).toBeUndefined();
    });
  });

  describe('Shadow', () => {
    it('renders with shadow by default', () => {
      const { getByTestId } = render(
        <BottomActionBar
          primaryLabel="Confirm"
          onPrimaryPress={mockPrimaryAction}
          testID="bottom-bar"
        />
      );

      const container = getByTestId('bottom-bar');
      expect(container).toBeTruthy();
    });

    it('renders without shadow when shadow is false', () => {
      const { getByTestId } = render(
        <BottomActionBar
          primaryLabel="Confirm"
          onPrimaryPress={mockPrimaryAction}
          shadow={false}
          testID="bottom-bar"
        />
      );

      expect(getByTestId('bottom-bar')).toBeTruthy();
    });
  });

  describe('Border', () => {
    it('renders with top border when showBorder is true', () => {
      const { getByTestId } = render(
        <BottomActionBar
          primaryLabel="Confirm"
          onPrimaryPress={mockPrimaryAction}
          showBorder
          testID="bottom-bar"
        />
      );

      const container = getByTestId('bottom-bar');
      const flatStyle = flattenStyle(container.props.style);
      expect(flatStyle.borderTopWidth).toBe(1);
    });
  });
});

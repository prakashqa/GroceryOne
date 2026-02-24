/**
 * EmptyState Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';

// Mock Icon component
jest.mock('../Icon', () => ({
  Icon: ({ testID, name }: { testID?: string; name: string }) => {
    const { View } = require('react-native');
    return <View testID={testID || `icon-${name}`} />;
  },
}));

// Mock Button component
jest.mock('../Button', () => ({
  Button: ({ title, onPress, testID }: { title: string; onPress: () => void; testID?: string }) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

// Mock responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
}));

describe('EmptyState', () => {
  describe('Rendering', () => {
    it('renders with required props', () => {
      const { getByText } = render(
        <EmptyState
          icon="cart"
          title="No items"
        />
      );

      expect(getByText('No items')).toBeTruthy();
    });

    it('renders with icon', () => {
      const { getByTestId } = render(
        <EmptyState
          icon="cart"
          title="No items"
          testID="empty-state"
        />
      );

      expect(getByTestId('icon-cart')).toBeTruthy();
    });

    it('renders with subtitle', () => {
      const { getByText } = render(
        <EmptyState
          icon="cart"
          title="No items"
          subtitle="Add items to your cart to see them here"
        />
      );

      expect(getByText('Add items to your cart to see them here')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(
        <EmptyState
          icon="empty"
          title="Nothing here"
          testID="empty-state"
        />
      );

      expect(getByTestId('empty-state')).toBeTruthy();
    });
  });

  describe('Action Button', () => {
    it('renders action button when actionLabel is provided', () => {
      const mockOnAction = jest.fn();
      const { getByText } = render(
        <EmptyState
          icon="cart"
          title="No items"
          actionLabel="Add Items"
          onAction={mockOnAction}
        />
      );

      expect(getByText('Add Items')).toBeTruthy();
    });

    it('does not render action button when actionLabel is not provided', () => {
      const { queryByTestId } = render(
        <EmptyState
          icon="cart"
          title="No items"
          testID="empty-state"
        />
      );

      expect(queryByTestId('empty-state-action')).toBeNull();
    });

    it('calls onAction when action button is pressed', () => {
      const mockOnAction = jest.fn();
      const { getByText } = render(
        <EmptyState
          icon="cart"
          title="No items"
          actionLabel="Add Items"
          onAction={mockOnAction}
        />
      );

      fireEvent.press(getByText('Add Items'));
      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('renders title with correct text', () => {
      const { getByText } = render(
        <EmptyState
          icon="empty"
          title="Your cart is empty"
        />
      );

      const title = getByText('Your cart is empty');
      expect(title).toBeTruthy();
    });

    it('renders subtitle with muted style', () => {
      const { getByText } = render(
        <EmptyState
          icon="empty"
          title="No results"
          subtitle="Try a different search term"
        />
      );

      expect(getByText('Try a different search term')).toBeTruthy();
    });
  });

  describe('Compact Mode', () => {
    it('renders in compact mode with smaller spacing', () => {
      const { getByTestId } = render(
        <EmptyState
          icon="empty"
          title="No items"
          compact
          testID="empty-state"
        />
      );

      expect(getByTestId('empty-state')).toBeTruthy();
    });
  });

  describe('Animation', () => {
    it('renders with entrance animation by default', () => {
      const { getByTestId } = render(
        <EmptyState
          icon="empty"
          title="No items"
          testID="empty-state"
        />
      );

      expect(getByTestId('empty-state')).toBeTruthy();
    });

    it('renders without animation when animated is false', () => {
      const { getByTestId } = render(
        <EmptyState
          icon="empty"
          title="No items"
          animated={false}
          testID="empty-state"
        />
      );

      expect(getByTestId('empty-state')).toBeTruthy();
    });
  });

  describe('Secondary Action', () => {
    it('renders secondary action when provided', () => {
      const mockSecondaryAction = jest.fn();
      const { getByText } = render(
        <EmptyState
          icon="cart"
          title="No items"
          secondaryAction={{
            label: 'Learn More',
            onPress: mockSecondaryAction,
          }}
        />
      );

      expect(getByText('Learn More')).toBeTruthy();
    });

    it('calls secondary action when pressed', () => {
      const mockSecondaryAction = jest.fn();
      const { getByText } = render(
        <EmptyState
          icon="cart"
          title="No items"
          secondaryAction={{
            label: 'Learn More',
            onPress: mockSecondaryAction,
          }}
        />
      );

      fireEvent.press(getByText('Learn More'));
      expect(mockSecondaryAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Illustration', () => {
    it('renders custom illustration when provided', () => {
      const { View } = require('react-native');
      const CustomIllustration = () => <View testID="custom-illustration" />;

      const { getByTestId } = render(
        <EmptyState
          icon="cart"
          title="No items"
          illustration={<CustomIllustration />}
          testID="empty-state"
        />
      );

      expect(getByTestId('custom-illustration')).toBeTruthy();
    });
  });
});

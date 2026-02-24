/**
 * QuickActionsGrid Component Tests
 * TDD tests for dashboard quick actions grid
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickActionsGrid } from '../QuickActionsGrid';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

describe('QuickActionsGrid', () => {
  const mockActions = [
    {
      id: 'scan-list',
      title: 'Scan List',
      subtitle: 'OCR from paper',
      icon: 'camera',
      onPress: jest.fn(),
    },
    {
      id: 'todays-report',
      title: "Today's Report",
      subtitle: 'View daily summary',
      icon: 'report',
      onPress: jest.fn(),
    },
    {
      id: 'manage-items',
      title: 'Manage Items',
      subtitle: 'Categories & Items',
      icon: 'box',
      onPress: jest.fn(),
    },
    {
      id: 'new-cart',
      title: 'New Cart',
      subtitle: 'Start picking',
      icon: 'cart',
      isPrimary: true,
      onPress: jest.fn(),
    },
  ];

  beforeEach(() => {
    mockActions.forEach(action => action.onPress.mockClear());
  });

  describe('Rendering', () => {
    it('renders all action items', () => {
      const { getByText } = render(
        <QuickActionsGrid actions={mockActions} />
      );

      expect(getByText('New Cart')).toBeTruthy();
      expect(getByText('Scan List')).toBeTruthy();
      expect(getByText("Today's Report")).toBeTruthy();
      expect(getByText('Manage Items')).toBeTruthy();
    });

    it('renders subtitles for each action', () => {
      const { getByText } = render(
        <QuickActionsGrid actions={mockActions} />
      );

      expect(getByText('Start picking')).toBeTruthy();
      expect(getByText('OCR from paper')).toBeTruthy();
      expect(getByText('View daily summary')).toBeTruthy();
      expect(getByText('Categories & Items')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(
        <QuickActionsGrid actions={mockActions} testID="quick-actions" />
      );

      expect(getByTestId('quick-actions')).toBeTruthy();
    });

    it('renders individual action items with testID', () => {
      const { getByTestId } = render(
        <QuickActionsGrid actions={mockActions} testID="quick-actions" />
      );

      expect(getByTestId('quick-action-new-cart')).toBeTruthy();
      expect(getByTestId('quick-action-scan-list')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onPress when action is tapped', () => {
      const { getByTestId } = render(
        <QuickActionsGrid actions={mockActions} testID="quick-actions" />
      );

      fireEvent.press(getByTestId('quick-action-scan-list'));
      expect(mockActions[0].onPress).toHaveBeenCalledTimes(1);
    });

    it('calls correct onPress for each action', () => {
      const { getByTestId } = render(
        <QuickActionsGrid actions={mockActions} testID="quick-actions" />
      );

      fireEvent.press(getByTestId('quick-action-todays-report'));
      expect(mockActions[1].onPress).toHaveBeenCalledTimes(1);
      expect(mockActions[0].onPress).not.toHaveBeenCalled();
    });

    it('calls onPress when primary action is tapped', () => {
      const { getByTestId } = render(
        <QuickActionsGrid actions={mockActions} testID="quick-actions" />
      );

      fireEvent.press(getByTestId('quick-action-new-cart'));
      expect(mockActions[3].onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Grid Layout', () => {
    it('renders in 2x2 grid layout', () => {
      const { getByTestId } = render(
        <QuickActionsGrid actions={mockActions} testID="quick-actions" />
      );

      const grid = getByTestId('quick-actions');
      expect(grid).toBeTruthy();
    });

    it('handles fewer than 4 actions gracefully', () => {
      const twoActions = mockActions.slice(0, 2);
      const { getByText, queryByText } = render(
        <QuickActionsGrid actions={twoActions} />
      );

      expect(getByText('Scan List')).toBeTruthy();
      expect(getByText("Today's Report")).toBeTruthy();
      expect(queryByText('Manage Items')).toBeNull();
    });

    it('renders primary action separately at the bottom', () => {
      const { getByTestId } = render(
        <QuickActionsGrid actions={mockActions} testID="quick-actions" />
      );
      // Primary action should still be rendered
      expect(getByTestId('quick-action-new-cart')).toBeTruthy();
    });

    it('handles empty actions array', () => {
      const { queryByTestId } = render(
        <QuickActionsGrid actions={[]} testID="quick-actions" />
      );

      expect(queryByTestId('quick-actions')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('action buttons have accessibility role', () => {
      const { getByTestId } = render(
        <QuickActionsGrid actions={mockActions} testID="quick-actions" />
      );

      const actionButton = getByTestId('quick-action-scan-list');
      expect(actionButton.props.accessibilityRole).toBe('button');
    });

    it('action buttons have accessibility label', () => {
      const { getByTestId } = render(
        <QuickActionsGrid actions={mockActions} testID="quick-actions" />
      );

      const actionButton = getByTestId('quick-action-scan-list');
      expect(actionButton.props.accessibilityLabel).toBe('Scan List: OCR from paper');
    });

    it('primary action button has accessibility role', () => {
      const { getByTestId } = render(
        <QuickActionsGrid actions={mockActions} testID="quick-actions" />
      );

      const primaryButton = getByTestId('quick-action-new-cart');
      expect(primaryButton.props.accessibilityRole).toBe('button');
    });

    it('primary action button has accessibility label', () => {
      const { getByTestId } = render(
        <QuickActionsGrid actions={mockActions} testID="quick-actions" />
      );

      const primaryButton = getByTestId('quick-action-new-cart');
      expect(primaryButton.props.accessibilityLabel).toBe('New Cart: Start picking');
    });
  });
});

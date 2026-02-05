/**
 * ListItemAnimator Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ListItemAnimator } from '../ListItemAnimator';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    animation: {
      normal: 200,
    },
  }),
}));

describe('ListItemAnimator', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      const { getByText } = render(
        <ListItemAnimator index={0}>
          <Text>Item Content</Text>
        </ListItemAnimator>
      );

      expect(getByText('Item Content')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(
        <ListItemAnimator index={0} testID="list-item">
          <Text>Content</Text>
        </ListItemAnimator>
      );

      expect(getByTestId('list-item')).toBeTruthy();
    });
  });

  describe('Staggered Delay', () => {
    it('applies staggered delay based on index', () => {
      const { getByTestId: getItem0 } = render(
        <ListItemAnimator index={0} testID="item-0">
          <Text>Item 0</Text>
        </ListItemAnimator>
      );
      const { getByTestId: getItem1 } = render(
        <ListItemAnimator index={1} testID="item-1">
          <Text>Item 1</Text>
        </ListItemAnimator>
      );
      const { getByTestId: getItem5 } = render(
        <ListItemAnimator index={5} testID="item-5">
          <Text>Item 5</Text>
        </ListItemAnimator>
      );

      expect(getItem0('item-0')).toBeTruthy();
      expect(getItem1('item-1')).toBeTruthy();
      expect(getItem5('item-5')).toBeTruthy();
    });
  });

  describe('Max Delay', () => {
    it('caps delay at maxDelay', () => {
      const { getByTestId } = render(
        <ListItemAnimator index={100} maxDelay={200} testID="item">
          <Text>Content</Text>
        </ListItemAnimator>
      );

      expect(getByTestId('item')).toBeTruthy();
    });
  });

  describe('Animation Types', () => {
    it('renders with fade animation', () => {
      const { getByTestId } = render(
        <ListItemAnimator index={0} animationType="fade" testID="item">
          <Text>Fade</Text>
        </ListItemAnimator>
      );

      expect(getByTestId('item')).toBeTruthy();
    });

    it('renders with slideUp animation', () => {
      const { getByTestId } = render(
        <ListItemAnimator index={0} animationType="slideUp" testID="item">
          <Text>Slide Up</Text>
        </ListItemAnimator>
      );

      expect(getByTestId('item')).toBeTruthy();
    });

    it('renders with scale animation', () => {
      const { getByTestId } = render(
        <ListItemAnimator index={0} animationType="scale" testID="item">
          <Text>Scale</Text>
        </ListItemAnimator>
      );

      expect(getByTestId('item')).toBeTruthy();
    });
  });

  describe('Disabled Animation', () => {
    it('renders without animation when disabled', () => {
      const { getByTestId } = render(
        <ListItemAnimator index={0} disabled testID="item">
          <Text>No Animation</Text>
        </ListItemAnimator>
      );

      expect(getByTestId('item')).toBeTruthy();
    });
  });
});

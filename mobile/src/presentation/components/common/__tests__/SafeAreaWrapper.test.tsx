/**
 * SafeAreaWrapper Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { SafeAreaWrapper } from '../SafeAreaWrapper';
import { flattenStyle } from '../../../../__test-utils__';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

// Mock safe area insets
const mockInsets = {
  top: 44,
  bottom: 34,
  left: 0,
  right: 0,
};

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets,
}));

describe('SafeAreaWrapper', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      const { getByText } = render(
        <SafeAreaWrapper>
          <Text>Test Content</Text>
        </SafeAreaWrapper>
      );

      expect(getByText('Test Content')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(
        <SafeAreaWrapper testID="safe-area">
          <Text>Content</Text>
        </SafeAreaWrapper>
      );

      expect(getByTestId('safe-area')).toBeTruthy();
    });
  });

  describe('Safe Area Edges', () => {
    it('applies top safe area by default', () => {
      const { getByTestId } = render(
        <SafeAreaWrapper testID="wrapper">
          <Text>Content</Text>
        </SafeAreaWrapper>
      );

      const wrapper = getByTestId('wrapper');
      const flatStyles = flattenStyle(wrapper.props.style);

      expect(flatStyles.paddingTop).toBe(44);
    });

    it('applies bottom safe area when specified', () => {
      const { getByTestId } = render(
        <SafeAreaWrapper testID="wrapper" edges={['top', 'bottom']}>
          <Text>Content</Text>
        </SafeAreaWrapper>
      );

      const wrapper = getByTestId('wrapper');
      const flatStyles = flattenStyle(wrapper.props.style);

      expect(flatStyles.paddingTop).toBe(44);
      expect(flatStyles.paddingBottom).toBe(34);
    });

    it('applies only bottom edge when specified', () => {
      const { getByTestId } = render(
        <SafeAreaWrapper testID="wrapper" edges={['bottom']}>
          <Text>Content</Text>
        </SafeAreaWrapper>
      );

      const wrapper = getByTestId('wrapper');
      const flatStyles = flattenStyle(wrapper.props.style);

      expect(flatStyles.paddingTop).toBeUndefined();
      expect(flatStyles.paddingBottom).toBe(34);
    });

    it('applies all edges when specified', () => {
      const { getByTestId } = render(
        <SafeAreaWrapper testID="wrapper" edges={['top', 'bottom', 'left', 'right']}>
          <Text>Content</Text>
        </SafeAreaWrapper>
      );

      const wrapper = getByTestId('wrapper');
      const flatStyles = flattenStyle(wrapper.props.style);

      expect(flatStyles.paddingTop).toBe(44);
      expect(flatStyles.paddingBottom).toBe(34);
      expect(flatStyles.paddingLeft).toBe(0);
      expect(flatStyles.paddingRight).toBe(0);
    });
  });

  describe('Background Color', () => {
    it('applies theme background color by default', () => {
      const { getByTestId } = render(
        <SafeAreaWrapper testID="wrapper">
          <Text>Content</Text>
        </SafeAreaWrapper>
      );

      const wrapper = getByTestId('wrapper');
      const flatStyles = flattenStyle(wrapper.props.style);

      expect(flatStyles.backgroundColor).toBe('#F5F5F5');
    });

    it('applies custom background color', () => {
      const { getByTestId } = render(
        <SafeAreaWrapper testID="wrapper" backgroundColor="#FF0000">
          <Text>Content</Text>
        </SafeAreaWrapper>
      );

      const wrapper = getByTestId('wrapper');
      const flatStyles = flattenStyle(wrapper.props.style);

      expect(flatStyles.backgroundColor).toBe('#FF0000');
    });
  });

  describe('Custom Styles', () => {
    it('combines with custom styles', () => {
      const { getByTestId } = render(
        <SafeAreaWrapper testID="wrapper" style={{ borderWidth: 1, borderColor: 'red' }}>
          <Text>Content</Text>
        </SafeAreaWrapper>
      );

      const wrapper = getByTestId('wrapper');
      const flatStyles = flattenStyle(wrapper.props.style);

      expect(flatStyles.borderWidth).toBe(1);
      expect(flatStyles.borderColor).toBe('red');
    });

    it('custom styles override default styles', () => {
      const { getByTestId } = render(
        <SafeAreaWrapper testID="wrapper" style={{ paddingTop: 100 }}>
          <Text>Content</Text>
        </SafeAreaWrapper>
      );

      const wrapper = getByTestId('wrapper');
      const flatStyles = flattenStyle(wrapper.props.style);

      // Custom style should override
      expect(flatStyles.paddingTop).toBe(100);
    });
  });

  describe('Accessibility', () => {
    it('is accessible', () => {
      const { getByTestId } = render(
        <SafeAreaWrapper testID="wrapper">
          <Text>Accessible Content</Text>
        </SafeAreaWrapper>
      );

      expect(getByTestId('wrapper')).toBeTruthy();
    });
  });

  describe('Multiple Children', () => {
    it('renders multiple children correctly', () => {
      const { getByText } = render(
        <SafeAreaWrapper>
          <Text>First</Text>
          <Text>Second</Text>
          <View>
            <Text>Nested</Text>
          </View>
        </SafeAreaWrapper>
      );

      expect(getByText('First')).toBeTruthy();
      expect(getByText('Second')).toBeTruthy();
      expect(getByText('Nested')).toBeTruthy();
    });
  });
});

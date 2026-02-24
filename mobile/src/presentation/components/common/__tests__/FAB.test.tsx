/**
 * FAB Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FAB } from '../FAB';
import { flattenStyle } from '../../../../__test-utils__';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

// Mock Icon component
jest.mock('../Icon', () => ({
  Icon: ({ name, testID }: { name: string; testID?: string }) => {
    const { Text } = require('react-native');
    return <Text testID={testID}>{name}</Text>;
  },
}));

describe('FAB', () => {
  it('renders correctly', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <FAB onPress={onPress} testID="fab" />
    );
    expect(getByTestId('fab')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <FAB onPress={onPress} testID="fab" />
    );
    fireEvent.press(getByTestId('fab'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has correct dimensions (56x56)', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <FAB onPress={onPress} testID="fab" />
    );
    const fab = getByTestId('fab');
    const style = fab.props.style;
    const flatStyle = flattenStyle(style);
    expect(flatStyle.width).toBe(56);
    expect(flatStyle.height).toBe(56);
  });

  it('has circular border radius', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <FAB onPress={onPress} testID="fab" />
    );
    const fab = getByTestId('fab');
    const style = fab.props.style;
    const flatStyle = flattenStyle(style);
    expect(flatStyle.borderRadius).toBe(28); // 56 / 2
  });

  it('has accessibility label', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <FAB onPress={onPress} testID="fab" accessibilityLabel="Add item" />
    );
    const fab = getByTestId('fab');
    expect(fab.props.accessibilityLabel).toBe('Add item');
  });

  it('renders add icon by default', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <FAB onPress={onPress} testID="fab" />
    );
    expect(getByText('add')).toBeTruthy();
  });
});

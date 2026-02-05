/**
 * FAB Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FAB } from '../FAB';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#2E7D32',
      textInverse: '#FFFFFF',
    },
    spacing: {
      xs: 4,
      sm: 8,
      smd: 12,
      md: 16,
      lg: 24,
      xl: 32,
    },
    buttonHeights: {
      sm: 36,
      md: 48,
      lg: 56,
    },
    shadows: {
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      },
    },
  }),
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
    const flatStyle = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
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
    const flatStyle = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
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

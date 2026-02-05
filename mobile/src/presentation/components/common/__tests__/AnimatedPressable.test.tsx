/**
 * AnimatedPressable Component Tests
 */

import React from 'react';
import { Text } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import AnimatedPressable from '../AnimatedPressable';

describe('AnimatedPressable', () => {
  it('should render children correctly', () => {
    const { getByText } = renderWithProviders(
      <AnimatedPressable>
        <Text>Test Content</Text>
      </AnimatedPressable>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <AnimatedPressable onPress={onPress} testID="pressable">
        <Text>Press Me</Text>
      </AnimatedPressable>
    );

    fireEvent.press(getByTestId('pressable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should call custom pressIn and pressOut callbacks', () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const { getByTestId } = renderWithProviders(
      <AnimatedPressable
        testID="animated-pressable"
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Text>Animated</Text>
      </AnimatedPressable>
    );

    const pressable = getByTestId('animated-pressable');

    // Simulate press in and out
    fireEvent(pressable, 'pressIn');
    expect(onPressIn).toHaveBeenCalled();

    fireEvent(pressable, 'pressOut');
    expect(onPressOut).toHaveBeenCalled();
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <AnimatedPressable onPress={onPress} disabled testID="disabled-pressable">
        <Text>Disabled</Text>
      </AnimatedPressable>
    );

    fireEvent.press(getByTestId('disabled-pressable'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should accept custom scaleValue prop', () => {
    const { getByTestId } = renderWithProviders(
      <AnimatedPressable scaleValue={0.9} testID="custom-scale">
        <Text>Custom Scale</Text>
      </AnimatedPressable>
    );

    expect(getByTestId('custom-scale')).toBeTruthy();
  });

  it('should apply custom styles', () => {
    const { getByTestId } = renderWithProviders(
      <AnimatedPressable
        testID="styled-pressable"
        style={{ backgroundColor: 'red', padding: 10 }}
      >
        <Text>Styled</Text>
      </AnimatedPressable>
    );

    expect(getByTestId('styled-pressable')).toBeTruthy();
  });

  it('should have accessible role button', () => {
    const { getByTestId } = renderWithProviders(
      <AnimatedPressable testID="accessible-pressable" onPress={() => {}}>
        <Text>Accessible</Text>
      </AnimatedPressable>
    );

    const pressable = getByTestId('accessible-pressable');
    expect(pressable.props.accessibilityRole).toBe('button');
  });
});

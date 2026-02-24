/**
 * FadeInView Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FadeInView } from '../FadeInView';

// Mock Animated to make testing easier
jest.useFakeTimers();

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

describe('FadeInView', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <FadeInView>
        <Text>Test Content</Text>
      </FadeInView>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('renders with custom testID', () => {
    const { getByTestId } = render(
      <FadeInView testID="fade-in-container">
        <Text>Test Content</Text>
      </FadeInView>
    );

    expect(getByTestId('fade-in-container')).toBeTruthy();
  });

  it('accepts delay prop', () => {
    const { getByText } = render(
      <FadeInView delay={200}>
        <Text>Delayed Content</Text>
      </FadeInView>
    );

    // Component should still render children
    expect(getByText('Delayed Content')).toBeTruthy();
  });

  it('accepts duration prop', () => {
    const { getByText } = render(
      <FadeInView duration={500}>
        <Text>Custom Duration</Text>
      </FadeInView>
    );

    expect(getByText('Custom Duration')).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <FadeInView>
        <Text>First Child</Text>
        <Text>Second Child</Text>
      </FadeInView>
    );

    expect(getByText('First Child')).toBeTruthy();
    expect(getByText('Second Child')).toBeTruthy();
  });

  it('applies custom style', () => {
    const customStyle = { marginTop: 20 };
    const { getByTestId } = render(
      <FadeInView style={customStyle} testID="styled-fade">
        <Text>Styled Content</Text>
      </FadeInView>
    );

    const container = getByTestId('styled-fade');
    expect(container.props.style).toBeDefined();
  });
});

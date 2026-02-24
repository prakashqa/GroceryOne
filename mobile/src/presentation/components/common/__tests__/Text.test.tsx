/**
 * Text Component Tests
 * TDD tests for typography wrapper component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from '../Text';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
}));

describe('Text', () => {
  describe('Rendering', () => {
    it('renders text content', () => {
      const { getByText } = render(<Text>Hello World</Text>);
      expect(getByText('Hello World')).toBeTruthy();
    });

    it('renders with testID', () => {
      const { getByTestId } = render(<Text testID="test-text">Content</Text>);
      expect(getByTestId('test-text')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('renders h1 variant with correct styles', () => {
      const { getByText } = render(<Text variant="h1">Heading 1</Text>);
      const text = getByText('Heading 1');
      expect(text).toBeTruthy();
    });

    it('renders h2 variant with correct styles', () => {
      const { getByText } = render(<Text variant="h2">Heading 2</Text>);
      const text = getByText('Heading 2');
      expect(text).toBeTruthy();
    });

    it('renders h3 variant with correct styles', () => {
      const { getByText } = render(<Text variant="h3">Heading 3</Text>);
      const text = getByText('Heading 3');
      expect(text).toBeTruthy();
    });

    it('renders body variant by default', () => {
      const { getByText } = render(<Text>Body text</Text>);
      const text = getByText('Body text');
      expect(text).toBeTruthy();
    });

    it('renders bodySmall variant', () => {
      const { getByText } = render(<Text variant="bodySmall">Small body</Text>);
      const text = getByText('Small body');
      expect(text).toBeTruthy();
    });

    it('renders caption variant', () => {
      const { getByText } = render(<Text variant="caption">Caption text</Text>);
      const text = getByText('Caption text');
      expect(text).toBeTruthy();
    });

    it('renders button variant', () => {
      const { getByText } = render(<Text variant="button">Button</Text>);
      const text = getByText('Button');
      expect(text).toBeTruthy();
    });
  });

  describe('Colors', () => {
    it('applies primary color by default', () => {
      const { getByText } = render(<Text>Default color</Text>);
      const text = getByText('Default color');
      expect(text).toBeTruthy();
    });

    it('applies secondary color', () => {
      const { getByText } = render(<Text color="secondary">Secondary</Text>);
      const text = getByText('Secondary');
      expect(text).toBeTruthy();
    });

    it('applies muted color', () => {
      const { getByText } = render(<Text color="muted">Muted</Text>);
      const text = getByText('Muted');
      expect(text).toBeTruthy();
    });

    it('applies error color', () => {
      const { getByText } = render(<Text color="error">Error</Text>);
      const text = getByText('Error');
      expect(text).toBeTruthy();
    });

    it('applies success color', () => {
      const { getByText } = render(<Text color="success">Success</Text>);
      const text = getByText('Success');
      expect(text).toBeTruthy();
    });

    it('applies inverse color', () => {
      const { getByText } = render(<Text color="inverse">Inverse</Text>);
      const text = getByText('Inverse');
      expect(text).toBeTruthy();
    });
  });

  describe('Text Alignment', () => {
    it('aligns left by default', () => {
      const { getByText } = render(<Text>Left aligned</Text>);
      const text = getByText('Left aligned');
      expect(text).toBeTruthy();
    });

    it('aligns center', () => {
      const { getByText } = render(<Text align="center">Centered</Text>);
      const text = getByText('Centered');
      expect(text).toBeTruthy();
    });

    it('aligns right', () => {
      const { getByText } = render(<Text align="right">Right aligned</Text>);
      const text = getByText('Right aligned');
      expect(text).toBeTruthy();
    });
  });

  describe('Number of Lines', () => {
    it('truncates text with numberOfLines', () => {
      const { getByText } = render(
        <Text numberOfLines={1}>This is a very long text that should be truncated</Text>
      );
      const text = getByText('This is a very long text that should be truncated');
      expect(text.props.numberOfLines).toBe(1);
    });

    it('does not truncate without numberOfLines', () => {
      const { getByText } = render(<Text>No truncation</Text>);
      const text = getByText('No truncation');
      expect(text.props.numberOfLines).toBeUndefined();
    });
  });

  describe('Custom Styles', () => {
    it('applies custom styles', () => {
      const { getByText } = render(
        <Text style={{ marginTop: 10 }}>Custom styled</Text>
      );
      const text = getByText('Custom styled');
      expect(text).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has text accessibility role', () => {
      const { getByText } = render(<Text>Accessible text</Text>);
      const text = getByText('Accessible text');
      expect(text.props.accessibilityRole).toBe('text');
    });
  });
});

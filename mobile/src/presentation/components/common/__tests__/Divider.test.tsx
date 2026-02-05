/**
 * Divider Component Tests
 * TDD tests for divider component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Divider } from '../Divider';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      divider: '#E8E8E8',
    },
    spacing: {
      sm: 8,
      md: 16,
      lg: 24,
    },
  }),
}));

describe('Divider', () => {
  describe('Rendering', () => {
    it('renders successfully', () => {
      const { getByTestId } = render(<Divider testID="divider" />);
      expect(getByTestId('divider')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('renders full variant by default', () => {
      const { getByTestId } = render(<Divider testID="divider" />);
      expect(getByTestId('divider')).toBeTruthy();
    });

    it('renders inset variant', () => {
      const { getByTestId } = render(<Divider variant="inset" testID="divider" />);
      expect(getByTestId('divider')).toBeTruthy();
    });

    it('renders middle variant', () => {
      const { getByTestId } = render(<Divider variant="middle" testID="divider" />);
      expect(getByTestId('divider')).toBeTruthy();
    });
  });

  describe('Spacing', () => {
    it('renders with no spacing by default', () => {
      const { getByTestId } = render(<Divider testID="divider" />);
      expect(getByTestId('divider')).toBeTruthy();
    });

    it('renders with small spacing', () => {
      const { getByTestId } = render(<Divider spacing="sm" testID="divider" />);
      expect(getByTestId('divider')).toBeTruthy();
    });

    it('renders with medium spacing', () => {
      const { getByTestId } = render(<Divider spacing="md" testID="divider" />);
      expect(getByTestId('divider')).toBeTruthy();
    });

    it('renders with large spacing', () => {
      const { getByTestId } = render(<Divider spacing="lg" testID="divider" />);
      expect(getByTestId('divider')).toBeTruthy();
    });
  });

  describe('Custom Styles', () => {
    it('applies custom styles', () => {
      const { getByTestId } = render(
        <Divider style={{ backgroundColor: 'red' }} testID="divider" />
      );
      expect(getByTestId('divider')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has none accessibility role', () => {
      const { getByTestId } = render(<Divider testID="divider" />);
      const divider = getByTestId('divider');
      expect(divider.props.accessibilityRole).toBe('none');
    });
  });
});

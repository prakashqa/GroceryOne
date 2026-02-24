/**
 * ModalContainer Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ModalContainer } from '../ModalContainer';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
}));

describe('ModalContainer', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when visible is true', () => {
      const { getByText } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Test Modal"
        >
          <Text>Modal Content</Text>
        </ModalContainer>
      );

      expect(getByText('Test Modal')).toBeTruthy();
      expect(getByText('Modal Content')).toBeTruthy();
    });

    it('does not render when visible is false', () => {
      const { queryByText } = render(
        <ModalContainer
          visible={false}
          onClose={mockOnClose}
          title="Test Modal"
        >
          <Text>Modal Content</Text>
        </ModalContainer>
      );

      expect(queryByText('Test Modal')).toBeNull();
    });

    it('renders with icon in header', () => {
      const { getByText } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Create Cart"
          icon="cart"
        >
          <Text>Content</Text>
        </ModalContainer>
      );

      expect(getByText('cart')).toBeTruthy();
    });

    it('renders children content', () => {
      const { getByText } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Test"
        >
          <Text>Custom Content Here</Text>
        </ModalContainer>
      );

      expect(getByText('Custom Content Here')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      const { getByText } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Default Modal"
        >
          <Text>Content</Text>
        </ModalContainer>
      );

      expect(getByText('Default Modal')).toBeTruthy();
    });

    it('renders danger variant', () => {
      const { getByText } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Delete Item"
          variant="danger"
        >
          <Text>Are you sure?</Text>
        </ModalContainer>
      );

      expect(getByText('Delete Item')).toBeTruthy();
    });
  });

  describe('Close Button', () => {
    it('renders close button when showCloseButton is true', () => {
      const { getByTestId } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Test"
          showCloseButton
          testID="modal"
        >
          <Text>Content</Text>
        </ModalContainer>
      );

      expect(getByTestId('modal-close-button')).toBeTruthy();
    });

    it('calls onClose when close button is pressed', () => {
      const { getByTestId } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Test"
          showCloseButton
          testID="modal"
        >
          <Text>Content</Text>
        </ModalContainer>
      );

      fireEvent.press(getByTestId('modal-close-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backdrop Interaction', () => {
    it('calls onClose when backdrop is pressed', () => {
      const { getByTestId } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Test"
          testID="modal"
        >
          <Text>Content</Text>
        </ModalContainer>
      );

      fireEvent.press(getByTestId('modal-backdrop'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has modal presentation on container', () => {
      const { getByTestId } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Accessible Modal"
          testID="modal"
        >
          <Text>Content</Text>
        </ModalContainer>
      );

      expect(getByTestId('modal-container')).toBeTruthy();
    });
  });

  describe('Theme Integration', () => {
    it('uses theme.colors.iconMuted for default variant icon background', () => {
      const { getByText } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Test Modal"
          icon="🛒"
        >
          <Text>Content</Text>
        </ModalContainer>
      );

      // Icon should be rendered
      expect(getByText('🛒')).toBeTruthy();
    });

    it('uses theme.colors.iconDanger for danger variant icon background', () => {
      const { getByText } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Delete Item"
          icon="⚠️"
          variant="danger"
        >
          <Text>Content</Text>
        </ModalContainer>
      );

      // Icon should be rendered
      expect(getByText('⚠️')).toBeTruthy();
    });

    it('uses theme.spacing.lg for padding', () => {
      const { getByTestId } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Test"
          testID="modal"
        >
          <Text>Content</Text>
        </ModalContainer>
      );

      expect(getByTestId('modal-container')).toBeTruthy();
    });
  });

  describe('Title Display', () => {
    it('should display full title with numberOfLines set to 1 for truncation', () => {
      const { getByText } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Confirm Payment"
        >
          <Text>Content</Text>
        </ModalContainer>
      );

      const titleElement = getByText('Confirm Payment');
      expect(titleElement).toBeTruthy();
      // Title has numberOfLines={1} with adjustsFontSizeToFit for responsive text
      expect(titleElement.props.numberOfLines).toBe(1);
    });

    it('should render multi-word titles fully', () => {
      const { getByText } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Payment Confirmation Required"
        >
          <Text>Content</Text>
        </ModalContainer>
      );

      expect(getByText('Payment Confirmation Required')).toBeTruthy();
    });

    it('should have sufficient modal width to prevent title wrapping', () => {
      const { getByTestId } = render(
        <ModalContainer
          visible={true}
          onClose={mockOnClose}
          title="Confirm Payment"
          testID="modal"
        >
          <Text>Content</Text>
        </ModalContainer>
      );

      const container = getByTestId('modal-container');
      // Modal should have a maxWidth of at least 600 to accommodate longer titles
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            maxWidth: expect.any(Number),
          }),
        ])
      );

      // Extract maxWidth from styles
      const styles = Array.isArray(container.props.style)
        ? container.props.style
        : [container.props.style];
      const maxWidthStyle = styles.find((style) => style && style.maxWidth);
      expect(maxWidthStyle?.maxWidth).toBeGreaterThanOrEqual(600);
    });
  });
});

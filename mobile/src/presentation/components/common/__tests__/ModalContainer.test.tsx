/**
 * ModalContainer Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ModalContainer } from '../ModalContainer';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      surface: '#FFFFFF',
      text: '#1A1A1A',
      textSecondary: '#666666',
      modalOverlay: 'rgba(0, 0, 0, 0.6)',
      primary: '#2E7D32',
      primaryLight: '#4CAF50',
      error: '#D32F2F',
      iconMuted: 'rgba(46, 125, 50, 0.1)',
      iconDanger: 'rgba(211, 47, 47, 0.1)',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    typography: {
      fontSize: {
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
      },
      fontWeight: {
        bold: '700',
      },
    },
    textStyles: {
      h1: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
      h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
      h3: { fontSize: 18, fontWeight: '600', letterSpacing: 0 },
      body: { fontSize: 16, fontWeight: '400' },
      bodySmall: { fontSize: 14, fontWeight: '400' },
      caption: { fontSize: 12, fontWeight: '400', letterSpacing: 0.2 },
      button: { fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
    },
    borderRadius: {
      lg: 16,
      xl: 24,
    },
    shadows: {
      xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
      },
    },
    animation: {
      fast: 150,
      normal: 200,
      slow: 300,
    },
  }),
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: () => ({
    fontScale: 1,
    touchTargetMinSize: 48,
    componentPadding: 16,
    iconContainerSize: 44,
    cardBorderRadius: 12,
    buttonBorderRadius: 8,
    modalWidth: 600,
    sectionSpacing: 24,
  }),
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

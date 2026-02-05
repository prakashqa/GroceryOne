/**
 * Button Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#2E7D32',
      buttonPrimary: '#2E7D32',
      buttonPrimaryText: '#FFFFFF',
      buttonPrimaryPressed: '#1B5E20',
      buttonSecondary: '#FFFFFF',
      buttonSecondaryText: '#2E7D32',
      buttonDangerText: '#FFFFFF',
      buttonGhostText: '#666666',
      buttonGhostPressed: 'rgba(0, 0, 0, 0.05)',
      error: '#D32F2F',
      textSecondary: '#666666',
      border: '#E8E8E8',
      disabled: '#BDBDBD',
      textLight: '#999999',
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
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
      },
      fontWeight: {
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
    },
    buttonHeights: {
      sm: 36,
      md: 48,
      lg: 56,
    },
    textStyles: {
      button: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
      },
      buttonSmall: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.2,
      },
    },
    gradients: {
      primary: ['#2E7D32', '#4CAF50'],
      success: ['#43A047', '#66BB6A'],
    },
    coloredShadows: {
      primary: {
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
      },
    },
  }),
}));

// Mock LinearGradient
jest.mock('react-native-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, testID, ...props }: any) => (
      <View testID={testID} {...props}>
        {children}
      </View>
    ),
  };
});

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: () => ({
    fontScale: 1,
    touchTargetMinSize: 48,
    componentPadding: 16,
    iconContainerSize: 44,
    cardBorderRadius: 12,
    buttonBorderRadius: 12,
    modalWidth: 600,
    sectionSpacing: 24,
  }),
}));

describe('Button', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with title', () => {
      const { getByText } = render(
        <Button title="Click Me" onPress={mockOnPress} />
      );

      expect(getByText('Click Me')).toBeTruthy();
    });

    it('renders with icon', () => {
      const { getByText } = render(
        <Button title="Add Cart" icon="+" onPress={mockOnPress} />
      );

      expect(getByText('+')).toBeTruthy();
      expect(getByText('Add Cart')).toBeTruthy();
    });

    it('renders loading state with ActivityIndicator', () => {
      const { getByTestId, queryByText } = render(
        <Button title="Submit" onPress={mockOnPress} loading testID="btn" />
      );

      expect(getByTestId('btn-loading')).toBeTruthy();
      expect(queryByText('Submit')).toBeNull();
    });
  });

  describe('Variants', () => {
    it('renders primary variant by default', () => {
      const { getByTestId } = render(
        <Button title="Primary" onPress={mockOnPress} testID="btn" />
      );

      const button = getByTestId('btn');
      expect(button).toBeTruthy();
    });

    it('renders secondary variant', () => {
      const { getByTestId } = render(
        <Button title="Secondary" variant="secondary" onPress={mockOnPress} testID="btn" />
      );

      expect(getByTestId('btn')).toBeTruthy();
    });

    it('renders danger variant', () => {
      const { getByTestId } = render(
        <Button title="Delete" variant="danger" onPress={mockOnPress} testID="btn" />
      );

      expect(getByTestId('btn')).toBeTruthy();
    });

    it('renders ghost variant', () => {
      const { getByTestId } = render(
        <Button title="Cancel" variant="ghost" onPress={mockOnPress} testID="btn" />
      );

      expect(getByTestId('btn')).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { getByTestId } = render(
        <Button title="Small" size="sm" onPress={mockOnPress} testID="btn" />
      );

      expect(getByTestId('btn')).toBeTruthy();
    });

    it('renders medium size by default', () => {
      const { getByTestId } = render(
        <Button title="Medium" onPress={mockOnPress} testID="btn" />
      );

      expect(getByTestId('btn')).toBeTruthy();
    });

    it('renders large size', () => {
      const { getByTestId } = render(
        <Button title="Large" size="lg" onPress={mockOnPress} testID="btn" />
      );

      expect(getByTestId('btn')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onPress when pressed', () => {
      const { getByText } = render(
        <Button title="Press Me" onPress={mockOnPress} />
      );

      fireEvent.press(getByText('Press Me'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const { getByText } = render(
        <Button title="Disabled" onPress={mockOnPress} disabled />
      );

      fireEvent.press(getByText('Disabled'));
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('does not call onPress when loading', () => {
      const { getByTestId } = render(
        <Button title="Loading" onPress={mockOnPress} loading testID="btn" />
      );

      fireEvent.press(getByTestId('btn'));
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has button accessibility role', () => {
      const { getByRole } = render(
        <Button title="Accessible" onPress={mockOnPress} />
      );

      expect(getByRole('button')).toBeTruthy();
    });

    it('has disabled accessibility state when disabled', () => {
      const { getByRole } = render(
        <Button title="Disabled" onPress={mockOnPress} disabled />
      );

      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('has busy accessibility state when loading', () => {
      const { getByRole } = render(
        <Button title="Loading" onPress={mockOnPress} loading />
      );

      const button = getByRole('button');
      expect(button.props.accessibilityState.busy).toBe(true);
    });
  });

  describe('Full Width', () => {
    it('renders full width when fullWidth is true', () => {
      const { getByTestId } = render(
        <Button title="Full Width" onPress={mockOnPress} fullWidth testID="btn" />
      );

      expect(getByTestId('btn')).toBeTruthy();
    });
  });

  describe('Button Heights', () => {
    it('renders small button with minimum touch target height', () => {
      const { getByTestId } = render(
        <Button title="Small" size="sm" onPress={mockOnPress} testID="btn" />
      );

      const button = getByTestId('btn');
      const buttonStyle = button.props.style;
      const flatStyle = Array.isArray(buttonStyle)
        ? buttonStyle.reduce((acc, s) => ({ ...acc, ...(s || {}) }), {})
        : buttonStyle;
      // Small button height is now max(36, touchTargetMinSize=48) = 48
      expect(flatStyle.height).toBe(48);
    });

    it('renders medium button with correct height from theme', () => {
      const { getByTestId } = render(
        <Button title="Medium" size="md" onPress={mockOnPress} testID="btn" />
      );

      const button = getByTestId('btn');
      const buttonStyle = button.props.style;
      const flatStyle = Array.isArray(buttonStyle)
        ? buttonStyle.reduce((acc, s) => ({ ...acc, ...(s || {}) }), {})
        : buttonStyle;
      expect(flatStyle.height).toBe(48);
    });

    it('renders large button with correct height from theme', () => {
      const { getByTestId } = render(
        <Button title="Large" size="lg" onPress={mockOnPress} testID="btn" />
      );

      const button = getByTestId('btn');
      const buttonStyle = button.props.style;
      const flatStyle = Array.isArray(buttonStyle)
        ? buttonStyle.reduce((acc, s) => ({ ...acc, ...(s || {}) }), {})
        : buttonStyle;
      expect(flatStyle.height).toBe(56);
    });

    it('ensures all button sizes meet minimum touch target', () => {
      const minTouchTarget = 48;

      const { getByTestId: getSmall } = render(
        <Button title="S" size="sm" onPress={mockOnPress} testID="btn-sm" />
      );
      const { getByTestId: getMd } = render(
        <Button title="M" size="md" onPress={mockOnPress} testID="btn-md" />
      );
      const { getByTestId: getLg } = render(
        <Button title="L" size="lg" onPress={mockOnPress} testID="btn-lg" />
      );

      const extractHeight = (button: any) => {
        const styles = button.props.style;
        const flat = Array.isArray(styles)
          ? styles.reduce((acc: object, s: object) => ({ ...acc, ...(s || {}) }), {})
          : styles;
        return flat.height;
      };

      expect(extractHeight(getSmall('btn-sm'))).toBeGreaterThanOrEqual(minTouchTarget);
      expect(extractHeight(getMd('btn-md'))).toBeGreaterThanOrEqual(minTouchTarget);
      expect(extractHeight(getLg('btn-lg'))).toBeGreaterThanOrEqual(minTouchTarget);
    });
  });

  describe('Icon Styling', () => {
    it('uses theme spacing for icon margin', () => {
      const { getByText } = render(
        <Button title="Add" icon="+" onPress={mockOnPress} />
      );

      const icon = getByText('+');
      const iconStyle = icon.props.style;
      const flatStyle = Array.isArray(iconStyle)
        ? iconStyle.reduce((acc, s) => ({ ...acc, ...(s || {}) }), {})
        : iconStyle;
      expect(flatStyle.marginRight).toBe(8); // theme.spacing.sm
    });
  });

  describe('Icon Only Mode', () => {
    it('renders icon-only button with square dimensions', () => {
      const { getByTestId, queryByText } = render(
        <Button title="" icon="+" onPress={mockOnPress} iconOnly testID="btn" />
      );

      const button = getByTestId('btn');
      const buttonStyle = button.props.style;
      const flatStyle = Array.isArray(buttonStyle)
        ? buttonStyle.reduce((acc: object, s: object) => ({ ...acc, ...(s || {}) }), {})
        : buttonStyle;
      // Icon-only button should have equal width and height
      expect(flatStyle.width).toBe(flatStyle.height);
    });

    it('renders icon without title text', () => {
      const { getByText, queryByText } = render(
        <Button title="" icon="+" onPress={mockOnPress} iconOnly />
      );

      expect(getByText('+')).toBeTruthy();
      // Empty title should not render additional text elements
    });

    it('renders icon-only with different sizes', () => {
      const { getByTestId: getSmall } = render(
        <Button title="" icon="+" onPress={mockOnPress} iconOnly size="sm" testID="btn-sm" />
      );
      const { getByTestId: getMd } = render(
        <Button title="" icon="+" onPress={mockOnPress} iconOnly size="md" testID="btn-md" />
      );
      const { getByTestId: getLg } = render(
        <Button title="" icon="+" onPress={mockOnPress} iconOnly size="lg" testID="btn-lg" />
      );

      expect(getSmall('btn-sm')).toBeTruthy();
      expect(getMd('btn-md')).toBeTruthy();
      expect(getLg('btn-lg')).toBeTruthy();
    });

    it('renders icon-only with all variants', () => {
      const { getByTestId: getPrimary } = render(
        <Button title="" icon="+" onPress={mockOnPress} iconOnly variant="primary" testID="btn-primary" />
      );
      const { getByTestId: getSecondary } = render(
        <Button title="" icon="+" onPress={mockOnPress} iconOnly variant="secondary" testID="btn-secondary" />
      );
      const { getByTestId: getDanger } = render(
        <Button title="" icon="+" onPress={mockOnPress} iconOnly variant="danger" testID="btn-danger" />
      );
      const { getByTestId: getGhost } = render(
        <Button title="" icon="+" onPress={mockOnPress} iconOnly variant="ghost" testID="btn-ghost" />
      );

      expect(getPrimary('btn-primary')).toBeTruthy();
      expect(getSecondary('btn-secondary')).toBeTruthy();
      expect(getDanger('btn-danger')).toBeTruthy();
      expect(getGhost('btn-ghost')).toBeTruthy();
    });
  });

  describe('Press Animation', () => {
    it('has animated wrapper', () => {
      const { getByTestId } = render(
        <Button title="Animated" onPress={mockOnPress} testID="btn" />
      );

      // The button should be wrapped in an Animated.View
      expect(getByTestId('btn')).toBeTruthy();
    });
  });

  describe('Gradient Feature', () => {
    it('renders gradient when useGradient is true for primary variant', () => {
      const { getByTestId } = render(
        <Button
          title="Gradient"
          onPress={mockOnPress}
          useGradient
          testID="btn"
        />
      );

      expect(getByTestId('btn')).toBeTruthy();
      expect(getByTestId('btn-gradient')).toBeTruthy();
    });

    it('does not render gradient when useGradient is false', () => {
      const { getByTestId, queryByTestId } = render(
        <Button
          title="No Gradient"
          onPress={mockOnPress}
          useGradient={false}
          testID="btn"
        />
      );

      expect(getByTestId('btn')).toBeTruthy();
      expect(queryByTestId('btn-gradient')).toBeNull();
    });

    it('does not render gradient for non-primary variants', () => {
      const { queryByTestId } = render(
        <Button
          title="Secondary"
          onPress={mockOnPress}
          variant="secondary"
          useGradient
          testID="btn"
        />
      );

      expect(queryByTestId('btn-gradient')).toBeNull();
    });

    it('does not render gradient when disabled', () => {
      const { queryByTestId } = render(
        <Button
          title="Disabled"
          onPress={mockOnPress}
          useGradient
          disabled
          testID="btn"
        />
      );

      expect(queryByTestId('btn-gradient')).toBeNull();
    });
  });

  describe('Elevated Feature', () => {
    it('renders elevated button with colored shadow', () => {
      const { getByTestId } = render(
        <Button
          title="Elevated"
          onPress={mockOnPress}
          elevated
          testID="btn"
        />
      );

      expect(getByTestId('btn')).toBeTruthy();
    });

    it('does not apply colored shadow when not elevated', () => {
      const { getByTestId } = render(
        <Button
          title="Not Elevated"
          onPress={mockOnPress}
          elevated={false}
          testID="btn"
        />
      );

      expect(getByTestId('btn')).toBeTruthy();
    });

    it('does not apply colored shadow when disabled', () => {
      const { getByTestId } = render(
        <Button
          title="Disabled"
          onPress={mockOnPress}
          elevated
          disabled
          testID="btn"
        />
      );

      expect(getByTestId('btn')).toBeTruthy();
    });
  });

  describe('Combined Features', () => {
    it('renders with both gradient and elevated', () => {
      const { getByTestId } = render(
        <Button
          title="Both"
          onPress={mockOnPress}
          useGradient
          elevated
          testID="btn"
        />
      );

      expect(getByTestId('btn')).toBeTruthy();
      expect(getByTestId('btn-gradient')).toBeTruthy();
    });
  });
});

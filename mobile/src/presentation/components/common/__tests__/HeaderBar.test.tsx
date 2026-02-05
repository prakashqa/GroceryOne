/**
 * HeaderBar Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HeaderBar } from '../HeaderBar';

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#2E7D32',
      headerText: '#FFFFFF',
      headerTextMuted: 'rgba(255,255,255,0.8)',
      surfaceOverlay: 'rgba(255,255,255,0.15)',
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
    typography: {
      fontSize: {
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        '2xl': 20,
        xxl: 24,
        xxxl: 32,
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
      xl: 24,
      full: 9999,
    },
    textStyles: {
      h2: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.3,
      },
    },
    letterSpacing: {
      tight: -0.5,
      snug: -0.3,
      normal: 0,
      wide: 0.3,
      wider: 0.5,
    },
  }),
  useIsDarkMode: () => false,
}));

// Mock responsive styles
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: () => ({
    touchTargetMinSize: 48,
    contentPadding: 16,
  }),
}));

// Mock Icon component
jest.mock('../Icon', () => ({
  Icon: ({ name, testID }: { name: string; testID?: string }) => {
    const { Text } = require('react-native');
    return <Text testID={testID}>{name}</Text>;
  },
}));

// Mock Text component
jest.mock('../Text', () => ({
  Text: ({ children, testID, ...props }: any) => {
    const { Text: RNText } = require('react-native');
    return <RNText testID={testID} {...props}>{children}</RNText>;
  },
}));

describe('HeaderBar', () => {
  it('renders title correctly', () => {
    const { getByText } = render(<HeaderBar title="My Screen" />);
    expect(getByText('My Screen')).toBeTruthy();
  });

  it('renders back button when onBack is provided', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(
      <HeaderBar title="Test" onBack={onBack} testID="header" />
    );
    expect(getByTestId('header-back-button')).toBeTruthy();
  });

  it('does not render back button when onBack is not provided', () => {
    const { queryByTestId } = render(
      <HeaderBar title="Test" testID="header" />
    );
    expect(queryByTestId('header-back-button')).toBeNull();
  });

  it('calls onBack when back button is pressed', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(
      <HeaderBar title="Test" onBack={onBack} testID="header" />
    );
    fireEvent.press(getByTestId('header-back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders back button with minimum touch target size', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(
      <HeaderBar title="Test" onBack={onBack} testID="header" />
    );
    const backButton = getByTestId('header-back-button');
    const style = backButton.props.style;
    // The button should have width and height >= 44
    const flatStyle = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
    expect(flatStyle.width).toBeGreaterThanOrEqual(44);
    expect(flatStyle.height).toBeGreaterThanOrEqual(44);
  });

  it('renders search input when searchQuery prop is provided', () => {
    const onSearchChange = jest.fn();
    const { getByTestId } = render(
      <HeaderBar
        title="Test"
        searchQuery=""
        onSearchChange={onSearchChange}
        searchPlaceholder="Search..."
        testID="header"
      />
    );
    expect(getByTestId('header-search-input')).toBeTruthy();
  });

  it('does not render search input when searchQuery is not provided', () => {
    const { queryByTestId } = render(
      <HeaderBar title="Test" testID="header" />
    );
    expect(queryByTestId('header-search-input')).toBeNull();
  });

  it('calls onSearchChange when text input changes', () => {
    const onSearchChange = jest.fn();
    const { getByTestId } = render(
      <HeaderBar
        title="Test"
        searchQuery=""
        onSearchChange={onSearchChange}
        testID="header"
      />
    );
    fireEvent.changeText(getByTestId('header-search-input'), 'hello');
    expect(onSearchChange).toHaveBeenCalledWith('hello');
  });

  it('renders clear button when searchQuery has text', () => {
    const onSearchChange = jest.fn();
    const { getByTestId } = render(
      <HeaderBar
        title="Test"
        searchQuery="some text"
        onSearchChange={onSearchChange}
        testID="header"
      />
    );
    expect(getByTestId('header-search-clear')).toBeTruthy();
  });

  it('clears search when clear button is pressed', () => {
    const onSearchChange = jest.fn();
    const { getByTestId } = render(
      <HeaderBar
        title="Test"
        searchQuery="some text"
        onSearchChange={onSearchChange}
        testID="header"
      />
    );
    fireEvent.press(getByTestId('header-search-clear'));
    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('renders rightAction when provided', () => {
    const { getByTestId } = render(
      <HeaderBar
        title="Test"
        rightAction={
          <></>
        }
        testID="header"
      />
    );
    // The header should render without error
    expect(getByTestId('header')).toBeTruthy();
  });
});

/**
 * PickingHeader Component Tests
 * TDD: Tests written first for header section with greeting, store info, and search bar
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PickingHeader from '../PickingHeader';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      if (key === 'picking.greeting') return `Hello, ${options?.storeName || 'Store'}`;
      if (key === 'picking.searchItems') return 'Search items...';
      if (key === 'picking.scan') return 'Scan';
      return key;
    },
  }),
}));

// Mock the theme hook
jest.mock('../../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4CAF50',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#212121',
      textSecondary: '#757575',
      textLight: '#9e9e9e',
      textInverse: '#ffffff',
      headerBackground: '#1B5E20',
      headerText: '#ffffff',
      headerTextMuted: 'rgba(255, 255, 255, 0.8)',
      buttonPrimary: '#4CAF50',
      buttonPrimaryText: '#ffffff',
      buttonSecondary: 'rgba(255, 255, 255, 0.2)',
      inputBackground: 'rgba(255, 255, 255, 0.15)',
      border: '#e0e0e0',
    },
    spacing: {
      xs: 4,
      sm: 8,
      smd: 12,
      md: 16,
      lg: 24,
    },
    typography: {
      fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        '2xl': 20,
      },
      fontWeight: {
        regular: '400',
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
    },
  }),
  useIsDarkMode: () => false,
}));

// Mock the responsive styles hook
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: () => ({
    contentPadding: 16,
  }),
  useDeviceType: () => ({
    isTablet: false,
    isPhone: true,
  }),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

describe('PickingHeader', () => {
  const mockOnSearchChange = jest.fn();
  const mockOnScanPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders greeting text', () => {
      const { getByText } = render(
        <PickingHeader
          storeName="Krishna Stores"
          currentDate="Thu, 6 Feb"
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          onScanPress={mockOnScanPress}
        />
      );

      expect(getByText('Hello, Krishna Stores')).toBeTruthy();
    });

    it('renders store name in greeting and date separately', () => {
      const { getByText } = render(
        <PickingHeader
          storeName="Krishna Stores"
          currentDate="Thursday, February 6"
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          onScanPress={mockOnScanPress}
        />
      );

      expect(getByText('Hello, Krishna Stores')).toBeTruthy();
      expect(getByText('Thursday, February 6')).toBeTruthy();
    });

    it('renders search input', () => {
      const { getByPlaceholderText } = render(
        <PickingHeader
          storeName="Krishna Stores"
          currentDate="Thu, 6 Feb"
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          onScanPress={mockOnScanPress}
        />
      );

      expect(getByPlaceholderText('Search items...')).toBeTruthy();
    });

    it('renders Scan button', () => {
      const { getByText } = render(
        <PickingHeader
          storeName="Krishna Stores"
          currentDate="Thu, 6 Feb"
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          onScanPress={mockOnScanPress}
        />
      );

      expect(getByText('Scan')).toBeTruthy();
    });

    it('renders with testID when provided', () => {
      const { getByTestId } = render(
        <PickingHeader
          storeName="Krishna Stores"
          currentDate="Thu, 6 Feb"
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          onScanPress={mockOnScanPress}
          testID="picking-header"
        />
      );

      expect(getByTestId('picking-header')).toBeTruthy();
    });
  });

  describe('Search Functionality', () => {
    it('displays search query value', () => {
      const { getByDisplayValue } = render(
        <PickingHeader
          storeName="Krishna Stores"
          currentDate="Thu, 6 Feb"
          searchQuery="rice"
          onSearchChange={mockOnSearchChange}
          onScanPress={mockOnScanPress}
        />
      );

      expect(getByDisplayValue('rice')).toBeTruthy();
    });

    it('calls onSearchChange when text is entered', () => {
      const { getByPlaceholderText } = render(
        <PickingHeader
          storeName="Krishna Stores"
          currentDate="Thu, 6 Feb"
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          onScanPress={mockOnScanPress}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Search items...'), 'dal');
      expect(mockOnSearchChange).toHaveBeenCalledWith('dal');
    });
  });

  describe('Scan Button', () => {
    it('calls onScanPress when Scan button is pressed', () => {
      const { getByTestId } = render(
        <PickingHeader
          storeName="Krishna Stores"
          currentDate="Thu, 6 Feb"
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          onScanPress={mockOnScanPress}
          testID="picking-header"
        />
      );

      fireEvent.press(getByTestId('picking-header-scan-button'));
      expect(mockOnScanPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Layout', () => {
    it('renders greeting and date on the same row', () => {
      const { getByText, getByTestId } = render(
        <PickingHeader
          storeName="Krishna Stores"
          currentDate="Saturday, February 7"
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          onScanPress={mockOnScanPress}
          testID="picking-header"
        />
      );

      // Both greeting and date should be rendered
      expect(getByText('Hello, Krishna Stores')).toBeTruthy();
      expect(getByText('Saturday, February 7')).toBeTruthy();

      // The greeting row container should exist with proper testID
      const greetingRow = getByTestId('picking-header-greeting-row');
      expect(greetingRow).toBeTruthy();

      // Greeting row should have row direction with space-between for right-aligned date
      const rowStyle = Array.isArray(greetingRow.props.style)
        ? Object.assign({}, ...greetingRow.props.style.flat().filter(Boolean))
        : greetingRow.props.style;
      expect(rowStyle.flexDirection).toBe('row');
      expect(rowStyle.justifyContent).toBe('space-between');
    });
  });

  describe('Different Store Names', () => {
    it('renders Telugu store name in greeting', () => {
      const { getByText } = render(
        <PickingHeader
          storeName="ప్రకాష్ గ్రోసరీస్"
          currentDate="గురువారం, ఫిబ్రవరి 6"
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          onScanPress={mockOnScanPress}
        />
      );

      expect(getByText('Hello, ప్రకాష్ గ్రోసరీస్')).toBeTruthy();
    });

    it('renders long store name', () => {
      const { getByText } = render(
        <PickingHeader
          storeName="Very Long Store Name That Might Get Truncated"
          currentDate="Thu, 6 Feb"
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          onScanPress={mockOnScanPress}
        />
      );

      expect(getByText(/Very Long Store Name/)).toBeTruthy();
    });
  });
});

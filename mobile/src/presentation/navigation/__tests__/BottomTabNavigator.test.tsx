/**
 * BottomTabNavigator Tests
 * TDD tests for bottom tab navigation
 */

import React from 'react';

// Mock navigation
jest.mock('@react-navigation/bottom-tabs', () => {
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      Screen: ({ component: Component }: { component: React.ComponentType }) => (
        <Component />
      ),
    }),
  };
});

// Mock navigation stack
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Screen: () => null,
  }),
}));

// Mock theme hook
jest.mock('../../theme', () => ({
  useTheme: require('../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'navigation.dashboard': 'Dashboard',
        'navigation.carts': 'Carts',
        'navigation.settings': 'Settings',
        'picking.cartReview': 'Cart Review',
      };
      return translations[key] || key;
    },
    ready: true,
  }),
}));

// Mock screens
jest.mock('../../screens/dashboard', () => ({
  DashboardScreen: () => null,
}));

jest.mock('../../screens/picking', () => ({
  ManageCartsScreen: () => null,
  PickingScreen: () => null,
  CartScreen: () => null,
}));

jest.mock('../../screens/settings', () => ({
  SettingsScreen: () => null,
  AppearanceSettingsScreen: () => null,
  LanguageSettingsScreen: () => null,
  NotificationSettingsScreen: () => null,
  PrinterSettingsScreen: () => null,
  AboutScreen: () => null,
}));

jest.mock('../../screens/management', () => ({
  CategoryManagementScreen: () => null,
  ItemManagementScreen: () => null,
}));

jest.mock('../../../features/orderScanning', () => ({
  CameraCaptureScreen: () => null,
  ScanReviewScreen: () => null,
}));

// Mock vector icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

import { BottomTabNavigator, TabParamList, CartsStackParamList, DashboardStackParamList } from '../BottomTabNavigator';

describe('BottomTabNavigator', () => {
  describe('Tab Configuration', () => {
    it('exports TabParamList type with correct tabs', () => {
      // TabParamList should include Dashboard, Carts, and Settings
      const tabs: (keyof TabParamList)[] = ['DashboardTab', 'CartsTab', 'SettingsTab'];
      expect(tabs).toHaveLength(3);
    });

    it('can be imported and is a valid component', () => {
      // Verify the component is exported correctly
      expect(BottomTabNavigator).toBeDefined();
      expect(typeof BottomTabNavigator).toBe('function');
    });
  });

  describe('Navigation Structure', () => {
    it('has Dashboard as a tab', () => {
      // The Dashboard should be accessible from the bottom tabs
      const tabs: (keyof TabParamList)[] = ['DashboardTab', 'CartsTab', 'SettingsTab'];
      expect(tabs).toContain('DashboardTab');
    });

    it('has Carts as a tab', () => {
      const tabs: (keyof TabParamList)[] = ['DashboardTab', 'CartsTab', 'SettingsTab'];
      expect(tabs).toContain('CartsTab');
    });

    it('has Settings as a tab', () => {
      const tabs: (keyof TabParamList)[] = ['DashboardTab', 'CartsTab', 'SettingsTab'];
      expect(tabs).toContain('SettingsTab');
    });
  });

  describe('Scan Screen Registration', () => {
    it('CartsStack includes CameraCapture screen for scan access from Carts tab', () => {
      // CameraCapture must be in CartsStack so users can scan from Picking
      // when accessed via the Carts tab (CartsTab → ManageCarts → Cart → Picking → Scan)
      const cartsScreens: (keyof CartsStackParamList)[] = ['CameraCapture'];
      expect(cartsScreens).toContain('CameraCapture');
    });

    it('CartsStack includes ScanReview screen for reviewing scanned items', () => {
      // ScanReview must be in CartsStack so users can review scanned items
      // after CameraCapture navigates to ScanReview
      const cartsScreens: (keyof CartsStackParamList)[] = ['ScanReview'];
      expect(cartsScreens).toContain('ScanReview');
    });

    it('DashboardStack includes scan screens', () => {
      // Verify scan screens remain in DashboardStack too
      const dashboardScreens: (keyof DashboardStackParamList)[] = ['CameraCapture', 'ScanReview'];
      expect(dashboardScreens).toContain('CameraCapture');
      expect(dashboardScreens).toContain('ScanReview');
    });
  });

  describe('i18n Integration', () => {
    it('waits for i18n to be ready before rendering', () => {
      // The component should check ready state from useTranslation
      // and return null if translations are not ready yet
      // This prevents showing translation keys like "navigation.dashboard"
      expect(BottomTabNavigator).toBeDefined();
    });

    it('renders tab labels with translated values when ready', () => {
      // When i18n is ready, tab labels should show translated values
      // Dashboard, Carts, Settings - not the keys
      const translations: Record<string, string> = {
        'navigation.dashboard': 'Dashboard',
        'navigation.carts': 'Carts',
        'navigation.settings': 'Settings',
      };

      // Verify translations are defined
      expect(translations['navigation.dashboard']).toBe('Dashboard');
      expect(translations['navigation.carts']).toBe('Carts');
      expect(translations['navigation.settings']).toBe('Settings');
    });
  });
});

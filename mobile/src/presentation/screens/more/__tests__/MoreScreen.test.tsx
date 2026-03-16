/**
 * MoreScreen Tests
 * TDD tests for the More tab menu screen
 */

import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock theme hook
jest.mock('../../../theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
  useIsDarkMode: require('../../../../__test-utils__/mocks/theme.mock').mockUseIsDarkMode,
}));

// Mock responsive hooks
jest.mock('../../../../hooks', () => ({
  useResponsiveStyles: require('../../../../__test-utils__/mocks/responsive.mock').mockUseResponsiveStyles,
  useDeviceType: () => ({ isTablet: false, isPhone: true }),
}));

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations = {
        'more.title': 'More',
        'more.settings': 'Settings',
        'more.settingsDescription': 'App preferences and configuration',
        'more.inventory': 'Inventory',
        'more.inventoryDescription': 'Stock management and reports',
        'more.sections.store': 'Store',
        'more.sections.management': 'Management',
        'more.sections.settings': 'Settings',
        'more.sections.app': 'App',
        'more.about': 'About GroOne',
        'more.version': 'Version',
        'more.logout': 'Logout',
        'more.logoutConfirm': 'Are you sure you want to logout?',
        'common:cancel': 'Cancel',
      };
      return (translations as Record<string, string>)[key] || (typeof fallback === 'string' ? fallback : key);
    },
    i18n: { language: 'en' },
  }),
}));

// Mock tenant and auth selectors
let mockTenant = { slug: 'freshmart', name: 'FreshMart' };
let mockCurrentUser = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  role: 'admin',
};

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => {
    if (selector.mockName === 'selectTenant') return mockTenant;
    if (selector.mockName === 'selectCurrentUser') return mockCurrentUser;
    return undefined;
  },
  useDispatch: () => jest.fn(),
}));

jest.mock('../../../../store/slices/tenantSlice', () => {
  const fn: any = jest.fn();
  fn.mockName = 'selectTenant';
  return { selectTenant: fn };
});

jest.mock('../../../../store/slices/authSlice', () => {
  const fn: any = jest.fn();
  fn.mockName = 'selectCurrentUser';
  return { selectCurrentUser: fn };
});

// Mock usePinAuth
const mockLogoutSession = jest.fn();
jest.mock('../../../../features/pinAuth/hooks/usePinAuth', () => ({
  usePinAuth: () => ({
    logoutSession: mockLogoutSession,
  }),
}));

// Mock formatUserRole
jest.mock('../../../../utils/formatters/userFormatters', () => ({
  formatUserRole: (role: string) => role.charAt(0).toUpperCase() + role.slice(1),
}));

// Mock SettingsSection and SettingsRow to make testing easier
jest.mock('../../../components/settings', () => ({
  SettingsSection: ({ children, title }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View>
        {title ? <Text>{title}</Text> : null}
        {children}
      </View>
    );
  },
  SettingsRow: ({ label, onPress, hasChevron, testID, value, variant, disabled }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={testID} accessibilityRole="button" disabled={disabled}>
        <Text>{label}</Text>
        {value && <Text>{value}</Text>}
        {hasChevron && <Text>›</Text>}
        {variant === 'danger' && <Text>danger</Text>}
      </TouchableOpacity>
    );
  },
}));

import MoreScreen from '../MoreScreen';

describe('MoreScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTenant = { slug: 'freshmart', name: 'FreshMart' };
    mockCurrentUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      role: 'admin',
    };
  });

  describe('Core Functionality', () => {
    it('renders Settings menu option', () => {
      const { getAllByText } = render(<MoreScreen />);
      // "Settings" appears as both section title and row label
      expect(getAllByText('Settings').length).toBeGreaterThanOrEqual(1);
    });

    it('renders Inventory menu option', () => {
      const { getByText } = render(<MoreScreen />);
      expect(getByText('Inventory')).toBeTruthy();
    });

    it('tapping Settings navigates to Settings screen', () => {
      const { getByTestId } = render(<MoreScreen />);
      fireEvent.press(getByTestId('more-row-settings'));
      expect(mockNavigate).toHaveBeenCalledWith('Settings');
    });

    it('tapping Inventory navigates to InventoryDashboard screen', () => {
      const { getByTestId } = render(<MoreScreen />);
      fireEvent.press(getByTestId('more-row-inventory'));
      expect(mockNavigate).toHaveBeenCalledWith('InventoryDashboard');
    });

    it('both menu items show chevron navigation indicator', () => {
      const { getAllByText } = render(<MoreScreen />);
      const chevrons = getAllByText('›');
      expect(chevrons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Frontend Validations — Store & User Context', () => {
    it('renders tenant name and user info when available', () => {
      const { getByText } = render(<MoreScreen />);
      expect(getByText('FreshMart')).toBeTruthy();
      expect(getByText(/John Doe/)).toBeTruthy();
    });

    it('hides tenant info when tenant is null', () => {
      mockTenant = null as any;
      const { queryByText } = render(<MoreScreen />);
      expect(queryByText('FreshMart')).toBeNull();
    });

    it('renders About menu option', () => {
      const { getByText } = render(<MoreScreen />);
      expect(getByText('About GroOne')).toBeTruthy();
    });

    it('tapping About navigates to About screen', () => {
      const { getByTestId } = render(<MoreScreen />);
      fireEvent.press(getByTestId('more-row-about'));
      expect(mockNavigate).toHaveBeenCalledWith('About');
    });

    it('renders app version', () => {
      const { getByText } = render(<MoreScreen />);
      expect(getByText('1.0.0')).toBeTruthy();
    });

    it('renders logout option with danger styling', () => {
      const { getByTestId, getByText } = render(<MoreScreen />);
      expect(getByTestId('more-row-logout')).toBeTruthy();
      expect(getByText('danger')).toBeTruthy();
    });

    it('tapping Logout shows confirmation alert', () => {
      jest.spyOn(Alert, 'alert');
      const { getByTestId } = render(<MoreScreen />);
      fireEvent.press(getByTestId('more-row-logout'));
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('displays tenant-specific store name from selector', () => {
      mockTenant = { slug: 'quickbasket', name: 'QuickBasket' };
      const { getByText, queryByText } = render(<MoreScreen />);
      expect(getByText('QuickBasket')).toBeTruthy();
      expect(queryByText('FreshMart')).toBeNull();
    });

    it('logout label includes current tenant name', () => {
      const { getByText } = render(<MoreScreen />);
      expect(getByText(/Logout.*FreshMart/)).toBeTruthy();
    });
  });
});

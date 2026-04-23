/**
 * SettingsScreen Tests
 */

import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import SettingsScreen from '../SettingsScreen';

// Mock usePinAuth hook — logout must call logoutSession() for session-only cleanup
const mockLogoutSession = jest.fn(() => Promise.resolve());
const mockResetPin = jest.fn(() => Promise.resolve());
jest.mock('../../../../features/pinAuth/hooks/usePinAuth', () => ({
  usePinAuth: () => ({
    pinState: {
      isPinSet: false,
      isPinVerified: false,
      isLoading: false,
      isLocked: false,
      error: null,
      failedAttempts: 0,
      lockoutUntil: null,
      lastVerifiedAt: null,
    },
    setupPin: jest.fn(),
    verifyPin: jest.fn(),
    resetPin: mockResetPin,
    logoutSession: mockLogoutSession,
    checkPinConfigured: jest.fn(),
    checkLockoutStatus: jest.fn(),
    clearVerification: jest.fn(),
  }),
}));

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

const mockUserState = {
  auth: {
    user: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@quickbasket.com',
      role: 'admin' as const,
      status: 'active' as const,
      preferredLanguage: 'en',
      notificationPreferences: {
        push: true,
        email: true,
        sms: false,
        orderUpdates: true,
        promotions: true,
      },
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    accessToken: 'test-token',
    refreshToken: 'test-refresh',
    isAuthenticated: true,
    isLoading: false,
    error: null,
    requiresPinSetup: false,
  },
  tenant: {
    tenant: {
      id: 'tenant-1',
      name: 'QuickBasket Groceries',
      slug: 'quickbasket',
      status: 'active' as const,
      subscriptionPlan: 'premium' as const,
      branding: {
        primaryColor: '#4CAF50',
        secondaryColor: '#2196F3',
        fontFamily: 'Roboto',
      },
      defaultLanguage: 'en' as const,
      supportedLanguages: ['en' as const],
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    config: null,
    branding: null,
    currentLanguage: 'en' as const,
    isLoading: false,
    error: null,
  },
};

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all settings sections', () => {
    const { getByText } = renderWithProviders(<SettingsScreen />);

    expect(getByText('Preferences')).toBeTruthy();
    expect(getByText('Printing')).toBeTruthy();
    expect(getByText('About')).toBeTruthy();
  });

  it('should render appearance settings row', () => {
    const { getByText } = renderWithProviders(<SettingsScreen />);
    expect(getByText('Appearance')).toBeTruthy();
  });

  it('should render language settings row with current language', () => {
    const { getByText } = renderWithProviders(<SettingsScreen />);
    expect(getByText('Language')).toBeTruthy();
    expect(getByText('English')).toBeTruthy();
  });

  it('should render notifications settings row', () => {
    const { getByText } = renderWithProviders(<SettingsScreen />);
    expect(getByText('Notifications')).toBeTruthy();
  });

  it('should render printer settings row', () => {
    const { getByText } = renderWithProviders(<SettingsScreen />);
    expect(getByText('Printer Settings')).toBeTruthy();
  });

  it('should render about row', () => {
    const { getByText } = renderWithProviders(<SettingsScreen />);
    expect(getByText('About GroOne')).toBeTruthy();
  });

  it('should render app version', () => {
    const { getByText } = renderWithProviders(<SettingsScreen />);
    expect(getByText('Version')).toBeTruthy();
  });

  it('should render logout button', () => {
    const { getByText } = renderWithProviders(<SettingsScreen />);
    expect(getByText('Logout')).toBeTruthy();
  });

  it('should navigate to Appearance screen when tapped', () => {
    const { getByTestId } = renderWithProviders(<SettingsScreen />);

    fireEvent.press(getByTestId('settings-row-appearance'));
    expect(mockNavigate).toHaveBeenCalledWith('AppearanceSettings');
  });

  it('should navigate to Language screen when tapped', () => {
    const { getByTestId } = renderWithProviders(<SettingsScreen />);

    fireEvent.press(getByTestId('settings-row-language'));
    expect(mockNavigate).toHaveBeenCalledWith('LanguageSettings');
  });

  it('should navigate to Notifications screen when tapped', () => {
    const { getByTestId } = renderWithProviders(<SettingsScreen />);

    fireEvent.press(getByTestId('settings-row-notifications'));
    expect(mockNavigate).toHaveBeenCalledWith('NotificationSettings');
  });

  it('should navigate to Printer screen when tapped', () => {
    const { getByTestId } = renderWithProviders(<SettingsScreen />);

    fireEvent.press(getByTestId('settings-row-printer'));
    expect(mockNavigate).toHaveBeenCalledWith('PrinterSettings');
  });

  it('should navigate to About screen when tapped', () => {
    const { getByTestId } = renderWithProviders(<SettingsScreen />);

    fireEvent.press(getByTestId('settings-row-about'));
    expect(mockNavigate).toHaveBeenCalledWith('About');
  });

  describe('account section - user and store info', () => {
    it('should display the store name in the Account section', () => {
      const { getByText } = renderWithProviders(<SettingsScreen />, {
        preloadedState: mockUserState,
      });

      expect(getByText('QuickBasket Groceries')).toBeTruthy();
    });

    it('should display the user name and role in the Account section', () => {
      const { getByText } = renderWithProviders(<SettingsScreen />, {
        preloadedState: mockUserState,
      });

      expect(getByText('John Doe · Admin')).toBeTruthy();
    });

    it('should have testID for store info row', () => {
      const { getByTestId } = renderWithProviders(<SettingsScreen />, {
        preloadedState: mockUserState,
      });

      expect(getByTestId('settings-row-store-info')).toBeTruthy();
    });

    it('should handle missing tenant gracefully', () => {
      const { getByText, queryByTestId } = renderWithProviders(<SettingsScreen />);

      // Logout should still be visible
      expect(getByText('Logout')).toBeTruthy();
      // Store info row should not be present
      expect(queryByTestId('settings-row-store-info')).toBeNull();
    });

    it('should display tenant info with fallback text when currentUser is null but tenant exists', () => {
      const stateWithTenantOnly = {
        ...mockUserState,
        auth: {
          ...mockUserState.auth,
          user: null,
        },
      };

      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        preloadedState: stateWithTenantOnly,
      });

      // Logout should still be visible (with tenant name since tenant exists)
      expect(getByText('Logout \u2013 QuickBasket Groceries')).toBeTruthy();
      // Store info should show with tenant name even without user
      expect(getByTestId('settings-row-store-info')).toBeTruthy();
      // Tenant name should be displayed
      expect(getByText('QuickBasket Groceries')).toBeTruthy();
      // Fallback text should show instead of user info
      expect(getByText('Reconnecting...')).toBeTruthy();
    });
  });

  describe('logout label with tenant name', () => {
    it('should display tenant name in logout label when tenant is available', () => {
      const { getByText } = renderWithProviders(<SettingsScreen />, {
        preloadedState: mockUserState,
      });

      expect(getByText('Logout \u2013 QuickBasket Groceries')).toBeTruthy();
    });

    it('should show plain Logout when tenant is null', () => {
      const { getByText } = renderWithProviders(<SettingsScreen />);
      expect(getByText('Logout')).toBeTruthy();
    });
  });

  describe('logout behavior', () => {
    it('should call logoutSession on logout to preserve PIN and tenant', async () => {
      // Regression test: Logout must call logoutSession (not resetPin) so
      // the user sees the PIN login screen on next launch, not the email
      // entry screen. logoutSession clears session data while preserving
      // PIN hash, tenant slug, and user identifier.
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getByTestId } = renderWithProviders(<SettingsScreen />, {
        preloadedState: mockUserState,
      });

      // Press the logout button
      fireEvent.press(getByTestId('settings-row-logout'));

      // Alert should have been called
      expect(alertSpy).toHaveBeenCalled();

      // Simulate pressing the destructive "Logout" button in the alert
      const alertCall = alertSpy.mock.calls[0];
      const buttons = alertCall[2] as Array<{ text: string; style?: string; onPress?: () => void }>;
      const logoutButton = buttons.find((btn) => btn.style === 'destructive');
      expect(logoutButton).toBeDefined();
      logoutButton!.onPress?.();

      await waitFor(() => {
        expect(mockLogoutSession).toHaveBeenCalledTimes(1);
      });

      // resetPin should NOT be called during logout
      expect(mockResetPin).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('should show confirmation alert before logging out', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getByTestId } = renderWithProviders(<SettingsScreen />);

      fireEvent.press(getByTestId('settings-row-logout'));

      // Alert should be called with title, message, and buttons
      expect(alertSpy).toHaveBeenCalledTimes(1);
      const alertCall = alertSpy.mock.calls[0];
      const buttons = alertCall[2] as Array<{ text: string; style?: string }>;

      // Should have cancel and destructive buttons
      expect(buttons).toHaveLength(2);
      expect(buttons.find((btn) => btn.style === 'cancel')).toBeDefined();
      expect(buttons.find((btn) => btn.style === 'destructive')).toBeDefined();

      alertSpy.mockRestore();
    });

    it('should not call logoutSession when cancel is pressed', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getByTestId } = renderWithProviders(<SettingsScreen />);

      fireEvent.press(getByTestId('settings-row-logout'));

      // Press cancel button (should NOT trigger logoutSession)
      const alertCall = alertSpy.mock.calls[0];
      const buttons = alertCall[2] as Array<{ text: string; style?: string; onPress?: () => void }>;
      const cancelButton = buttons.find((btn) => btn.style === 'cancel');
      cancelButton?.onPress?.();

      expect(mockLogoutSession).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });
  });
});

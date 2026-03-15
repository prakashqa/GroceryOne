/**
 * SignupScreen Tests
 * TDD tests for business registration form behavior
 */
/* eslint-disable @typescript-eslint/no-var-requires */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SignupScreen } from '../SignupScreen';
import { tenantSlice } from '../../../../store/slices/tenantSlice';
import { authSlice } from '../../../../store/slices/authSlice';
import settingsReducer from '../../../../store/slices/settingsSlice';

// Mock theme
jest.mock('../../../../presentation/theme', () => ({
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
    }),
  };
});

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback || key,
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
}));

// Mock i18n config (prevents real i18next initialization)
jest.mock('../../../../i18n/i18n.config', () => ({
  changeLanguage: jest.fn(),
  getCurrentLanguage: () => 'en',
  AVAILABLE_LANGUAGES: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  ],
  default: { language: 'en', changeLanguage: jest.fn() },
}));

// Mock settingsStorage (for AuthScreenControls)
jest.mock('../../../../utils/storage/settingsStorage', () => ({
  saveGlobalThemeMode: jest.fn(),
}));

// Mock PinAuthApi
const mockSignup = jest.fn();
jest.mock('../../services/PinAuthApi', () => ({
  PinAuthApi: {
    signup: (...args: any[]) => mockSignup(...args),
  },
}));

// Mock PinSecureStorage
jest.mock('../../services/PinSecureStorage', () => ({
  PinSecureStorage: {
    storeTenantContext: jest.fn().mockResolvedValue(undefined),
    storeTenantName: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
}));

// Helper to create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      tenant: tenantSlice.reducer,
      auth: authSlice.reducer,
      settings: settingsReducer,
    },
    preloadedState: {
      tenant: {
        tenant: null,
        config: null,
        branding: null,
        currentLanguage: 'en',
        isLoading: false,
        error: null,
      },
      auth: {
        user: null,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      } as any,
      settings: {
        themeMode: 'system' as const,
        language: 'en',
        notifications: {
          enabled: true,
          orderUpdates: true,
          promotions: false,
          reminders: true,
          sound: true,
          vibration: true,
        },
        printer: {
          enabled: false,
          connectionType: 'none' as const,
          selectedPrinterId: null,
          selectedPrinterName: null,
          selectedPrinterAddress: null,
          paperSize: '80mm' as const,
          printFormat: 'receipt' as const,
          connectionStatus: 'disconnected' as const,
          lastConnectedAt: null,
          autoPrint: false,
          imageWidthDots: 576,
        },
        payment: {
          merchantUpiId: '',
          merchantName: '',
        },
        isHydrated: false,
        lastUpdated: null,
      },
    },
  });
};

// Helper to render with providers
const renderSignupScreen = () => {
  const store = createTestStore();
  return {
    ...render(
      <Provider store={store}>
        <SignupScreen />
      </Provider>
    ),
    store,
  };
};

// Helper to fill the form with valid data
const fillValidForm = (getByTestId: any) => {
  fireEvent.changeText(getByTestId('signup-business-name'), 'Test Mart');
  fireEvent.changeText(getByTestId('signup-first-name'), 'Rajesh');
  fireEvent.changeText(getByTestId('signup-last-name'), 'Kumar');
  fireEvent.changeText(getByTestId('signup-email'), 'rajesh@testmart.com');
  fireEvent.changeText(getByTestId('signup-phone'), '+919876543210');
  fireEvent.changeText(getByTestId('signup-password'), 'Password1');
  fireEvent.changeText(getByTestId('signup-confirm-password'), 'Password1');
};

describe('SignupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('button enablement', () => {
    it('should NOT be disabled when form is empty (tappable for validation)', () => {
      const { getByTestId } = renderSignupScreen();
      const button = getByTestId('signup-submit-button');

      // Button should be tappable (not disabled) even when form is empty
      expect(button.props.accessibilityState?.disabled).not.toBe(true);
    });

    it('should show validation errors when tapping button with empty form', async () => {
      const { getByTestId, queryByText } = renderSignupScreen();

      fireEvent.press(getByTestId('signup-submit-button'));

      await waitFor(() => {
        expect(queryByText('Business name is required (min 2 characters)')).toBeTruthy();
        expect(queryByText('First name is required')).toBeTruthy();
        expect(queryByText('Please enter a valid email')).toBeTruthy();
      });
    });

    it('should be disabled only while loading', async () => {
      mockSignup.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { getByTestId } = renderSignupScreen();
      fillValidForm(getByTestId);

      fireEvent.press(getByTestId('signup-submit-button'));

      await waitFor(() => {
        const button = getByTestId('signup-submit-button');
        expect(button.props.accessibilityState?.disabled).toBe(true);
      });
    });
  });

  describe('form validation', () => {
    it('should accept valid phone number format +919876543210', () => {
      const { getByTestId, queryByText } = renderSignupScreen();
      fillValidForm(getByTestId);

      fireEvent.press(getByTestId('signup-submit-button'));

      // Should NOT show phone error for valid format
      expect(queryByText('Please enter a valid phone number (10-15 digits)')).toBeNull();
    });

    it('should show error for password without uppercase and number', async () => {
      const { getByTestId, queryByText } = renderSignupScreen();
      fillValidForm(getByTestId);

      // Override with weak password
      fireEvent.changeText(getByTestId('signup-password'), 'password');
      fireEvent.changeText(getByTestId('signup-confirm-password'), 'password');

      fireEvent.press(getByTestId('signup-submit-button'));

      await waitFor(() => {
        expect(queryByText('Must contain 1 uppercase letter and 1 number')).toBeTruthy();
      });
    });

    it('should show error for password mismatch', async () => {
      const { getByTestId, queryByText } = renderSignupScreen();
      fillValidForm(getByTestId);

      // Override with mismatched passwords
      fireEvent.changeText(getByTestId('signup-confirm-password'), 'DifferentPass1');

      fireEvent.press(getByTestId('signup-submit-button'));

      await waitFor(() => {
        expect(queryByText('Passwords do not match')).toBeTruthy();
      });
    });
  });

  describe('successful signup', () => {
    it('should call PinAuthApi.signup with valid form data', async () => {
      mockSignup.mockResolvedValue({
        success: true,
        data: {
          tenantSlug: 'test-mart',
          user: {
            id: 'user-1',
            email: 'rajesh@testmart.com',
            phone: '+919876543210',
            firstName: 'Rajesh',
            lastName: 'Kumar',
            role: 'admin',
            tenantId: 'tenant-1',
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        },
      });

      const { getByTestId } = renderSignupScreen();
      fillValidForm(getByTestId);

      fireEvent.press(getByTestId('signup-submit-button'));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith({
          businessName: 'Test Mart',
          ownerFirstName: 'Rajesh',
          ownerLastName: 'Kumar',
          email: 'rajesh@testmart.com',
          phone: '+919876543210',
          password: 'Password1',
        });
      });
    });

    it('should navigate to SubscriptionPlan on successful signup', async () => {
      mockSignup.mockResolvedValue({
        success: true,
        data: {
          tenantSlug: 'test-mart',
          user: {
            id: 'user-1',
            email: 'rajesh@testmart.com',
            phone: '+919876543210',
            firstName: 'Rajesh',
            lastName: 'Kumar',
            role: 'admin',
            tenantId: 'tenant-1',
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        },
      });

      const { getByTestId } = renderSignupScreen();
      fillValidForm(getByTestId);

      fireEvent.press(getByTestId('signup-submit-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('SubscriptionPlan');
      });
    });
  });

  describe('error handling', () => {
    it('should show server error on signup failure', async () => {
      mockSignup.mockResolvedValue({
        success: false,
        error: 'Email already exists',
      });

      const { getByTestId, queryByText } = renderSignupScreen();
      fillValidForm(getByTestId);

      fireEvent.press(getByTestId('signup-submit-button'));

      await waitFor(() => {
        expect(queryByText('Email already exists')).toBeTruthy();
      });
    });
  });

  describe('navigation', () => {
    it('should navigate to TenantSetup when login link is pressed', () => {
      const { getByTestId } = renderSignupScreen();

      fireEvent.press(getByTestId('signup-login-link'));

      expect(mockNavigate).toHaveBeenCalledWith('TenantSetup');
    });
  });
});

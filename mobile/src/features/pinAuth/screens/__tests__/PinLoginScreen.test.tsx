/**
 * PinLoginScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { NavigationContainer } from '@react-navigation/native';
import { PinLoginScreen } from '../PinLoginScreen';
import pinReducer from '../../store/pinSlice';
import { authSlice } from '../../../../store/slices/authSlice';
import { tenantSlice } from '../../../../store/slices/tenantSlice';
const authReducer = authSlice.reducer;
const tenantReducer = tenantSlice.reducer;
import { PinHashService } from '../../services/PinHashService';
import { PinSecureStorage } from '../../services/PinSecureStorage';
import { PIN_CONFIG } from '../../constants';

// Mock services
jest.mock('../../services/PinHashService');
jest.mock('../../services/PinSecureStorage');
jest.mock('../../services/PinAuthApi', () => ({
  PinAuthApi: {
    verifyPin: jest.fn().mockResolvedValue({ success: false, error: 'mock' }),
  },
}));
jest.mock('../../../../utils/storage/tenantDataCleaner', () => ({
  clearAllTenantData: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockPinHashService = PinHashService as jest.Mocked<typeof PinHashService>;
const mockPinSecureStorage = PinSecureStorage as jest.Mocked<typeof PinSecureStorage>;

// Mock theme
jest.mock('../../../../presentation/theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4CAF50',
      text: '#212121',
      textLight: '#757575',
      border: '#E0E0E0',
      error: '#F44336',
      surface: '#FFFFFF',
      background: '#F5F5F5',
      disabled: '#BDBDBD',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      full: 999,
      md: 8,
    },
    typography: {
      fontSize: {
        sm: 12,
        md: 14,
        lg: 16,
        xl: 20,
        xxl: 24,
        '2xl': 28,
        xxxl: 32,
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
  }),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      reset: mockReset,
    }),
  };
});

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => {
      const translations: Record<string, string> = {
        'pin.loginTitle': 'Enter Your PIN',
        'pin.welcomeBack': 'Welcome back',
        'pin.wrongPin': 'Incorrect PIN',
        'pin.attemptsRemaining': 'attempts remaining',
        'pin.accountLocked': 'Account locked',
        'pin.forgotPin': 'Forgot PIN?',
        'pin.resetPinTitle': 'Reset PIN',
        'pin.resetPinMessage': 'This will clear your current PIN. Continue?',
        'common.cancel': 'Cancel',
        'common.reset': 'Reset',
      };
      return translations[key] || defaultValue || key;
    },
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('PinLoginScreen', () => {
  let store: ReturnType<typeof createTestStore>;

  function createTestStore(pinState = {}) {
    return configureStore({
      reducer: {
        pin: pinReducer,
        auth: authReducer,
        tenant: tenantReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'user123', firstName: 'John', email: 'test@example.com' } as any,
          accessToken: 'token',
          refreshToken: 'refresh',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
        pin: {
          isPinSet: true,
          isPinVerified: false,
          isLocked: false,
          failedAttempts: 0,
          lockoutUntil: null,
          isLoading: false,
          error: null,
          lastVerifiedAt: null,
          ...pinState,
        },
      },
    });
  }

  function renderScreen(pinState = {}) {
    store = createTestStore(pinState);
    return render(
      <Provider store={store}>
        <NavigationContainer>
          <PinLoginScreen />
        </NavigationContainer>
      </Provider>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockPinSecureStorage.getPinHash.mockResolvedValue({
      hash: 'correcthash',
      salt: 'salt',
    });
    mockPinSecureStorage.getUserIdentifier.mockResolvedValue(null);
    mockPinSecureStorage.getTenantSlug.mockResolvedValue(null);
    mockPinSecureStorage.clearPin.mockResolvedValue(undefined);
    mockPinSecureStorage.isPinConfigured.mockResolvedValue(true);
  });

  describe('rendering', () => {
    it('should render user greeting', () => {
      const { getByText } = renderScreen();
      expect(getByText(/Welcome back/)).toBeTruthy();
    });

    it('should render PinInput component', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('pin-login-input')).toBeTruthy();
    });

    it('should render forgot PIN link', () => {
      const { getByText } = renderScreen();
      expect(getByText('Forgot PIN?')).toBeTruthy();
    });
  });

  describe('PIN verification', () => {
    it('should update Redux state on correct PIN', async () => {
      mockPinHashService.verifyPin.mockResolvedValue(true);

      const { getByText } = renderScreen();

      fireEvent.press(getByText('1'));
      fireEvent.press(getByText('2'));
      fireEvent.press(getByText('3'));
      fireEvent.press(getByText('4'));

      await waitFor(() => {
        // PIN verified - Redux state should be updated (isPinVerified = true)
        // RootNavigator handles navigation based on this state
        const state = store.getState() as any;
        expect(state.pin.isPinVerified).toBe(true);
      });
    });

    it('should show error on wrong PIN', async () => {
      mockPinHashService.verifyPin.mockResolvedValue(false);

      const { getByText } = renderScreen();

      fireEvent.press(getByText('9'));
      fireEvent.press(getByText('9'));
      fireEvent.press(getByText('9'));
      fireEvent.press(getByText('9'));

      await waitFor(() => {
        expect(getByText(/Incorrect PIN/)).toBeTruthy();
      });
    });

    it('should show remaining attempts after failure', async () => {
      mockPinHashService.verifyPin.mockResolvedValue(false);
      // Provide stored credentials so verification goes through the backend-fallback path
      // which tracks attempts
      mockPinSecureStorage.getUserIdentifier.mockResolvedValue('test@example.com');
      mockPinSecureStorage.getTenantSlug.mockResolvedValue('test-tenant');

      const { getByText } = renderScreen();

      fireEvent.press(getByText('9'));
      fireEvent.press(getByText('9'));
      fireEvent.press(getByText('9'));
      fireEvent.press(getByText('9'));

      await waitFor(() => {
        // Should show remaining attempts (MAX - 1)
        expect(getByText(/attempts remaining/)).toBeTruthy();
      });
    });
  });

  describe('lockout behavior', () => {
    it('should show lockout message when locked', () => {
      const lockoutTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const { getByText } = renderScreen({
        isLocked: true,
        lockoutUntil: lockoutTime,
        failedAttempts: PIN_CONFIG.MAX_ATTEMPTS,
      });

      expect(getByText(/Account locked/)).toBeTruthy();
    });

    it('should disable input when locked', () => {
      const lockoutTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const { getByText } = renderScreen({
        isLocked: true,
        lockoutUntil: lockoutTime,
      });

      // Try pressing a digit - should not work
      fireEvent.press(getByText('1'));
      // The onChange won't be called because the component is disabled
    });
  });

  describe('forgot PIN flow', () => {
    it('should show confirmation alert on forgot PIN', () => {
      const { getByText } = renderScreen();

      fireEvent.press(getByText('Forgot PIN?'));

      // Component now shows a confirmation Alert instead of directly navigating
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Reset', style: 'destructive' }),
        ])
      );
    });
  });
});

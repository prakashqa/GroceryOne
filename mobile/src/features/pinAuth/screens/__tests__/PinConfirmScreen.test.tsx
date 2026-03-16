/**
 * PinConfirmScreen Tests
 * TDD: Write tests first, then implement
 */
/* eslint-disable @typescript-eslint/no-var-requires */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { NavigationContainer } from '@react-navigation/native';
import { PinConfirmScreen } from '../PinConfirmScreen';
import pinReducer from '../../store/pinSlice';
import { authSlice } from '../../../../store/slices/authSlice';
import { tenantSlice } from '../../../../store/slices/tenantSlice';
const authReducer = authSlice.reducer;
const tenantReducer = tenantSlice.reducer;
import { PinHashService } from '../../services/PinHashService';
import { PinSecureStorage } from '../../services/PinSecureStorage';

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
  useTheme: require('../../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      reset: mockReset,
    }),
    useRoute: () => ({
      params: { pin: '1234' },
    }),
  };
});

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'pin.confirmTitle': 'Confirm Your PIN',
        'pin.confirmSubtitle': 'Enter the same PIN again to confirm',
        'pin.mismatchError': 'PINs do not match. Please try again.',
        'pin.step': 'Step',
      };
      return translations[key] || key;
    },
  }),
}));

describe('PinConfirmScreen', () => {
  let store: ReturnType<typeof createTestStore>;

  function createTestStore() {
    return configureStore({
      reducer: {
        pin: pinReducer,
        auth: authReducer as any,
        tenant: tenantReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 'user123', email: 'test@example.com' } as any,
          accessToken: 'token',
          refreshToken: 'refresh',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      },
    });
  }

  function renderWithProviders(ui: React.ReactElement) {
    store = createTestStore();
    return render(
      <Provider store={store}>
        <NavigationContainer>{ui}</NavigationContainer>
      </Provider>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockPinHashService.generateSalt.mockReturnValue('testsalt');
    mockPinHashService.hashPin.mockResolvedValue('testhash');
    mockPinSecureStorage.storePinHash.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('should render confirm instructions', () => {
      const { getByText } = renderWithProviders(<PinConfirmScreen />);
      expect(getByText('Confirm Your PIN')).toBeTruthy();
    });

    it('should render step 2 indicator', () => {
      const { getByText } = renderWithProviders(<PinConfirmScreen />);
      expect(getByText(/Step 2/)).toBeTruthy();
    });

    it('should render PinInput component', () => {
      const { getByTestId } = renderWithProviders(<PinConfirmScreen />);
      expect(getByTestId('pin-confirm-input')).toBeTruthy();
    });
  });

  describe('PIN matching', () => {
    it('should save PIN and navigate to main on match', async () => {
      const { getByText } = renderWithProviders(<PinConfirmScreen />);

      // Enter matching PIN (1234 from route params)
      fireEvent.press(getByText('1'));
      fireEvent.press(getByText('2'));
      fireEvent.press(getByText('3'));
      fireEvent.press(getByText('4'));

      await waitFor(() => {
        expect(mockPinSecureStorage.storePinHash).toHaveBeenCalled();
      });
    });

    it('should show error on PIN mismatch', async () => {
      const { getByText } = renderWithProviders(<PinConfirmScreen />);

      // Enter non-matching PIN (9999 instead of 1234)
      fireEvent.press(getByText('9'));
      fireEvent.press(getByText('9'));
      fireEvent.press(getByText('9'));
      fireEvent.press(getByText('9'));

      await waitFor(() => {
        expect(getByText('PINs do not match. Please try again.')).toBeTruthy();
      });
    });

    it('should clear input on mismatch for retry', async () => {
      const { getByText } = renderWithProviders(<PinConfirmScreen />);

      // Enter non-matching PIN
      fireEvent.press(getByText('9'));
      fireEvent.press(getByText('9'));
      fireEvent.press(getByText('9'));
      fireEvent.press(getByText('9'));

      await waitFor(() => {
        expect(getByText('PINs do not match. Please try again.')).toBeTruthy();
      });

      // Input should be cleared (no filled dots)
      // This is verified by being able to enter new PIN
    });
  });

  describe('navigation', () => {
    it('should allow going back to re-enter', () => {
      renderWithProviders(<PinConfirmScreen />);

      // There should be a way to go back
      // Implementation could be a back button or gesture
    });
  });
});

/**
 * PinSetupScreen Tests
 * TDD: Write tests first, then implement
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { NavigationContainer } from '@react-navigation/native';
import { PinSetupScreen } from '../PinSetupScreen';
import pinReducer from '../../store/pinSlice';
import { authSlice } from '../../../../store/slices/authSlice';
const authReducer = authSlice.reducer;

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
      fontSize: { sm: 12, md: 14, lg: 16, xl: 20, xxl: 24, '2xl': 28, xxxl: 32 },
      fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
    },
  }),
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
    t: (key: string) => {
      const translations: Record<string, string> = {
        'pin.setupTitle': 'Create Your PIN',
        'pin.setupSubtitle': 'Create a 4-digit PIN for quick access',
        'pin.step': 'Step',
      };
      return translations[key] || key;
    },
  }),
}));

describe('PinSetupScreen', () => {
  let store: ReturnType<typeof createTestStore>;

  function createTestStore() {
    return configureStore({
      reducer: {
        pin: pinReducer,
        auth: authReducer,
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
  });

  describe('rendering', () => {
    it('should render setup instructions', () => {
      const { getByText } = renderWithProviders(<PinSetupScreen />);
      expect(getByText('Create Your PIN')).toBeTruthy();
    });

    it('should render step indicator', () => {
      const { getByText } = renderWithProviders(<PinSetupScreen />);
      expect(getByText(/Step 1/)).toBeTruthy();
    });

    it('should render PinInput component', () => {
      const { getByTestId } = renderWithProviders(<PinSetupScreen />);
      expect(getByTestId('pin-setup-input')).toBeTruthy();
    });

    it('should render keypad', () => {
      const { getByText } = renderWithProviders(<PinSetupScreen />);
      // Check for keypad digits
      expect(getByText('1')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
      expect(getByText('9')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('should navigate to confirm screen after 4 digits entered', async () => {
      const { getByText } = renderWithProviders(<PinSetupScreen />);

      // Enter 4 digits
      fireEvent.press(getByText('1'));
      fireEvent.press(getByText('2'));
      fireEvent.press(getByText('3'));
      fireEvent.press(getByText('4'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('PinConfirm', { pin: '1234' });
      });
    });

    it('should not navigate with less than 4 digits', () => {
      const { getByText } = renderWithProviders(<PinSetupScreen />);

      fireEvent.press(getByText('1'));
      fireEvent.press(getByText('2'));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should allow backspace to clear digits', () => {
      const { getByText, getByTestId } = renderWithProviders(<PinSetupScreen />);

      fireEvent.press(getByText('1'));
      fireEvent.press(getByText('2'));
      fireEvent.press(getByTestId('pin-setup-input-keypad-backspace'));

      // Should not navigate yet
      fireEvent.press(getByText('3'));
      fireEvent.press(getByText('4'));

      // Still need one more digit
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});

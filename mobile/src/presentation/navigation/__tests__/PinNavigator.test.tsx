/**
 * PinNavigator Tests
 * TDD tests for authentication navigation — Signup ↔ TenantSetup navigation
 *
 * Bug: "Already have an account? Log in" on SignupScreen navigates to 'TenantSetup',
 * but TenantSetup is conditionally registered and may not exist in the navigator.
 * Fix: Always register TenantSetup in setup mode, use initialRouteName instead.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Track which screens are registered by the navigator
const registeredScreens: string[] = [];

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Screen: ({ name }: { name: string }) => {
      registeredScreens.push(name);
      return null;
    },
  }),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNavigation: () => ({ navigate: jest.fn() }),
}));

// Mock BottomTabNavigator to avoid transitive expo-file-system dependency
jest.mock('../BottomTabNavigator', () => ({
  BottomTabNavigator: () => null,
}));

// Mock subscription expired screen
jest.mock('../../screens/subscription/SubscriptionExpiredScreen', () => ({
  SubscriptionExpiredScreen: () => null,
}));

// Mock all screen components
jest.mock('../../../features/pinAuth', () => ({
  TenantSetupScreen: () => null,
  PinSetupScreen: () => null,
  PinConfirmScreen: () => null,
  PinLoginScreen: () => null,
}));

jest.mock('../../../features/pinAuth/screens/SignupScreen', () => ({
  SignupScreen: () => null,
}));

jest.mock('../../../features/pinAuth/screens/SubscriptionPlanScreen', () => ({
  SubscriptionPlanScreen: () => null,
}));

// Mock services/storage used by RootNavigator
jest.mock('../../../features/pinAuth/services/PinSecureStorage', () => ({
  PinSecureStorage: {
    isPinConfigured: jest.fn().mockResolvedValue(false),
    getUserId: jest.fn().mockResolvedValue(null),
    getTenantName: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../utils/storage/migrateTenantData', () => ({
  migrateGlobalToTenantScoped: jest.fn().mockResolvedValue(undefined),
}));

// Mock Redux hooks
jest.mock('../../../core/hooks/useAppDispatch', () => ({
  useAppSelector: jest.fn().mockReturnValue(false),
  useAppDispatch: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock('../../../features/pinAuth/store/pinSlice', () => ({
  selectIsPinSet: jest.fn(),
  selectIsPinVerified: jest.fn(),
  setPinConfigured: jest.fn(),
}));

jest.mock('../../../store/slices/tenantSlice', () => ({
  setTenant: jest.fn(),
}));

jest.mock('../../../store/slices/subscriptionSlice', () => ({
  selectIsSubscriptionExpired: jest.fn(),
}));

jest.mock('../../theme', () => ({
  useTheme: () => ({
    colors: { background: '#fff', primary: '#4CAF50' },
  }),
}));

import { PinNavigator } from '../RootNavigator';

describe('PinNavigator — Screen Registration', () => {
  beforeEach(() => {
    registeredScreens.length = 0;
  });

  describe('setup mode (isSetupMode=true)', () => {
    it('should always register TenantSetup screen even when needsTenantSetup is false', () => {
      // This is the key bug scenario: user has tenant context stored from
      // a previous session, so needsTenantSetup=false. But we still need
      // TenantSetup registered so Signup's "Log in" link can navigate to it.
      render(<PinNavigator isSetupMode={true} needsTenantSetup={false} />);

      expect(registeredScreens).toContain('TenantSetup');
      expect(registeredScreens).toContain('Signup');
    });

    it('should register TenantSetup screen when needsTenantSetup is true', () => {
      render(<PinNavigator isSetupMode={true} needsTenantSetup={true} />);

      expect(registeredScreens).toContain('TenantSetup');
      expect(registeredScreens).toContain('Signup');
    });

    it('should register all setup flow screens', () => {
      render(<PinNavigator isSetupMode={true} needsTenantSetup={true} />);

      expect(registeredScreens).toContain('TenantSetup');
      expect(registeredScreens).toContain('Signup');
      expect(registeredScreens).toContain('SubscriptionPlan');
      expect(registeredScreens).toContain('PinSetup');
      expect(registeredScreens).toContain('PinConfirm');
    });
  });

  describe('login mode (isSetupMode=false)', () => {
    it('should register PinLogin screen and not setup screens', () => {
      render(<PinNavigator isSetupMode={false} needsTenantSetup={false} />);

      expect(registeredScreens).toContain('PinLogin');
      expect(registeredScreens).not.toContain('TenantSetup');
      expect(registeredScreens).not.toContain('Signup');
    });
  });
});

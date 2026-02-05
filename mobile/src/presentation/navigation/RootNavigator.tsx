/**
 * Root Navigator
 * Handles main navigation structure for Picking List App
 * Includes PIN-based authentication flow
 * Uses dynamic tenant resolution instead of hard-coded tenant user
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSelector, useAppDispatch } from '../../core/hooks/useAppDispatch';
import {
  selectIsPinSet,
  selectIsPinVerified,
  setPinConfigured,
} from '../../features/pinAuth/store/pinSlice';
import { PinSecureStorage } from '../../features/pinAuth/services/PinSecureStorage';
import { setTenant } from '../../store/slices/tenantSlice';
import { migrateGlobalToTenantScoped } from '../../utils/storage/migrateTenantData';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import {
  TenantSetupScreen,
  PinSetupScreen,
  PinConfirmScreen,
  PinLoginScreen,
} from '../../features/pinAuth';
import { BottomTabNavigator } from './BottomTabNavigator';
import { useTheme } from '../theme';

// Storage key for tenant (same as TenantProvider)
const TENANT_ID_KEY = '@tenant_id';

// Loading screen while checking PIN status - theme-aware
const LoadingScreen = () => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.loadingContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Stack navigator types
export type RootStackParamList = {
  Loading: undefined;
  PinAuth: undefined;
  Main: undefined;
};

export type PinStackParamList = {
  TenantSetup: undefined;
  PinSetup: undefined;
  PinConfirm: { pin: string };
  PinLogin: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const PinStack = createNativeStackNavigator<PinStackParamList>();

// Re-export types from BottomTabNavigator for backward compatibility
export type {
  TabParamList,
  DashboardStackParamList,
  CartsStackParamList,
  SettingsStackParamList,
} from './BottomTabNavigator';

// Legacy MainStackParamList type for backward compatibility
export type MainStackParamList = {
  Dashboard: undefined;
  Picking: undefined;
  Cart: undefined;
  ManageCarts: undefined;
  Settings: undefined;
  AppearanceSettings: undefined;
  LanguageSettings: undefined;
  NotificationSettings: undefined;
  PrinterSettings: undefined;
  About: undefined;
  CategoryManagement: undefined;
  ItemManagement: { categoryId?: string } | undefined;
  CameraCapture: undefined;
  ScanReview: undefined;
};

/**
 * PIN Navigator - Tenant setup, PIN setup, and PIN login
 */
function PinNavigator({ isSetupMode, needsTenantSetup }: { isSetupMode: boolean; needsTenantSetup: boolean }) {
  return (
    <PinStack.Navigator screenOptions={{ headerShown: false }}>
      {isSetupMode ? (
        // PIN setup flow (with optional tenant setup first)
        <>
          {needsTenantSetup && (
            <PinStack.Screen name="TenantSetup" component={TenantSetupScreen} />
          )}
          <PinStack.Screen name="PinSetup" component={PinSetupScreen} />
          <PinStack.Screen name="PinConfirm" component={PinConfirmScreen} />
        </>
      ) : (
        // PIN login flow
        <PinStack.Screen name="PinLogin" component={PinLoginScreen} />
      )}
    </PinStack.Navigator>
  );
}


/**
 * Root Navigator
 * PIN-first authentication - no credential login required
 * Flow: Check PIN → Setup if new, Login if exists → Main app
 * Tenant context is loaded from stored slug; full credentials come from PIN verification
 */
export function RootNavigator() {
  const dispatch = useAppDispatch();
  const isPinSet = useAppSelector(selectIsPinSet);
  const isPinVerified = useAppSelector(selectIsPinVerified);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasTenantContext, setHasTenantContext] = useState(false);

  // Initialize: Load stored tenant context and check PIN status
  useEffect(() => {
    const initialize = async () => {
      // Load stored tenant slug for returning users (set minimal tenant context)
      const storedTenantSlug = await AsyncStorage.getItem(TENANT_ID_KEY);

      // Run one-time migration from global to tenant-scoped storage keys
      if (storedTenantSlug) {
        await migrateGlobalToTenantScoped(storedTenantSlug);
      }

      if (storedTenantSlug) {
        setHasTenantContext(true);
        dispatch(setTenant({
          id: '',
          name: storedTenantSlug,
          slug: storedTenantSlug,
          status: 'active',
          subscriptionPlan: 'premium',
          branding: {
            primaryColor: '#4CAF50',
            secondaryColor: '#2196F3',
            fontFamily: 'Roboto',
          },
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'te'],
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }

      // Check if PIN is already configured using stored user ID
      const storedUserId = await PinSecureStorage.getUserId();
      if (storedUserId) {
        const isConfigured = await PinSecureStorage.isPinConfigured(storedUserId);
        dispatch(setPinConfigured(isConfigured));
      } else {
        // No PIN ever configured - show setup
        dispatch(setPinConfigured(false));
      }

      setIsInitializing(false);
    };

    initialize();
  }, [dispatch]);

  /**
   * Navigation flow (PIN-first with tenant resolution):
   * 1. Initializing → Loading screen
   * 2. No PIN configured + no tenant → TenantSetup → PinSetup flow
   * 3. No PIN configured + has tenant → PinSetup flow
   * 4. PIN configured + not verified → PIN Login
   * 5. PIN verified → Main app
   */
  const getActiveNavigator = () => {
    if (isInitializing) {
      return 'Loading';
    }

    if (!isPinSet) {
      return 'PinSetup';
    }

    if (!isPinVerified) {
      return 'PinLogin';
    }

    return 'Main';
  };

  const activeNavigator = getActiveNavigator();

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {activeNavigator === 'Loading' && (
          <RootStack.Screen name="Loading" component={LoadingScreen} />
        )}
        {activeNavigator === 'PinSetup' && (
          <RootStack.Screen name="PinAuth">
            {() => <PinNavigator isSetupMode={true} needsTenantSetup={!hasTenantContext} />}
          </RootStack.Screen>
        )}
        {activeNavigator === 'PinLogin' && (
          <RootStack.Screen name="PinAuth">
            {() => <PinNavigator isSetupMode={false} needsTenantSetup={false} />}
          </RootStack.Screen>
        )}
        {activeNavigator === 'Main' && (
          <RootStack.Screen name="Main" component={BottomTabNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator;

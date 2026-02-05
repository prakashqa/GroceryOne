/**
 * BottomTabNavigator
 * Bottom tab navigation for main app screens
 */

import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { useResponsiveStyles } from '../../hooks';

// Screen imports
import { DashboardScreen } from '../screens/dashboard';
import { PickingScreen, CartScreen, ManageCartsScreen } from '../screens/picking';
import {
  SettingsScreen,
  AppearanceSettingsScreen,
  LanguageSettingsScreen,
  NotificationSettingsScreen,
  PrinterSettingsScreen,
  PaymentSettingsScreen,
  AboutScreen,
} from '../screens/settings';
import {
  CategoryManagementScreen,
  ItemManagementScreen,
} from '../screens/management';
import {
  CameraCaptureScreen,
  ScanReviewScreen,
} from '../../features/orderScanning';
import { ReportsScreen } from '../../features/reports';

// Tab param list - tabs available in bottom navigation
export type TabParamList = {
  DashboardTab: undefined;
  CartsTab: undefined;
  ReportsTab: undefined;
  SettingsTab: undefined;
};

// Stack param lists for each tab
export type DashboardStackParamList = {
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
  Reports: undefined;
};

export type CartsStackParamList = {
  ManageCarts: undefined;
  Cart: undefined;
  Picking: undefined;
  Settings: undefined;
  AppearanceSettings: undefined;
  LanguageSettings: undefined;
  NotificationSettings: undefined;
  PrinterSettings: undefined;
  About: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
  AppearanceSettings: undefined;
  LanguageSettings: undefined;
  NotificationSettings: undefined;
  PrinterSettings: undefined;
  PaymentSettings: undefined;
  About: undefined;
  CategoryManagement: undefined;
  ItemManagement: { categoryId?: string } | undefined;
};

export type ReportsStackParamList = {
  Reports: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const CartsStack = createNativeStackNavigator<CartsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const ReportsStack = createNativeStackNavigator<ReportsStackParamList>();

/**
 * Dashboard Stack Navigator
 */
function DashboardStackNavigator() {
  const theme = useTheme();
  const { t } = useTranslation('common');

  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: theme.colors.text,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <DashboardStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen
        name="Picking"
        component={PickingScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: t('picking.cartReview'),
        }}
      />
      <DashboardStack.Screen
        name="ManageCarts"
        component={ManageCartsScreen}
        options={{
          headerShown: false,
        }}
      />
      <DashboardStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
      <DashboardStack.Screen
        name="AppearanceSettings"
        component={AppearanceSettingsScreen}
        options={{
          title: 'Appearance',
        }}
      />
      <DashboardStack.Screen
        name="LanguageSettings"
        component={LanguageSettingsScreen}
        options={{
          title: 'Language',
        }}
      />
      <DashboardStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: 'Notifications',
        }}
      />
      <DashboardStack.Screen
        name="PrinterSettings"
        component={PrinterSettingsScreen}
        options={{
          title: 'Printer Settings',
        }}
      />
      <DashboardStack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'About',
        }}
      />
      <DashboardStack.Screen
        name="CategoryManagement"
        component={CategoryManagementScreen}
        options={{
          headerShown: false,
        }}
      />
      <DashboardStack.Screen
        name="ItemManagement"
        component={ItemManagementScreen}
        options={{
          headerShown: false,
        }}
      />
      <DashboardStack.Screen
        name="CameraCapture"
        component={CameraCaptureScreen}
        options={{
          headerShown: false,
        }}
      />
      <DashboardStack.Screen
        name="ScanReview"
        component={ScanReviewScreen}
        options={{
          headerShown: false,
        }}
      />
      <DashboardStack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          headerShown: false,
        }}
      />
    </DashboardStack.Navigator>
  );
}

/**
 * Carts Stack Navigator
 */
function CartsStackNavigator() {
  const theme = useTheme();
  const { t } = useTranslation('common');

  return (
    <CartsStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: theme.colors.text,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <CartsStack.Screen
        name="ManageCarts"
        component={ManageCartsScreen}
        options={{
          headerShown: false,
        }}
      />
      <CartsStack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: t('picking.cartReview'),
        }}
      />
      <CartsStack.Screen
        name="Picking"
        component={PickingScreen}
        options={{ headerShown: false }}
      />
      <CartsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
      <CartsStack.Screen
        name="AppearanceSettings"
        component={AppearanceSettingsScreen}
        options={{
          title: 'Appearance',
        }}
      />
      <CartsStack.Screen
        name="LanguageSettings"
        component={LanguageSettingsScreen}
        options={{
          title: 'Language',
        }}
      />
      <CartsStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: 'Notifications',
        }}
      />
      <CartsStack.Screen
        name="PrinterSettings"
        component={PrinterSettingsScreen}
        options={{
          title: 'Printer Settings',
        }}
      />
      <CartsStack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'About',
        }}
      />
    </CartsStack.Navigator>
  );
}

/**
 * Settings Stack Navigator
 */
function SettingsStackNavigator() {
  const theme = useTheme();

  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: theme.colors.text,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
      <SettingsStack.Screen
        name="AppearanceSettings"
        component={AppearanceSettingsScreen}
        options={{
          title: 'Appearance',
        }}
      />
      <SettingsStack.Screen
        name="LanguageSettings"
        component={LanguageSettingsScreen}
        options={{
          title: 'Language',
        }}
      />
      <SettingsStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: 'Notifications',
        }}
      />
      <SettingsStack.Screen
        name="PrinterSettings"
        component={PrinterSettingsScreen}
        options={{
          title: 'Printer Settings',
        }}
      />
      <SettingsStack.Screen
        name="PaymentSettings"
        component={PaymentSettingsScreen}
        options={{
          title: 'Payment Settings',
        }}
      />
      <SettingsStack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'About',
        }}
      />
      <SettingsStack.Screen
        name="CategoryManagement"
        component={CategoryManagementScreen}
        options={{
          headerShown: false,
        }}
      />
      <SettingsStack.Screen
        name="ItemManagement"
        component={ItemManagementScreen}
        options={{
          headerShown: false,
        }}
      />
    </SettingsStack.Navigator>
  );
}

/**
 * Reports Stack Navigator
 */
function ReportsStackNavigator() {
  const theme = useTheme();

  return (
    <ReportsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <ReportsStack.Screen
        name="Reports"
        component={ReportsScreen}
      />
    </ReportsStack.Navigator>
  );
}

/**
 * Tab bar icon component
 */
interface TabBarIconProps {
  name: string;
  color: string;
  size: number;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ name, color, size }) => (
  <Icon name={name} size={size} color={color} />
);

/**
 * Bottom Tab Navigator
 */
export function BottomTabNavigator() {
  const theme = useTheme();
  const { t, ready } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();

  // Wait for i18n to be ready before rendering to avoid showing translation keys
  if (!ready) {
    return null;
  }

  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: responsiveStyles.contentPadding > 20 ? 8 : 4,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: responsiveStyles.tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: responsiveStyles.tabBarLabelSize,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: responsiveStyles.contentPadding > 20 ? 4 : 0,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: t('navigation.dashboard', 'Dashboard'),
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="dashboard" color={color} size={responsiveStyles.tabBarIconSize} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('DashboardTab', { screen: 'Dashboard' });
          },
        })}
      />
      <Tab.Screen
        name="CartsTab"
        component={CartsStackNavigator}
        options={{
          tabBarLabel: t('navigation.carts', 'Carts'),
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="shopping-cart" color={color} size={responsiveStyles.tabBarIconSize} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('CartsTab', { screen: 'ManageCarts' });
          },
        })}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsStackNavigator}
        options={{
          tabBarLabel: t('navigation.reports', 'Reports'),
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="bar-chart" color={color} size={responsiveStyles.tabBarIconSize} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('ReportsTab', { screen: 'Reports' });
          },
        })}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: t('navigation.settings', 'Settings'),
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="settings" color={color} size={responsiveStyles.tabBarIconSize} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('SettingsTab', { screen: 'Settings' });
          },
        })}
      />
    </Tab.Navigator>
  );
}

export default BottomTabNavigator;

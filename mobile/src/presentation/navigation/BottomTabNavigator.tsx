/**
 * BottomTabNavigator
 * Bottom tab navigation for main app screens
 */

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { useResponsiveStyles } from '../../hooks';

// Screen imports
import { DashboardScreen } from '../screens/dashboard';
import { PickingScreen, OrderScreen, ManageOrdersScreen } from '../screens/picking';
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
import { ItemsScreen } from '../screens/items';
import { MoreScreen } from '../screens/more';
import { InventoryDashboardScreen, InventoryItemDetailScreen } from '../screens/inventory';

// Tab param list - tabs available in bottom navigation
export type TabParamList = {
  DashboardTab: undefined;
  ItemsTab: undefined;
  OrdersTab: undefined;
  ReportsTab: undefined;
  MoreTab: undefined;
};

// Stack param lists for each tab
export type DashboardStackParamList = {
  Dashboard: undefined;
  Picking: undefined;
  Order: undefined;
  ManageOrders: undefined;
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

export type OrdersStackParamList = {
  ManageOrders: undefined;
  Order: undefined;
  Picking: undefined;
  CameraCapture: undefined;
  ScanReview: undefined;
  Settings: undefined;
  AppearanceSettings: undefined;
  LanguageSettings: undefined;
  NotificationSettings: undefined;
  PrinterSettings: undefined;
  About: undefined;
};

export type MoreStackParamList = {
  More: undefined;
  Settings: undefined;
  InventoryDashboard: undefined;
  InventoryItemDetail: { itemId: string };
  AppearanceSettings: undefined;
  LanguageSettings: undefined;
  NotificationSettings: undefined;
  PrinterSettings: undefined;
  PaymentSettings: undefined;
  About: undefined;
  CategoryManagement: undefined;
  ItemManagement: { categoryId?: string } | undefined;
};

export type ItemsStackParamList = {
  Items: undefined;
  Order: undefined;
  PrinterSettings: undefined;
};

export type ReportsStackParamList = {
  Reports: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const ItemsStack = createNativeStackNavigator<ItemsStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();
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
        name="Order"
        component={OrderScreen}
        options={{
          title: t('picking.cartReview'),
        }}
      />
      <DashboardStack.Screen
        name="ManageOrders"
        component={ManageOrdersScreen}
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
 * Items Stack Navigator
 */
function ItemsStackNavigator() {
  const theme = useTheme();
  const { t } = useTranslation('common');

  return (
    <ItemsStack.Navigator
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
      <ItemsStack.Screen
        name="Items"
        component={ItemsScreen}
        options={{ headerShown: false }}
      />
      <ItemsStack.Screen
        name="Order"
        component={OrderScreen}
        options={{
          title: t('picking.cartReview'),
        }}
      />
      <ItemsStack.Screen
        name="PrinterSettings"
        component={PrinterSettingsScreen}
        options={{
          title: 'Printer Settings',
        }}
      />
    </ItemsStack.Navigator>
  );
}

/**
 * Orders Stack Navigator
 */
function OrdersStackNavigator() {
  const theme = useTheme();
  const { t } = useTranslation('common');

  return (
    <OrdersStack.Navigator
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
      <OrdersStack.Screen
        name="ManageOrders"
        component={ManageOrdersScreen}
        options={{
          headerShown: false,
        }}
      />
      <OrdersStack.Screen
        name="Order"
        component={OrderScreen}
        options={{
          title: t('picking.cartReview'),
        }}
      />
      <OrdersStack.Screen
        name="Picking"
        component={PickingScreen}
        options={{ headerShown: false }}
      />
      <OrdersStack.Screen
        name="CameraCapture"
        component={CameraCaptureScreen}
        options={{ headerShown: false }}
      />
      <OrdersStack.Screen
        name="ScanReview"
        component={ScanReviewScreen}
        options={{ headerShown: false }}
      />
      <OrdersStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
      <OrdersStack.Screen
        name="AppearanceSettings"
        component={AppearanceSettingsScreen}
        options={{
          title: 'Appearance',
        }}
      />
      <OrdersStack.Screen
        name="LanguageSettings"
        component={LanguageSettingsScreen}
        options={{
          title: 'Language',
        }}
      />
      <OrdersStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: 'Notifications',
        }}
      />
      <OrdersStack.Screen
        name="PrinterSettings"
        component={PrinterSettingsScreen}
        options={{
          title: 'Printer Settings',
        }}
      />
      <OrdersStack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'About',
        }}
      />
    </OrdersStack.Navigator>
  );
}

/**
 * More Stack Navigator
 */
function MoreStackNavigator() {
  const theme = useTheme();

  return (
    <MoreStack.Navigator
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
      <MoreStack.Screen
        name="More"
        component={MoreScreen}
        options={{
          headerShown: false,
        }}
      />
      <MoreStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
      <MoreStack.Screen
        name="InventoryDashboard"
        component={InventoryDashboardScreen}
        options={{
          headerShown: false,
        }}
      />
      <MoreStack.Screen
        name="InventoryItemDetail"
        component={InventoryItemDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <MoreStack.Screen
        name="AppearanceSettings"
        component={AppearanceSettingsScreen}
        options={{
          title: 'Appearance',
        }}
      />
      <MoreStack.Screen
        name="LanguageSettings"
        component={LanguageSettingsScreen}
        options={{
          title: 'Language',
        }}
      />
      <MoreStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: 'Notifications',
        }}
      />
      <MoreStack.Screen
        name="PrinterSettings"
        component={PrinterSettingsScreen}
        options={{
          title: 'Printer Settings',
        }}
      />
      <MoreStack.Screen
        name="PaymentSettings"
        component={PaymentSettingsScreen}
        options={{
          title: 'Payment Settings',
        }}
      />
      <MoreStack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'About',
        }}
      />
      <MoreStack.Screen
        name="CategoryManagement"
        component={CategoryManagementScreen}
        options={{
          headerShown: false,
        }}
      />
      <MoreStack.Screen
        name="ItemManagement"
        component={ItemManagementScreen}
        options={{
          headerShown: false,
        }}
      />
    </MoreStack.Navigator>
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
          borderTopWidth: 0,
          paddingTop: responsiveStyles.contentPadding > 20 ? 8 : 4,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 72 : responsiveStyles.tabBarHeight,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
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
            navigation.navigate('DashboardTab' as any, { screen: 'Dashboard' });
          },
        })}
      />
      <Tab.Screen
        name="ItemsTab"
        component={ItemsStackNavigator}
        options={{
          tabBarLabel: t('navigation.items', 'Items'),
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="list-alt" color={color} size={responsiveStyles.tabBarIconSize} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('ItemsTab' as any, { screen: 'Items' });
          },
        })}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{
          tabBarLabel: t('navigation.carts', 'Orders'),
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="receipt-long" color={color} size={responsiveStyles.tabBarIconSize} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('OrdersTab' as any, { screen: 'ManageOrders' });
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
            navigation.navigate('ReportsTab' as any, { screen: 'Reports' });
          },
        })}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStackNavigator}
        options={{
          tabBarLabel: t('navigation.more', 'More'),
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="more-horiz" color={color} size={responsiveStyles.tabBarIconSize} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('MoreTab' as any, { screen: 'More' });
          },
        })}
      />
    </Tab.Navigator>
  );
}

export default BottomTabNavigator;

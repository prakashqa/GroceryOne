/**
 * Settings Screen
 * Main settings screen with navigation to sub-screens
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';
import {
  SettingsSection,
  SettingsRow,
} from '../../components/settings';
import { selectLanguage } from '../../../store/slices/settingsSlice';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { selectTenant } from '../../../store/slices/tenantSlice';
import { formatUserRole } from '../../../utils/formatters/userFormatters';
import { usePinAuth } from '../../../features/pinAuth/hooks/usePinAuth';
import { AVAILABLE_LANGUAGES } from '../../../i18n/i18n.config';

// Navigation types
type SettingsStackParamList = {
  Settings: undefined;
  AppearanceSettings: undefined;
  LanguageSettings: undefined;
  NotificationSettings: undefined;
  PrinterSettings: undefined;
  PaymentSettings: undefined;
  About: undefined;
  CategoryManagement: undefined;
  ItemManagement: undefined;
};

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList>;

// App version (could be from app.json or constants)
const APP_VERSION = '1.0.0';

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { logoutSession } = usePinAuth();
  const { t } = useTranslation('profile');
  const currentLanguage = useSelector(selectLanguage);
  const currentUser = useSelector(selectCurrentUser);
  const tenant = useSelector(selectTenant);
  const responsiveStyles = useResponsiveStyles();

  // Get language display name
  const languageDisplayName =
    AVAILABLE_LANGUAGES.find((lang) => lang.code === currentLanguage)?.name ||
    'English';

  // Navigation handlers
  const handleAppearancePress = useCallback(() => {
    navigation.navigate('AppearanceSettings');
  }, [navigation]);

  const handleLanguagePress = useCallback(() => {
    navigation.navigate('LanguageSettings');
  }, [navigation]);

  const handleNotificationsPress = useCallback(() => {
    navigation.navigate('NotificationSettings');
  }, [navigation]);

  const handlePrinterPress = useCallback(() => {
    navigation.navigate('PrinterSettings');
  }, [navigation]);

  const handlePaymentPress = useCallback(() => {
    navigation.navigate('PaymentSettings');
  }, [navigation]);

  const handleAboutPress = useCallback(() => {
    navigation.navigate('About');
  }, [navigation]);

  const handleCategoriesPress = useCallback(() => {
    navigation.navigate('CategoryManagement');
  }, [navigation]);

  const handleItemsPress = useCallback(() => {
    navigation.navigate('ItemManagement');
  }, [navigation]);

  const handleLogoutPress = useCallback(() => {
    Alert.alert(
      t('logout.button'),
      t('logout.confirm'),
      [
        {
          text: t('common:cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('logout.button'),
          style: 'destructive',
          onPress: () => {
            // Session cleanup: clears tokens, PIN verification, and
            // cached data. Preserves PIN and tenant identity so the
            // user sees the PIN login screen on next launch.
            logoutSession();
          },
        },
      ],
      { cancelable: true }
    );
  }, [logoutSession, t]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { padding: responsiveStyles.contentPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences Section */}
        <SettingsSection title={t('settings.sections.preferences', 'Preferences')}>
          <SettingsRow
            label={t('settings.appearance.title', 'Appearance')}
            icon="appearance"
            onPress={handleAppearancePress}
            hasChevron
            testID="settings-row-appearance"
          />
          <SettingsRow
            label={t('settings.language.title', 'Language')}
            value={languageDisplayName}
            icon="language"
            onPress={handleLanguagePress}
            hasChevron
            testID="settings-row-language"
          />
          <SettingsRow
            label={t('settings.notifications.title', 'Notifications')}
            icon="notifications"
            onPress={handleNotificationsPress}
            hasChevron
            testID="settings-row-notifications"
          />
        </SettingsSection>

        {/* Printing Section */}
        <SettingsSection title={t('settings.sections.printing', 'Printing')}>
          <SettingsRow
            label={t('settings.printer.title', 'Printer Settings')}
            icon="printer"
            onPress={handlePrinterPress}
            hasChevron
            testID="settings-row-printer"
          />
        </SettingsSection>

        {/* Payment Section */}
        <SettingsSection title={t('settings.sections.payment', 'Payment')}>
          <SettingsRow
            label={t('settings.payment.title', 'Payment Settings')}
            icon="payment"
            onPress={handlePaymentPress}
            hasChevron
            testID="settings-row-payment"
          />
        </SettingsSection>

        {/* Catalog Management Section */}
        <SettingsSection title={t('settings.sections.catalogManagement', 'Catalog Management')}>
          <SettingsRow
            label={t('settings.catalog.categories', 'Categories')}
            icon="category"
            onPress={handleCategoriesPress}
            hasChevron
            testID="settings-row-categories"
          />
          <SettingsRow
            label={t('settings.catalog.items', 'Items')}
            icon="items"
            onPress={handleItemsPress}
            hasChevron
            testID="settings-row-items"
          />
        </SettingsSection>

        {/* About Section */}
        <SettingsSection title={t('settings.sections.about', 'About')}>
          <SettingsRow
            label={t('settings.about.title', 'About GroOne')}
            icon="about"
            onPress={handleAboutPress}
            hasChevron
            testID="settings-row-about"
          />
          <SettingsRow
            label={t('settings.about.version', 'Version')}
            value={APP_VERSION}
            disabled
            testID="settings-row-version"
          />
        </SettingsSection>

        {/* Account Section */}
        <SettingsSection title={t('settings.sections.account', 'Account')}>
          {tenant && (
            <SettingsRow
              label={tenant.name}
              value={
                currentUser
                  ? `${[currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ')}${currentUser.role ? ` \u00B7 ${formatUserRole(currentUser.role)}` : ''}`
                  : t('settings.reconnecting', 'Reconnecting...')
              }
              icon="user"
              disabled
              testID="settings-row-store-info"
            />
          )}
          <SettingsRow
            label={tenant ? `${t('settings.logout', 'Logout')} \u2013 ${tenant.name}` : t('settings.logout', 'Logout')}
            icon="logout"
            onPress={handleLogoutPress}
            variant="danger"
            testID="settings-row-logout"
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    // padding applied dynamically via responsiveStyles
  },
});

export default SettingsScreen;

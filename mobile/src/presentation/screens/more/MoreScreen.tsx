/**
 * MoreScreen
 * Hub screen with store info, management, settings, and account actions
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, StatusBar, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';
import { SettingsSection, SettingsRow } from '../../components/settings';
import { selectTenant } from '../../../store/slices/tenantSlice';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { usePinAuth } from '../../../features/pinAuth/hooks/usePinAuth';
import { formatUserRole } from '../../../utils/formatters/userFormatters';

const APP_VERSION = '1.0.0';

type MoreStackParamList = {
  More: undefined;
  Settings: undefined;
  InventoryDashboard: undefined;
  About: undefined;
};

type NavigationProp = NativeStackNavigationProp<MoreStackParamList>;

const MoreScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const tenant = useSelector(selectTenant);
  const currentUser = useSelector(selectCurrentUser);
  const { logoutSession } = usePinAuth();

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  const handleInventoryPress = useCallback(() => {
    navigation.navigate('InventoryDashboard');
  }, [navigation]);

  const handleAboutPress = useCallback(() => {
    navigation.navigate('About');
  }, [navigation]);

  const handleLogoutPress = useCallback(() => {
    Alert.alert(
      t('more.logout', 'Logout'),
      t('more.logoutConfirm', 'Are you sure you want to logout?'),
      [
        {
          text: t('common:cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('more.logout', 'Logout'),
          style: 'destructive',
          onPress: () => {
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
      edges={['top', 'bottom']}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.primary,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.md,
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            {
              color: '#FFFFFF',
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
            },
          ]}
        >
          {t('more.title', 'More')}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { padding: responsiveStyles.contentPadding || 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Store Section */}
        {tenant && (
          <SettingsSection title={t('more.sections.store', 'Store')}>
            <SettingsRow
              label={tenant.name}
              value={
                currentUser
                  ? `${[currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ')}${currentUser.role ? ` \u00B7 ${formatUserRole(currentUser.role)}` : ''}`
                  : undefined
              }
              icon="user"
              disabled
              testID="more-row-store-info"
            />
          </SettingsSection>
        )}

        {/* Management Section */}
        <SettingsSection title={t('more.sections.management', 'Management')}>
          <SettingsRow
            label={t('more.inventory', 'Inventory')}
            icon="inventory"
            onPress={handleInventoryPress}
            hasChevron
            testID="more-row-inventory"
          />
        </SettingsSection>

        {/* Settings Section */}
        <SettingsSection title={t('more.sections.settings', 'Settings')}>
          <SettingsRow
            label={t('more.settings', 'Settings')}
            icon="settings"
            onPress={handleSettingsPress}
            hasChevron
            testID="more-row-settings"
          />
        </SettingsSection>

        {/* App Section */}
        <SettingsSection title={t('more.sections.app', 'App')}>
          <SettingsRow
            label={t('more.about', 'About GroOne')}
            icon="about"
            onPress={handleAboutPress}
            hasChevron
            testID="more-row-about"
          />
          <SettingsRow
            label={t('more.version', 'Version')}
            value={APP_VERSION}
            disabled
            testID="more-row-version"
          />
        </SettingsSection>

        {/* Account Section */}
        <SettingsSection title="">
          <SettingsRow
            label={tenant ? `${t('more.logout', 'Logout')} \u2013 ${tenant.name}` : t('more.logout', 'Logout')}
            icon="logout"
            onPress={handleLogoutPress}
            variant="danger"
            testID="more-row-logout"
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
  header: {},
  headerTitle: {},
  scrollView: {
    flex: 1,
  },
  content: {},
});

export default MoreScreen;

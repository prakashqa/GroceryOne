/**
 * Notification Settings Screen
 * Notification preferences configuration
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../theme';
import { SettingsSection, SettingsToggle } from '../../components/settings';
import {
  selectNotifications,
  setNotificationsEnabled,
  updateNotificationPreference,
  NotificationPreferences,
} from '../../../store/slices/settingsSlice';
import { saveSettings } from '../../../utils/storage/settingsStorage';
import { selectTenant } from '../../../store/slices/tenantSlice';

const NotificationSettingsScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation('profile');
  const notifications = useSelector(selectNotifications);
  const tenant = useSelector(selectTenant);

  const handleMasterToggle = useCallback(
    async (value: boolean) => {
      dispatch(setNotificationsEnabled(value));
      try {
        if (tenant?.slug) {
          await saveSettings({
            notifications: { ...notifications, enabled: value },
          }, tenant.slug);
        }
      } catch (error) {
        console.error('Failed to save notification settings:', error);
      }
    },
    [dispatch, notifications, tenant]
  );

  const handlePreferenceToggle = useCallback(
    async (key: keyof Omit<NotificationPreferences, 'enabled'>, value: boolean) => {
      dispatch(updateNotificationPreference({ key, value }));
      try {
        if (tenant?.slug) {
          await saveSettings({
            notifications: { ...notifications, [key]: value },
          }, tenant.slug);
        }
      } catch (error) {
        console.error('Failed to save notification settings:', error);
      }
    },
    [dispatch, notifications, tenant]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: theme.spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Master Toggle */}
        <SettingsSection title={t('settings.notifications.general', 'General')}>
          <SettingsToggle
            label={t('settings.notifications.enabled', 'Enable Notifications')}
            description={t(
              'settings.notifications.enabledDescription',
              'Receive push notifications from the app'
            )}
            icon="notifications"
            value={notifications.enabled}
            onValueChange={handleMasterToggle}
            testID="notification-master-toggle"
          />
        </SettingsSection>

        {/* Notification Types */}
        <SettingsSection title={t('settings.notifications.types', 'Notification Types')}>
          <SettingsToggle
            label={t('settings.notifications.orderUpdates', 'Order Updates')}
            description={t(
              'settings.notifications.orderUpdatesDescription',
              'Get notified about your order status'
            )}
            value={notifications.orderUpdates}
            onValueChange={(value) => handlePreferenceToggle('orderUpdates', value)}
            disabled={!notifications.enabled}
            testID="notification-orderUpdates-toggle"
          />
          <SettingsToggle
            label={t('settings.notifications.promotions', 'Promotions & Offers')}
            description={t(
              'settings.notifications.promotionsDescription',
              'Receive special offers and discounts'
            )}
            value={notifications.promotions}
            onValueChange={(value) => handlePreferenceToggle('promotions', value)}
            disabled={!notifications.enabled}
            testID="notification-promotions-toggle"
          />
          <SettingsToggle
            label={t('settings.notifications.reminders', 'Reminders')}
            description={t(
              'settings.notifications.remindersDescription',
              'Get reminders for your tasks'
            )}
            value={notifications.reminders}
            onValueChange={(value) => handlePreferenceToggle('reminders', value)}
            disabled={!notifications.enabled}
            testID="notification-reminders-toggle"
          />
        </SettingsSection>

        {/* Alert Settings */}
        <SettingsSection title={t('settings.notifications.alerts', 'Alert Settings')}>
          <SettingsToggle
            label={t('settings.notifications.sound', 'Sound')}
            description={t(
              'settings.notifications.soundDescription',
              'Play sound for notifications'
            )}
            icon="sound"
            value={notifications.sound}
            onValueChange={(value) => handlePreferenceToggle('sound', value)}
            disabled={!notifications.enabled}
            testID="notification-sound-toggle"
          />
          <SettingsToggle
            label={t('settings.notifications.vibration', 'Vibration')}
            description={t(
              'settings.notifications.vibrationDescription',
              'Vibrate for notifications'
            )}
            icon="vibration"
            value={notifications.vibration}
            onValueChange={(value) => handlePreferenceToggle('vibration', value)}
            disabled={!notifications.enabled}
            testID="notification-vibration-toggle"
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
    // padding applied via theme.spacing.md inline
  },
});

export default NotificationSettingsScreen;

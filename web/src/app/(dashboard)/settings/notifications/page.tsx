'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { selectNotifications, setNotificationsEnabled, updateNotificationPreference } from '@groceryone/store';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Toggle } from '@/components/common/Toggle';
import { SettingRow } from '@/components/common/SettingRow';

export default function NotificationSettingsPage() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const { t } = useTranslation('profile');

  return (
    <div className="page page-container">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="btn-icon" aria-label="Back"><ArrowLeft size={18} /></Link>
        <h1 className="page-title">{t('settings.notifications.title')}</h1>
      </div>
      <div className="card row-divider">
        <SettingRow
          label={t('settings.notifications.enabled')}
          description={t('settings.notifications.enabledDescription')}
          control={<Toggle checked={notifications.enabled} label={t('settings.notifications.enabled')} onChange={(v) => dispatch(setNotificationsEnabled(v))} />}
        />
        {(['orderUpdates', 'promotions', 'reminders', 'sound', 'vibration'] as const).map((key) => (
          <SettingRow
            key={key}
            label={t(`settings.notifications.${key}`)}
            description={t(`settings.notifications.${key}Description`)}
            control={<Toggle checked={notifications[key]} label={t(`settings.notifications.${key}`)} onChange={(v) => dispatch(updateNotificationPreference({ key, value: v }))} />}
          />
        ))}
      </div>
    </div>
  );
}

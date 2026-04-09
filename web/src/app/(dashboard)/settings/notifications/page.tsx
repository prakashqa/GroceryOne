'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { selectNotifications, setNotificationsEnabled, updateNotificationPreference } from '@groceryone/store';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function NotificationSettingsPage() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const { t } = useTranslation('profile');

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold">{t('settings.notifications.title')}</h1>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
        <div className="px-5 py-4 flex items-center justify-between">
          <div><p className="font-medium text-sm">{t('settings.notifications.enabled')}</p><p className="text-xs text-gray-500">{t('settings.notifications.enabledDescription')}</p></div>
          <Toggle checked={notifications.enabled} onChange={(v) => dispatch(setNotificationsEnabled(v))} />
        </div>
        {(['orderUpdates', 'promotions', 'reminders', 'sound', 'vibration'] as const).map((key) => (
          <div key={key} className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t(`settings.notifications.${key}`)}</p>
              <p className="text-xs text-gray-500">{t(`settings.notifications.${key}Description`)}</p>
            </div>
            <Toggle checked={notifications[key]} onChange={(v) => dispatch(updateNotificationPreference({ key, value: v }))} />
          </div>
        ))}
      </div>
    </div>
  );
}

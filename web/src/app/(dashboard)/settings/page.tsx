'use client';

import Link from 'next/link';
import { Palette, Globe, Bell, Printer, CreditCard, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation(['common', 'profile']);

  const settingsItems = [
    { name: t('profile:settings.appearance.title'), description: t('profile:settings.appearance.title'), icon: Palette, href: '/settings/appearance' },
    { name: t('profile:settings.language.title'), description: t('profile:settings.language.title'), icon: Globe, href: '/settings/language' },
    { name: t('profile:settings.notifications.title'), description: t('profile:settings.notifications.title'), icon: Bell, href: '/settings/notifications' },
    { name: t('profile:settings.printer.title'), description: t('profile:settings.printer.title'), icon: Printer, href: '/settings/printer' },
    { name: t('profile:settings.payment.title'), description: t('profile:settings.payment.title'), icon: CreditCard, href: '/settings/payment' },
    { name: t('profile:settings.about.title'), description: t('profile:settings.about.title'), icon: Info, href: '/settings/about' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('common:more.settings')}</h1>
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <item.icon size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        ))}
      </div>
    </div>
  );
}

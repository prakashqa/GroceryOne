'use client';

import Link from 'next/link';
import { Palette, Globe, Bell, Printer, CreditCard, Info, ChevronRight } from 'lucide-react';
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
    <div className="page page-container">
      <h1 className="page-title mb-6">{t('common:more.settings')}</h1>
      <div className="card row-divider">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href} className="row">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
              <item.icon size={20} className="text-primary dark:text-primary-light" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{item.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</p>
            </div>
            <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

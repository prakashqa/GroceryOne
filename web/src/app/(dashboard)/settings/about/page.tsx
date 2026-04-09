'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function AboutPage() {
  const { t } = useTranslation(['profile', 'common']);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold">{t('profile:settings.about.title')}</h1>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-8 text-center">
        <h2 className="text-3xl font-bold text-primary dark:text-primary-light mb-2">{t('common:appName')}</h2>
        <p className="text-gray-500 mb-4">{t('profile:settings.about.description')}</p>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>{t('profile:about.version')} 1.0.0 (Web)</p>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} {t('common:appName')}.</p>
        </div>
      </div>
    </div>
  );
}

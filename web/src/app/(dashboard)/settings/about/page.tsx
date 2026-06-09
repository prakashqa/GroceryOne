'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Wordmark } from '@/components/common/Wordmark';

export default function AboutPage() {
  const { t } = useTranslation(['profile', 'common']);

  return (
    <div className="page page-container">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="btn-icon" aria-label="Back"><ArrowLeft size={18} /></Link>
        <h1 className="page-title">{t('profile:settings.about.title')}</h1>
      </div>
      <div className="card p-8 text-center">
        <div className="flex justify-center mb-3">
          <Wordmark size="lg" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{t('profile:settings.about.description')}</p>
        <span className="badge-neutral">{t('profile:about.version')} 1.0.0 (Web)</span>
        <div className="section-divider mt-6" />
        <p className="text-xs text-gray-400 dark:text-gray-500">&copy; {new Date().getFullYear()} {t('common:appName')}.</p>
      </div>
    </div>
  );
}

'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { selectLanguage, setSettingsLanguage } from '@groceryone/store';
import { AVAILABLE_LANGUAGES } from '@groceryone/i18n';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

export default function LanguageSettingsPage() {
  const dispatch = useAppDispatch();
  const currentLang = useAppSelector(selectLanguage);
  const { t, i18n } = useTranslation(['common', 'profile']);

  const handleChange = (code: string) => {
    dispatch(setSettingsLanguage(code));
    i18n.changeLanguage(code);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold">{t('profile:settings.language.title')}</h1>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
        {AVAILABLE_LANGUAGES.map((lang) => (
          <button key={lang.code} onClick={() => handleChange(lang.code)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div>
              <p className="font-medium text-sm">{lang.name}</p>
              <p className="text-xs text-gray-500">{lang.nativeName}</p>
            </div>
            {currentLang === lang.code && <Check size={18} className="text-primary" />}
          </button>
        ))}
      </div>
    </div>
  );
}

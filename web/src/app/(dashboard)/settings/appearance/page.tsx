'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { selectThemeMode, setThemeMode } from '@groceryone/store';
import type { ThemeMode } from '@groceryone/store';
import { Sun, Moon, Monitor, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function AppearanceSettingsPage() {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectThemeMode);
  const { t } = useTranslation('profile');

  const themes: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light', label: t('settings.appearance.light'), icon: Sun },
    { mode: 'dark', label: t('settings.appearance.dark'), icon: Moon },
    { mode: 'system', label: t('settings.appearance.system'), icon: Monitor },
  ];

  return (
    <div className="page page-container">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="btn-icon" aria-label="Back"><ArrowLeft size={18} /></Link>
        <h1 className="page-title">{t('settings.appearance.title')}</h1>
      </div>
      <div className="card p-5">
        <p className="label mb-3">{t('settings.appearance.theme')}</p>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ mode, label, icon: Icon }) => {
            const active = currentTheme === mode;
            return (
              <button key={mode} onClick={() => dispatch(setThemeMode(mode))}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-150 ${
                  active ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-line dark:border-line-dark hover:border-primary/50'
                }`}>
                <Icon size={24} className={active ? 'text-primary dark:text-primary-light animate-scale-in' : 'text-gray-400 dark:text-gray-500'} />
                <span className={`text-sm font-medium ${active ? 'text-primary dark:text-primary-light' : 'text-gray-700 dark:text-gray-300'}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold">{t('settings.appearance.title')}</h1>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <p className="text-sm font-medium mb-3">{t('settings.appearance.theme')}</p>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ mode, label, icon: Icon }) => (
            <button key={mode} onClick={() => dispatch(setThemeMode(mode))}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                currentTheme === mode ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              }`}>
              <Icon size={24} className={currentTheme === mode ? 'text-primary' : 'text-gray-400'} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

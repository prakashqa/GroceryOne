'use client';

import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectTenant, selectCurrentLanguage } from '@groceryone/store';
import { Sun, Moon, Globe, Menu } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';
import { useTranslation } from 'react-i18next';

export function Header() {
  const tenant = useAppSelector(selectTenant);
  const language = useAppSelector(selectCurrentLanguage);
  const { setIsOpen } = useSidebar();
  const { t } = useTranslation('common');

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {tenant?.name || t('appName')}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button className="hidden sm:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Globe size={18} className="text-gray-500" />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Sun size={18} className="text-gray-500 dark:hidden" />
          <Moon size={18} className="text-gray-500 hidden dark:block" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium text-primary dark:text-primary-light">
            {tenant?.name?.charAt(0) || 'G'}
          </span>
        </div>
      </div>
    </header>
  );
}

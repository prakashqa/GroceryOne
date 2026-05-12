'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectTenant, selectCurrentLanguage, selectThemeMode, setThemeMode,
  logout, clearTenant,
} from '@groceryone/store';
import { Sun, Moon, Globe, Menu, Monitor, User, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

export function Header() {
  const tenant = useAppSelector(selectTenant);
  const language = useAppSelector(selectCurrentLanguage);
  const themeMode = useAppSelector(selectThemeMode);
  const dispatch = useAppDispatch();
  const { setIsOpen } = useSidebar();
  const { t } = useTranslation(['common', 'profile']);
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cycleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    dispatch(setThemeMode(next));
  };

  // Close menu on click outside or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const handleMenuNavigate = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    dispatch(logout());
    dispatch(clearTenant());
    const keysToRemove = Object.keys(localStorage).filter(
      (k) => k.startsWith('@tenant') || k.startsWith('@catalog') ||
             k.startsWith('@multicart') || k.startsWith('@settings') ||
             k.startsWith('@groone') || k === 'i18nextLng'
    );
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    router.push('/pin-login');
  };

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
          {tenant?.name || t('appName', 'GroOne')}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language button */}
        <button
          onClick={() => router.push('/settings/language')}
          className="hidden sm:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Language settings"
          title={t('profile:settings.language.title', 'Language')}
        >
          <Globe size={18} className="text-gray-500" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
          title={themeMode === 'light' ? 'Dark mode' : themeMode === 'dark' ? 'System' : 'Light mode'}
        >
          {themeMode === 'dark' ? (
            <Moon size={18} className="text-gray-500" />
          ) : themeMode === 'system' ? (
            <Monitor size={18} className="text-gray-500" />
          ) : (
            <Sun size={18} className="text-gray-500" />
          )}
        </button>

        {/* Avatar + Dropdown menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors ring-2 ring-transparent hover:ring-primary/20"
            aria-label="Account menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="text-sm font-semibold text-primary dark:text-primary-light">
              {tenant?.name?.charAt(0).toUpperCase() || 'G'}
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-slide-up"
            >
              {/* Header: tenant info */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-semibold text-primary dark:text-primary-light">
                      {tenant?.name?.charAt(0).toUpperCase() || 'G'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{tenant?.name || t('appName', 'GroOne')}</p>
                    <p className="text-xs text-gray-500 truncate">{tenant?.slug || 'store'}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => handleMenuNavigate('/profile')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  role="menuitem"
                >
                  <User size={16} className="text-gray-400" />
                  <span>{t('profile:title', 'Profile')}</span>
                </button>
                <button
                  onClick={() => handleMenuNavigate('/settings')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  role="menuitem"
                >
                  <SettingsIcon size={16} className="text-gray-400" />
                  <span>{t('common:more.settings')}</span>
                </button>
              </div>

              {/* Divider + logout */}
              <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  role="menuitem"
                >
                  <LogOut size={16} />
                  <span>{t('common:more.logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

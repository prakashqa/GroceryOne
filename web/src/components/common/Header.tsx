'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectTenant, selectCurrentLanguage, selectThemeMode, setThemeMode,
} from '@groceryone/store';
import { Sun, Moon, Globe, Menu, Monitor, User, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { performLogout } from '@/lib/auth/logoutClient';
import { WhatsappSupport } from '@/components/common/WhatsappSupport';

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
    performLogout(dispatch, router);
  };

  const tenantInitial = (tenant?.name?.charAt(0) || 'G').toUpperCase();

  return (
    <header className="h-14 border-b border-line dark:border-line-dark bg-white/95 dark:bg-surface-dark/95 backdrop-blur-sm px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={() => setIsOpen(true)}
          className="btn-icon md:hidden -ml-1"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0 flex items-center gap-2">
          <div className="hidden md:flex w-7 h-7 rounded-md bg-primary/10 dark:bg-primary/15 items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary dark:text-primary-light">
              {tenantInitial}
            </span>
          </div>
          <h2 className="text-sm font-semibold tracking-tight text-gray-700 dark:text-gray-200 truncate">
            {tenant?.name || t('appName', 'GroOne')}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* WhatsApp sales support */}
        <WhatsappSupport className="mr-1" />

        {/* Language button */}
        <button
          onClick={() => router.push('/settings/language')}
          className="btn-icon hidden sm:inline-flex"
          aria-label="Language settings"
          title={t('profile:settings.language.title', 'Language')}
        >
          <Globe size={18} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="btn-icon"
          aria-label="Toggle theme"
          title={themeMode === 'light' ? 'Dark mode' : themeMode === 'dark' ? 'System' : 'Light mode'}
        >
          {themeMode === 'dark' ? (
            <Moon size={18} />
          ) : themeMode === 'system' ? (
            <Monitor size={18} />
          ) : (
            <Sun size={18} />
          )}
        </button>

        {/* Avatar + Dropdown menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="ml-1 w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/15 flex items-center justify-center transition-all duration-150 hover:bg-primary/20 dark:hover:bg-primary/25 hover:scale-[1.03] active:scale-[0.97]"
            aria-label="Account menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="text-sm font-semibold text-primary dark:text-primary-light">
              {tenantInitial}
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-card-dark rounded-xl shadow-card-lg border border-line dark:border-line-dark overflow-hidden z-50 animate-slide-down origin-top-right"
            >
              {/* Header: tenant info */}
              <div className="px-4 py-3.5 border-b border-line dark:border-line-dark bg-gray-50/60 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-semibold text-primary dark:text-primary-light">
                      {tenantInitial}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">
                      {tenant?.name || t('appName', 'GroOne')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tenant?.slug || 'store'}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => handleMenuNavigate('/profile')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                  role="menuitem"
                >
                  <User size={16} className="text-gray-400 dark:text-gray-500" />
                  <span>{t('profile:title', 'Profile')}</span>
                </button>
                <button
                  onClick={() => handleMenuNavigate('/settings')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                  role="menuitem"
                >
                  <SettingsIcon size={16} className="text-gray-400 dark:text-gray-500" />
                  <span>{t('common:more.settings')}</span>
                </button>
              </div>

              {/* Divider + logout */}
              <div className="border-t border-line dark:border-line-dark py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/10 dark:hover:bg-error/15 transition-colors"
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

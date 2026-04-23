'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { selectSettings, selectIsSettingsHydrated, hydrateSettings } from '@groceryone/store';
import i18n from '@/lib/i18n/config';

const SETTINGS_STORAGE_KEY = '@settings_cache';
const DEBOUNCE_MS = 1000;

export function useSettingsHydration() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const isHydrated = useAppSelector(selectIsSettingsHydrated);
  const hasHydrated = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hasHydrated.current || isHydrated) return;
    hasHydrated.current = true;
    try {
      const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
      dispatch(hydrateSettings(cached ? JSON.parse(cached) : {}));
    } catch {
      dispatch(hydrateSettings({}));
    }
  }, [dispatch, isHydrated]);

  // Sync i18next language with Redux settings
  useEffect(() => {
    if (!isHydrated || !settings.language) return;
    if (i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [isHydrated, settings.language]);

  // Debounced persist
  useEffect(() => {
    if (!isHydrated) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
          themeMode: settings.themeMode, language: settings.language,
          notifications: settings.notifications, printer: settings.printer, payment: settings.payment,
        }));
      } catch { /* storage full */ }
    }, DEBOUNCE_MS);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [settings, isHydrated]);
}

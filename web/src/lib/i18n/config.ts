'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en, te } from '@groceryone/i18n';

const resources = {
  en,
  te,
};

// Browser-only init.
//
// Background: in Next 14, evaluating `i18n.use(...).init({...})` at the
// top of a module that's part of an `'use client'` layout causes the
// (auth)/layout server bundle to silently fail to emit, which routes
// `/pin-login` (and every page in the (auth) group) to /_not-found.
// Running init only when `typeof window !== 'undefined'` keeps the
// module SSR-safe.
//
// Hydration-safety contract: every `t(key, ...)` call in components
// rendered on the SSR path MUST pass a default value (e.g.
// `t('appName', 'GroOne')` or `t('enterPin', 'Enter PIN')`). On the
// server i18n is uninitialized so the default is rendered; on the
// client the initialized lookup returns the same string for `lng: 'en'`
// (default lang). Without defaults, SSR renders the raw key and client
// renders the translation → React hydration mismatch.
if (typeof window !== 'undefined' && !i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en',
      fallbackLng: 'en',
      supportedLngs: ['en', 'te'],
      defaultNS: 'common',
      ns: ['common', 'auth', 'cart', 'errors', 'orders', 'products', 'profile'],
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;

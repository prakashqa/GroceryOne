'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en, te } from '@groceryone/i18n';

const resources = {
  en,
  te,
};

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

export default i18n;

/**
 * i18n Configuration
 * Internationalization setup for English and Telugu
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enProducts from './locales/en/products.json';
import enCart from './locales/en/cart.json';
import enOrders from './locales/en/orders.json';
import enProfile from './locales/en/profile.json';
import enErrors from './locales/en/errors.json';

import teCommon from './locales/te/common.json';
import teAuth from './locales/te/auth.json';
import teProducts from './locales/te/products.json';
import teCart from './locales/te/cart.json';
import teOrders from './locales/te/orders.json';
import teProfile from './locales/te/profile.json';
import teErrors from './locales/te/errors.json';

const LANGUAGE_KEY = '@app_language';

// Language detector for async storage
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      callback(savedLanguage || 'en');
    } catch (error) {
      console.error('Failed to detect language:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.error('Failed to cache language:', error);
    }
  },
};

// Resources configuration
const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    products: enProducts,
    cart: enCart,
    orders: enOrders,
    profile: enProfile,
    errors: enErrors,
  },
  te: {
    common: teCommon,
    auth: teAuth,
    products: teProducts,
    cart: teCart,
    orders: teOrders,
    profile: teProfile,
    errors: teErrors,
  },
};

// Initialize i18n
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    supportedLngs: ['en', 'te'],
    ns: ['common', 'auth', 'products', 'cart', 'orders', 'profile', 'errors'],
    defaultNS: 'common',
    resources,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Helper function to change language
export const changeLanguage = async (languageCode: 'en' | 'te') => {
  await i18n.changeLanguage(languageCode);
};

// Helper function to get current language
export const getCurrentLanguage = () => i18n.language as 'en' | 'te';

// Available languages
export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
] as const;

export default i18n;

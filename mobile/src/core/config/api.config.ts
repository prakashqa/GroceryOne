/**
 * API Configuration
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Get the development API base URL based on platform and device type
 *
 * Priority:
 * 1. LOCAL_API_IP from .env (works for both physical devices AND emulators
 *    when backend listens on 0.0.0.0)
 * 2. Constants.isDevice check for physical device fallback
 * 3. Platform-specific defaults (10.0.2.2 for Android emulator, localhost for iOS)
 *
 * Note: Constants.isDevice can be unreliable in Expo dev builds, so .env is preferred.
 */
const LOCAL_MACHINE_IP = '192.168.0.104'; // Hardcoded fallback — prefer LOCAL_API_IP in .env

// Cloud Run production API URL
const CLOUD_API_URL = 'https://groceryone-backend-343826079780.asia-south1.run.app/api/v1';

// Set to true to use Cloud Run backend even in dev mode (for testing with cloud services)
// Set to false to use local backend (for local development)
const USE_CLOUD_API = false;

const getDevBaseUrl = (): string => {
  // Priority 0: Use cloud API if explicitly enabled
  if (USE_CLOUD_API) {
    return CLOUD_API_URL;
  }

  // Detect Android emulator: check Build.FINGERPRINT for "sdk" or "emulator" markers.
  // Constants.isDevice is unreliable in Expo dev client builds (returns true for emulators).
  // Android emulators can't reach the host's LAN IP — they must use 10.0.2.2.
  const androidConstants = Platform.OS === 'android' ? (Platform as any).constants : null;
  const fingerprint: string = androidConstants?.Fingerprint ?? '';
  const isAndroidEmulator =
    Platform.OS === 'android' &&
    (fingerprint.includes('sdk') ||
      fingerprint.includes('emulator') ||
      fingerprint.includes('generic'));

  // Priority 1: Android emulator always uses 10.0.2.2
  // 10.0.2.2 is a special alias that routes to the host machine's loopback.
  if (isAndroidEmulator) {
    return 'http://10.0.2.2:3000/api/v1';
  }

  // Priority 2: Explicit IP from .env — most reliable for physical devices on LAN
  const envIp = Constants.expoConfig?.extra?.localApiIp;
  if (envIp) {
    return `http://${envIp}:3000/api/v1`;
  }

  // Priority 3: Physical device without .env IP — use hardcoded LAN IP fallback
  if (Constants.isDevice) {
    return `http://${LOCAL_MACHINE_IP}:3000/api/v1`;
  }

  // Priority 4: iOS simulator can reach the host via localhost directly.
  // Android emulator without matching fingerprint falls through here too.
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api/v1';
  }

  return 'http://localhost:3000/api/v1';
};

export const API_CONFIG = {
  // Base URL - automatically configured based on platform
  BASE_URL: __DEV__
    ? getDevBaseUrl()
    : 'https://groceryone-backend-343826079780.asia-south1.run.app/api/v1',

  // API version
  VERSION: '1.0',

  // Request timeout in milliseconds
  TIMEOUT: 30000,

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Cache settings (in seconds)
  CACHE_TIME: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },

  // Retry settings
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Endpoint paths
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGIN_PIN: '/auth/login/pin',
    RESOLVE_TENANT: '/auth/resolve-tenant',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_OTP: '/auth/verify-otp',
    ME: '/auth/me',
  },

  // Users
  USERS: {
    PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences',
    ADDRESSES: '/users/addresses',
  },

  // Products
  PRODUCTS: {
    LIST: '/products',
    FEATURED: '/products/featured',
    SEARCH: '/products/search',
    DETAIL: (slug: string) => `/products/${slug}`,
    REVIEWS: (id: string) => `/products/${id}/reviews`,
  },

  // Categories
  CATEGORIES: {
    LIST: '/categories',
    DETAIL: (slug: string) => `/categories/${slug}`,
    PRODUCTS: (slug: string) => `/categories/${slug}/products`,
  },

  // Cart
  CART: {
    GET: '/cart',
    ITEMS: '/cart/items',
    ITEM: (id: string) => `/cart/items/${id}`,
    COUPON: '/cart/coupon',
  },

  // Orders
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    DETAIL: (id: string) => `/orders/${id}`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
    TRACK: (id: string) => `/orders/${id}/track`,
  },

  // Wishlist
  WISHLIST: {
    LIST: '/wishlist',
    ADD: (productId: string) => `/wishlist/${productId}`,
    REMOVE: (productId: string) => `/wishlist/${productId}`,
  },

  // Delivery
  DELIVERY: {
    SLOTS: '/delivery/slots',
    CHECK: '/delivery/check',
  },

  // Tenant
  TENANT: {
    CONFIG: '/tenant/config',
  },
} as const;

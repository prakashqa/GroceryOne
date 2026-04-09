/**
 * @groceryone/i18n - Shared locale resources
 *
 * Usage:
 *   const { en, te } = require('@groceryone/i18n');
 *   // or import { en, te } from '@groceryone/i18n';
 */

const en = {
  common: require('./locales/en/common.json'),
  auth: require('./locales/en/auth.json'),
  cart: require('./locales/en/cart.json'),
  errors: require('./locales/en/errors.json'),
  orders: require('./locales/en/orders.json'),
  products: require('./locales/en/products.json'),
  profile: require('./locales/en/profile.json'),
};

const te = {
  common: require('./locales/te/common.json'),
  auth: require('./locales/te/auth.json'),
  cart: require('./locales/te/cart.json'),
  errors: require('./locales/te/errors.json'),
  orders: require('./locales/te/orders.json'),
  products: require('./locales/te/products.json'),
  profile: require('./locales/te/profile.json'),
};

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
];

module.exports = { en, te, AVAILABLE_LANGUAGES };

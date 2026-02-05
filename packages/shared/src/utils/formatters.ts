/**
 * Formatter utility functions
 */

import type { ProductUnit } from '../types/product.types';

/**
 * Formats amount as Indian Rupee currency
 */
export function formatCurrency(amount: number, locale: string = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats amount as compact currency (no symbol, no decimals) with Indian grouping
 * e.g. 21333 → "21,333", 1000000 → "10,00,000"
 */
export function formatCurrencyCompact(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type DateFormat = 'default' | 'short' | 'long' | 'datetime';

/**
 * Formats date in various formats
 */
export function formatDate(
  date: Date | string,
  format: DateFormat = 'default',
  locale: string = 'en-IN'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = (() => {
    switch (format) {
      case 'short':
        return {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        };
      case 'long':
        return {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        };
      case 'datetime':
        return {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        };
      case 'default':
      default:
        return {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        };
    }
  })();

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Formats phone number in Indian format
 */
export function formatPhone(phone: string): string {
  if (!phone) {
    return '';
  }

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Remove leading + if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Remove country code 91 if present
  if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.slice(2);
  }

  // Check if we have 10 digits
  if (cleaned.length !== 10) {
    return phone; // Return original if invalid
  }

  // Format as +91 XXXXX XXXXX
  return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
}

/**
 * Formats weight/volume with appropriate unit
 */
export function formatWeight(value: number, unit: ProductUnit | string): string {
  const unitLabels: Record<string, { singular: string; plural: string }> = {
    kg: { singular: 'kg', plural: 'kg' },
    g: { singular: 'g', plural: 'g' },
    l: { singular: 'L', plural: 'L' },
    ml: { singular: 'ml', plural: 'ml' },
    piece: { singular: 'pc', plural: 'pcs' },
    pack: { singular: 'pack', plural: 'packs' },
    dozen: { singular: 'dozen', plural: 'dozens' },
  };

  const label = unitLabels[unit];
  if (!label) {
    return `${value} ${unit}`;
  }

  const unitStr = value === 1 ? label.singular : label.plural;
  return `${value} ${unitStr}`;
}

/**
 * Formats order ID to display order number
 */
export function formatOrderNumber(orderId: string): string {
  // Take first 8 characters (for UUID) or full ID if shorter
  const shortId = orderId.split('-')[0].slice(0, 8);
  return `ORD-${shortId.toUpperCase()}`;
}

/**
 * Truncates text to specified length with suffix
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!text) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  const truncateAt = maxLength - suffix.length;
  const truncated = text.slice(0, truncateAt).trim();
  return `${truncated}${suffix}`;
}

/**
 * Validation utility functions
 */

/**
 * Validates email address format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates Indian phone number format
 * Accepts: 9876543210, +919876543210, 919876543210, 09876543210
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Remove spaces and common separators
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Indian phone number regex
  // Starts with +91, 91, 0, or directly with 6-9
  // Followed by 10 digits starting with 6, 7, 8, or 9
  const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Validates password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  if (password.length < 8) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

/**
 * Validates Indian postal code (PIN code)
 * Must be 6 digits and not start with 0
 */
export function isValidPostalCode(postalCode: string): boolean {
  if (!postalCode || typeof postalCode !== 'string') {
    return false;
  }

  const pinRegex = /^[1-9]\d{5}$/;
  return pinRegex.test(postalCode.trim());
}

/**
 * Validates URL slug format
 * Must be lowercase, alphanumeric with hyphens, no leading/trailing/double hyphens
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Converts a string to a valid URL slug
 */
export function sanitizeSlug(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

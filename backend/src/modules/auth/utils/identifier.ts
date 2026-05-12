/**
 * Identifier normalization for login lookups.
 *
 * The login screens send a single `identifier` field that may contain
 * either an email or a phone number. Users type phones in many shapes:
 *   "+91 99990000001"  "+91-9999000001"  "9999000001"  "919999000001"
 * Whereas the DB historically stores them in mixed forms too (seeds use
 * "+91-9876543211"; the employee endpoint stores whatever the client sent).
 *
 * To keep matching predictable without a destructive migration, we
 * normalize BOTH sides at query time. Canonical form for matching: the
 * last 10 digits (Indian mobile length). The shape stored in the DB is
 * preserved as-is — only the lookup is digit-tolerant.
 */

/** Loose "looks like an email" check. Anything containing '@' is treated as email. */
export const looksLikeEmail = (s: string): boolean => s.includes('@');

/**
 * Strip everything that isn't a digit. Used for normalising phone-shaped
 * input on the way INTO a SQL `regexp_replace(..., '[^0-9]', '', 'g')`
 * comparison.
 */
export const digitsOnly = (s: string): string => s.replace(/\D+/g, '');

/**
 * Return the canonical last-10-digit form of a phone-shaped string, or
 * null if the input clearly isn't a phone (too few digits, or contains @).
 *
 * Examples (Indian mobile numbers, 10 digits long):
 *   "9999000001"        -> "9999000001"
 *   "+91 9999000001"    -> "9999000001"
 *   "+91-9999000001"    -> "9999000001"
 *   "919999000001"      -> "9999000001"
 *   "00919999000001"    -> "9999000001"
 *   "alice@example.com" -> null   (looks like email)
 *   "12345"             -> null   (too short)
 */
export const normalizePhoneLast10 = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed || looksLikeEmail(trimmed)) return null;
  const digits = digitsOnly(trimmed);
  if (digits.length < 10) return null;
  return digits.slice(-10);
};

/**
 * Tiny helper used by `baseApi`'s wrapper to surface silent backend
 * failures (e.g. 401 returned for a missing JWT) in dev tools.
 *
 * Why this exists: RTK Query stores fetch errors on the query state, but
 * if no UI is observing that state the failure is invisible. The cart
 * sync gap users hit was a silent 401 that nothing logged or surfaced,
 * so the symptom looked like "data just doesn't load" rather than
 * "auth is missing".
 *
 * The log is intentionally terse and contains no body / token data.
 */

export interface LogTarget {
  warn: (message: string) => void;
}

export interface LoggableResult {
  error?: { status?: number | string };
  meta?: { response?: { status?: number } };
}

/**
 * Inspect an RTK Query base-query result and `console.warn` once if the
 * response was a non-2xx status. Returns the result unchanged so callers
 * can chain it transparently.
 */
export function logNon2xx<T extends LoggableResult>(
  result: T,
  method: string,
  url: string,
  logger: LogTarget = console,
): T {
  // Prefer the error.status path (RTK Query populates it on non-2xx); fall
  // back to meta.response.status for the rare success-shaped error case.
  const errorStatus =
    typeof result.error?.status === 'number'
      ? result.error.status
      : typeof result.error?.status === 'string'
        ? parseInt(result.error.status, 10)
        : undefined;

  const responseStatus = result.meta?.response?.status;
  const status = errorStatus ?? responseStatus;

  if (typeof status === 'number' && (status < 200 || status >= 300)) {
    // Method + url + status only. No headers, no body, no token.
    logger.warn(`[API] ${method.toUpperCase()} ${url} returned ${status}`);
  }

  return result;
}

/**
 * Flatten React Native style arrays into a single object for test assertions.
 * Replaces the repeated inline pattern:
 *   Array.isArray(style) ? style.reduce((acc, s) => ({...acc, ...(s || {})}), {}) : style
 */
export function flattenStyle(style: any): Record<string, any> {
  if (Array.isArray(style)) {
    return style.reduce(
      (acc: Record<string, any>, s: any) => ({ ...acc, ...(s || {}) }),
      {},
    );
  }
  return style || {};
}

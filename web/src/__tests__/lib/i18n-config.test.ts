/**
 * @jest-environment node
 *
 * SSR-safety regression test for the i18n config module.
 *
 * Background: this file is imported (transitively) from the
 * `(auth)/layout.tsx` server bundle. Running `i18n.init({...})` at
 * module top level on the Node SSR side caused Next 14's RSC compile
 * pipeline to silently drop the layout's server bundle, which routed
 * every page in the (auth) group to /_not-found.
 *
 * The fix: gate init behind `typeof window !== 'undefined'`. SSR is a
 * no-op; the client initializes on first import.
 *
 * Hydration safety: callers must use `t(key, defaultValue)` so the
 * SSR-rendered "default" string matches the client-rendered translated
 * string for the default language (en). See Sidebar and Header.
 *
 * This test verifies the contract by importing the module in jest's
 * `node` environment (no `window`) and asserting:
 *   1. The import does not throw.
 *   2. `i18n.isInitialized` is falsy (SSR-side init was a no-op).
 *   3. Re-importing is idempotent and still does not initialize.
 */

describe('i18n config — SSR safety', () => {
  it('does not throw when imported in a Node (no-window) environment', () => {
    expect(() => {
      jest.isolateModules(() => {
        require('@/lib/i18n/config');
      });
    }).not.toThrow();
  });

  it('does NOT initialize i18n on the SSR side (skips init when window is undefined)', () => {
    let i18n: any;
    jest.isolateModules(() => {
      i18n = require('@/lib/i18n/config').default;
    });
    expect(i18n).toBeDefined();
    // SSR-side: window is undefined → init must be skipped to keep the
    // (auth)/layout server bundle emit-able.
    expect(i18n.isInitialized).toBeFalsy();
  });

  it('importing twice on the server is idempotent (still no-op)', () => {
    let first: any, second: any;
    jest.isolateModules(() => {
      first = require('@/lib/i18n/config').default;
    });
    jest.isolateModules(() => {
      second = require('@/lib/i18n/config').default;
    });
    expect(first.isInitialized).toBeFalsy();
    expect(second.isInitialized).toBeFalsy();
  });
});

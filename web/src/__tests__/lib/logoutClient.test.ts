/**
 * Tests for the shared logout helper. Verifies the rule that the previous
 * inline implementation got wrong: PRESERVE @tenant_data / @last_identifier
 * so the next sign-in is one PIN tap, while still clearing session-sensitive
 * @auth_tokens / @catalog / @multicart / @settings.
 */

jest.mock('@groceryone/store', () => ({
  logout: jest.fn(() => ({ type: 'auth/logout' })),
}));

import { performLogout, shouldRemoveOnLogout } from '@/lib/auth/logoutClient';
import { logout } from '@groceryone/store';

describe('shouldRemoveOnLogout', () => {
  it.each([
    ['@auth_tokens_test-business1', true],
    ['@auth_tokens_freshmart', true],
    ['@catalog', true],
    ['@catalog_v2', true],
    ['@multicart', true],
    ['@multicart_drafts', true],
    ['@settings', true],
    ['@settings_appearance', true],
  ])('removes %s', (key, expected) => {
    expect(shouldRemoveOnLogout(key)).toBe(expected);
  });

  it.each([
    ['@tenant_data', false],
    ['@tenant_id', false],
    ['@last_identifier_test-business1', false],
    ['@groone:last_login', false],
    ['i18nextLng', false],
    ['random_unrelated_key', false],
  ])('preserves %s', (key, expected) => {
    expect(shouldRemoveOnLogout(key)).toBe(expected);
  });
});

describe('performLogout', () => {
  const dispatch = jest.fn();
  const router = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('dispatches the logout action (clearing session) but NOT clearTenant', () => {
    performLogout(dispatch as any, router);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(logout());
  });

  it('routes back to /pin-login', () => {
    performLogout(dispatch as any, router);
    expect(router.push).toHaveBeenCalledWith('/pin-login');
  });

  it('removes ONLY session-sensitive localStorage keys', () => {
    // Plant a mix of keys.
    const planted: Record<string, string> = {
      '@auth_tokens_test-business1': '{"accessToken":"jwt"}',
      '@catalog_v1': '{}',
      '@multicart_drafts': '[]',
      '@settings_appearance': '{}',
      // these must SURVIVE — they're how the next sign-in finds the store
      '@tenant_data': '{"slug":"test-business1","name":"Test Business1"}',
      '@tenant_id': 'test-business1',
      '@last_identifier_test-business1': 'owner@example.com',
      '@groone:last_login': '{"tenantSlug":"test-business1","identifier":"owner@example.com"}',
      i18nextLng: 'te',
      unrelated_key: 'x',
    };
    for (const [k, v] of Object.entries(planted)) window.localStorage.setItem(k, v);

    performLogout(dispatch as any, router);

    // Removed
    for (const k of [
      '@auth_tokens_test-business1',
      '@catalog_v1',
      '@multicart_drafts',
      '@settings_appearance',
    ]) {
      expect(window.localStorage.getItem(k)).toBeNull();
    }

    // Preserved
    expect(window.localStorage.getItem('@tenant_data')).toBe(planted['@tenant_data']);
    expect(window.localStorage.getItem('@tenant_id')).toBe(planted['@tenant_id']);
    expect(window.localStorage.getItem('@last_identifier_test-business1')).toBe(
      planted['@last_identifier_test-business1'],
    );
    expect(window.localStorage.getItem('@groone:last_login')).toBe(planted['@groone:last_login']);
    expect(window.localStorage.getItem('i18nextLng')).toBe(planted.i18nextLng);
    expect(window.localStorage.getItem('unrelated_key')).toBe(planted.unrelated_key);
  });

  it('is a no-op (besides dispatch + route) when localStorage is empty', () => {
    performLogout(dispatch as any, router);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledTimes(1);
    // No throw, no surprise.
  });
});

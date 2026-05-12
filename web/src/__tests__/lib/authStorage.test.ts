/**
 * @jest-environment jsdom
 */

import {
  savePersistedTokens,
  loadPersistedTokens,
  clearPersistedTokens,
  saveLastIdentifier,
  loadLastIdentifier,
} from '@/lib/auth/authStorage';

describe('authStorage — tenant-namespaced persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips tokens for a single tenant', () => {
    savePersistedTokens('freshmart', {
      accessToken: 'a-1',
      refreshToken: 'r-1',
      tenantSlug: 'freshmart',
    });
    const loaded = loadPersistedTokens('freshmart');
    expect(loaded).toEqual({
      accessToken: 'a-1',
      refreshToken: 'r-1',
      tenantSlug: 'freshmart',
    });
  });

  it('does NOT leak tenant A tokens into a tenant B lookup', () => {
    savePersistedTokens('freshmart', {
      accessToken: 'fm-access',
      refreshToken: 'fm-refresh',
      tenantSlug: 'freshmart',
    });
    expect(loadPersistedTokens('quickbasket')).toBeNull();
  });

  it('defensively rejects tokens whose embedded tenantSlug does not match the namespace', () => {
    // Simulate hand-crafted localStorage entry with a forged tenantSlug.
    window.localStorage.setItem(
      '@auth_tokens_freshmart',
      JSON.stringify({
        accessToken: 'forged',
        refreshToken: 'forged',
        tenantSlug: 'quickbasket', // claims a different tenant
      }),
    );
    expect(loadPersistedTokens('freshmart')).toBeNull();
  });

  it('returns null for missing tenant', () => {
    expect(loadPersistedTokens('missing')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    window.localStorage.setItem('@auth_tokens_freshmart', '{not-json');
    expect(loadPersistedTokens('freshmart')).toBeNull();
  });

  it('clears only the named tenant', () => {
    savePersistedTokens('freshmart', { accessToken: 'a', refreshToken: 'r', tenantSlug: 'freshmart' });
    savePersistedTokens('quickbasket', { accessToken: 'a', refreshToken: 'r', tenantSlug: 'quickbasket' });
    clearPersistedTokens('freshmart');
    expect(loadPersistedTokens('freshmart')).toBeNull();
    expect(loadPersistedTokens('quickbasket')).not.toBeNull();
  });

  it('round-trips the last identifier per tenant', () => {
    saveLastIdentifier('freshmart', 'admin@freshmart.com');
    saveLastIdentifier('quickbasket', 'owner@quickbasket.com');
    expect(loadLastIdentifier('freshmart')).toBe('admin@freshmart.com');
    expect(loadLastIdentifier('quickbasket')).toBe('owner@quickbasket.com');
  });
});

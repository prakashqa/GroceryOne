/**
 * Base API Tests
 * TDD tests for tenant route guard and isTenantRequired utility
 */
/* eslint-disable @typescript-eslint/no-var-requires */

// Mock SecureStore-backed auth storage BEFORE importing baseApi (which
// imports PinSecureStorage at module top).
jest.mock('../../../features/pinAuth/services/PinSecureStorage', () => ({
  PinSecureStorage: {
    getAuthContext: jest.fn(),
  },
}));

import { isTenantRequired, resolveAccessToken } from '../baseApi';
import { PinSecureStorage } from '../../../features/pinAuth/services/PinSecureStorage';

const mockedGetAuthContext = PinSecureStorage.getAuthContext as jest.MockedFunction<
  typeof PinSecureStorage.getAuthContext
>;

describe('isTenantRequired', () => {
  describe('routes that require tenant', () => {
    it('should return true for /carts', () => {
      expect(isTenantRequired('/carts')).toBe(true);
    });

    it('should return true for /carts/active', () => {
      expect(isTenantRequired('/carts/active')).toBe(true);
    });

    it('should return true for /users/settings', () => {
      expect(isTenantRequired('/users/settings')).toBe(true);
    });

    it('should return true for /orders', () => {
      expect(isTenantRequired('/orders')).toBe(true);
    });

    it('should return true for /categories (tenant-scoped)', () => {
      expect(isTenantRequired('/categories')).toBe(true);
    });

    it('should return true for /categories/count (tenant-scoped)', () => {
      expect(isTenantRequired('/categories/count')).toBe(true);
    });

    it('should return true for /items (tenant-scoped)', () => {
      expect(isTenantRequired('/items')).toBe(true);
    });

    it('should return true for /products (tenant-scoped)', () => {
      expect(isTenantRequired('/products')).toBe(true);
    });

    it('should return true for /products/featured (tenant-scoped)', () => {
      expect(isTenantRequired('/products/featured')).toBe(true);
    });
  });

  describe('routes that do NOT require tenant (backend skips)', () => {
    it('should return false for /health', () => {
      expect(isTenantRequired('/health')).toBe(false);
    });

    it('should return false for /seed', () => {
      expect(isTenantRequired('/seed')).toBe(false);
    });
  });

  describe('auth routes should NOT require tenant', () => {
    it('should return false for /auth/refresh', () => {
      expect(isTenantRequired('/auth/refresh')).toBe(false);
    });

    it('should return false for /auth/login', () => {
      expect(isTenantRequired('/auth/login')).toBe(false);
    });

    it('should return false for /auth/login/pin', () => {
      expect(isTenantRequired('/auth/login/pin')).toBe(false);
    });
  });
});

// Regression: at app launch, RTK Query requests can fire BEFORE the auth
// slice has hydrated from SecureStore. Without a SecureStore fallback the
// outgoing request has no Authorization header → backend 401 → the user
// sees stale cached data or a forced logout. resolveAccessToken patches
// that race.
describe('resolveAccessToken', () => {
  beforeEach(() => {
    mockedGetAuthContext.mockReset();
  });

  it('returns the Redux token immediately when present (no SecureStore lookup)', async () => {
    const result = await resolveAccessToken('redux-token-xyz');
    expect(result).toBe('redux-token-xyz');
    expect(mockedGetAuthContext).not.toHaveBeenCalled();
  });

  it('falls back to SecureStore when Redux token is null (Redux not yet hydrated)', async () => {
    mockedGetAuthContext.mockResolvedValue({
      user: { id: 'u1' },
      accessToken: 'persisted-token-abc',
      refreshToken: 'persisted-refresh',
    });

    const result = await resolveAccessToken(null);

    expect(result).toBe('persisted-token-abc');
    expect(mockedGetAuthContext).toHaveBeenCalledTimes(1);
  });

  it('falls back to SecureStore when Redux token is undefined', async () => {
    mockedGetAuthContext.mockResolvedValue({
      user: { id: 'u1' },
      accessToken: 'persisted-token-abc',
      refreshToken: 'persisted-refresh',
    });

    const result = await resolveAccessToken(undefined);
    expect(result).toBe('persisted-token-abc');
  });

  it('returns null when neither Redux nor SecureStore has a token', async () => {
    mockedGetAuthContext.mockResolvedValue(null);
    const result = await resolveAccessToken(null);
    expect(result).toBeNull();
  });

  it('returns null and logs when SecureStore throws', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetAuthContext.mockRejectedValue(new Error('keychain locked'));

    const result = await resolveAccessToken(null);

    expect(result).toBeNull();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('prefers a fresh Redux token over a stale SecureStore token', async () => {
    // Reflects the post-refresh state where Redux has the new token but
    // SecureStore still has the old one until the next persist.
    mockedGetAuthContext.mockResolvedValue({
      user: { id: 'u1' },
      accessToken: 'stale-persisted-token',
      refreshToken: 'stale-refresh',
    });

    const result = await resolveAccessToken('fresh-redux-token');

    expect(result).toBe('fresh-redux-token');
    expect(mockedGetAuthContext).not.toHaveBeenCalled();
  });
});

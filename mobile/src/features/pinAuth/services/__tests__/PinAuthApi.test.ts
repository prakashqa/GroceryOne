/**
 * PinAuthApi Tests
 * Tests network error handling for resolveTenant and verifyPin
 */

import { PinAuthApi } from '../PinAuthApi';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Ensure __DEV__ is true for dev-mode error messages
(global as any).__DEV__ = true;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('PinAuthApi', () => {
  describe('resolveTenant', () => {
    it('should return user-friendly error when server is unreachable', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

      const result = await PinAuthApi.resolveTenant('admin@quickbasket.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server unreachable');
      expect(result.error).toContain('backend is running');
    });

    it('should include URL in dev mode network error', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

      const result = await PinAuthApi.resolveTenant('admin@quickbasket.com');

      expect(result.success).toBe(false);
      // In __DEV__ mode, the error should include the API URL for debugging
      expect(result.error).toMatch(/http:\/\//);
    });

    it('should handle Failed to fetch error the same way', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await PinAuthApi.resolveTenant('admin@quickbasket.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server unreachable');
    });

    it('should return successful result when server responds correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            tenantSlug: 'quickbasket',
            tenantName: 'Quick Basket',
            userFirstName: 'Admin',
          },
        }),
      });

      const result = await PinAuthApi.resolveTenant('admin@quickbasket.com');

      expect(result.success).toBe(true);
      expect(result.data?.tenantSlug).toBe('quickbasket');
    });

    it('should return timeout error when request times out', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await PinAuthApi.resolveTenant('admin@quickbasket.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });
  });

  describe('verifyPin', () => {
    it('should return user-friendly error when server is unreachable', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

      const result = await PinAuthApi.verifyPin({
        identifier: 'admin@quickbasket.com',
        pin: '1234',
        tenantSlug: 'quickbasket',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server unreachable');
      expect(result.error).toContain('backend is running');
    });

    it('should return successful result when credentials are valid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
            expiresIn: 3600,
            user: {
              id: 'user-1',
              email: 'admin@quickbasket.com',
              role: 'admin',
            },
          },
        }),
      });

      const result = await PinAuthApi.verifyPin({
        identifier: 'admin@quickbasket.com',
        pin: '1234',
        tenantSlug: 'quickbasket',
      });

      expect(result.success).toBe(true);
      expect(result.data?.accessToken).toBe('mock-token');
    });
  });
});

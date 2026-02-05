/**
 * Base API Tests
 * TDD tests for tenant route guard and isTenantRequired utility
 */

import { isTenantRequired } from '../baseApi';

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

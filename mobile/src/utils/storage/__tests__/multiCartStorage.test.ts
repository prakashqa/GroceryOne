/**
 * Multi-Cart Storage Tests
 * TDD tests for tenant-scoped cart storage isolation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveMultiCartState,
  loadMultiCartState,
  clearMultiCartState,
  savePendingSyncQueue,
  loadPendingSyncQueue,
  clearPendingSyncQueue,
  getTenantCartKey,
  getTenantSyncQueueKey,
} from '../multiCartStorage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('multiCartStorage', () => {
  const TENANT_A = 'tenant-alpha';
  const TENANT_B = 'tenant-beta';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('tenant-scoped key builders', () => {
    it('getTenantCartKey should return tenant-scoped key', () => {
      expect(getTenantCartKey('my-tenant')).toBe('@groceryone/multi_cart/my-tenant');
    });

    it('getTenantSyncQueueKey should return tenant-scoped key', () => {
      expect(getTenantSyncQueueKey('my-tenant')).toBe('@groceryone/pending_cart_sync/my-tenant');
    });

    it('should produce different keys for different tenants', () => {
      expect(getTenantCartKey(TENANT_A)).not.toBe(getTenantCartKey(TENANT_B));
      expect(getTenantSyncQueueKey(TENANT_A)).not.toBe(getTenantSyncQueueKey(TENANT_B));
    });
  });

  describe('saveMultiCartState', () => {
    const mockState = {
      carts: [
        {
          id: 'cart-1',
          name: 'Test Cart',
          items: [],
          status: 'draft' as const,
          createdAt: '2026-01-30T00:00:00.000Z',
          updatedAt: '2026-01-30T00:00:00.000Z',
        },
      ],
      activeCartId: 'cart-1',
      isHydrated: true,
      lastSyncedAt: null,
    };

    it('should save to tenant-scoped key', async () => {
      await saveMultiCartState(mockState, TENANT_A);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        getTenantCartKey(TENANT_A),
        expect.any(String)
      );
    });

    it('should save different data for different tenants', async () => {
      await saveMultiCartState(mockState, TENANT_A);
      await saveMultiCartState(mockState, TENANT_B);

      const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      expect(calls[0][0]).toBe(getTenantCartKey(TENANT_A));
      expect(calls[1][0]).toBe(getTenantCartKey(TENANT_B));
    });
  });

  describe('loadMultiCartState', () => {
    it('should load from tenant-scoped key', async () => {
      await loadMultiCartState(TENANT_A);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        getTenantCartKey(TENANT_A)
      );
    });

    it('should return null when no data exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await loadMultiCartState(TENANT_A);

      expect(result).toBeNull();
    });

    it('should return parsed data when it exists', async () => {
      const mockPersisted = {
        carts: [{ id: 'cart-1', name: 'Cart' }],
        activeCartId: 'cart-1',
        lastSyncedAt: '2026-01-30T00:00:00.000Z',
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockPersisted)
      );

      const result = await loadMultiCartState(TENANT_A);

      expect(result).not.toBeNull();
      expect(result!.activeCartId).toBe('cart-1');
    });
  });

  describe('clearMultiCartState', () => {
    it('should clear tenant-scoped key', async () => {
      await clearMultiCartState(TENANT_A);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        getTenantCartKey(TENANT_A)
      );
    });

    it('should only clear the specified tenant', async () => {
      await clearMultiCartState(TENANT_A);

      expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith(
        getTenantCartKey(TENANT_B)
      );
    });
  });

  describe('tenant data isolation', () => {
    it('tenant A data should not be accessible to tenant B', async () => {
      // Save data for tenant A
      const tenantAState = {
        carts: [
          {
            id: 'cart-a',
            name: 'Tenant A Cart',
            items: [],
            status: 'draft' as const,
            createdAt: '2026-01-30T00:00:00.000Z',
            updatedAt: '2026-01-30T00:00:00.000Z',
          },
        ],
        activeCartId: 'cart-a',
        isHydrated: true,
        lastSyncedAt: null,
      };
      await saveMultiCartState(tenantAState, TENANT_A);

      // Load data for tenant B (should be null since nothing was saved for B)
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const tenantBData = await loadMultiCartState(TENANT_B);

      expect(tenantBData).toBeNull();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(getTenantCartKey(TENANT_B));
    });
  });

  describe('pending sync queue - tenant scoping', () => {
    it('should save sync queue to tenant-scoped key', async () => {
      const queue = [
        {
          localId: 'cart-1',
          name: 'Cart 1',
          status: 'draft',
          createdAt: '2026-01-30T00:00:00.000Z',
          retryCount: 0,
          lastAttempt: '2026-01-30T00:00:00.000Z',
        },
      ];

      await savePendingSyncQueue(queue, TENANT_A);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        getTenantSyncQueueKey(TENANT_A),
        expect.any(String)
      );
    });

    it('should load sync queue from tenant-scoped key', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await loadPendingSyncQueue(TENANT_A);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        getTenantSyncQueueKey(TENANT_A)
      );
      expect(result).toEqual([]);
    });

    it('should clear sync queue from tenant-scoped key', async () => {
      await clearPendingSyncQueue(TENANT_A);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        getTenantSyncQueueKey(TENANT_A)
      );
    });
  });
});

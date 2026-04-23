/**
 * Price Utilities Tests
 */

import {
  getItemPrice,
  getItemPriceById,
  getItemPriceByName,
  calculateItemTotal,
  getHardcodedItemPrice,
} from '../priceUtils';
import type { Item } from '../../types/picking';

describe('priceUtils', () => {
  const mockItems: Item[] = [
    {
      id: 'sp-001',
      categoryId: 'spices',
      name: 'Cumin Seeds',
      unit: 'gm',
      defaultQuantity: 250,
      price: 85,
    },
    {
      id: 'gf-001',
      categoryId: 'grains-flour',
      name: 'Wheat Flour / Atta',
      unit: 'kg',
      defaultQuantity: 5,
      price: 48,
    },
    {
      id: 'rc-001',
      categoryId: 'rice',
      name: 'Basmati Rice',
      unit: 'kg',
      defaultQuantity: 5,
      price: 140,
    },
  ];

  describe('getItemPrice', () => {
    it('should return price when item ID matches', () => {
      const price = getItemPrice('sp-001', 'Cumin Seeds', mockItems);
      expect(price).toBe(85);
    });

    it('should fallback to name match when ID does not match', () => {
      const price = getItemPrice('unknown-id', 'Cumin Seeds', mockItems);
      expect(price).toBe(85);
    });

    it('should return undefined when neither ID nor name matches', () => {
      const price = getItemPrice('unknown-id', 'Unknown Item', mockItems);
      expect(price).toBeUndefined();
    });

    it('should handle case-insensitive name matching', () => {
      const price = getItemPrice('unknown-id', 'CUMIN SEEDS', mockItems);
      expect(price).toBe(85);
    });
  });

  describe('getItemPriceById', () => {
    it('should return price when item ID matches', () => {
      const price = getItemPriceById('sp-001', mockItems);
      expect(price).toBe(85);
    });

    it('should return undefined when ID does not match', () => {
      const price = getItemPriceById('unknown-id', mockItems);
      expect(price).toBeUndefined();
    });
  });

  describe('getItemPriceByName', () => {
    it('should return price when item name matches', () => {
      const price = getItemPriceByName('Cumin Seeds', mockItems);
      expect(price).toBe(85);
    });

    it('should handle case-insensitive matching', () => {
      const price = getItemPriceByName('cumin seeds', mockItems);
      expect(price).toBe(85);
    });

    it('should return undefined when name does not match', () => {
      const price = getItemPriceByName('Unknown Item', mockItems);
      expect(price).toBeUndefined();
    });
  });

  describe('calculateItemTotal', () => {
    it('should calculate total correctly', () => {
      const total = calculateItemTotal(48, 5);
      expect(total).toBe(240);
    });

    it('should return 0 when price is undefined', () => {
      const total = calculateItemTotal(undefined, 5);
      expect(total).toBe(0);
    });
  });

  describe('getHardcodedItemPrice (tenant-safety stub)', () => {
    // This function used to carry ~100 hardcoded FreshMart-slug prices and
    // was a cross-tenant leakage vector: a QuickBasket/VijayParcelPOS user
    // whose cached catalog was missing a price could be silently served
    // a FreshMart price by slug/name collision, and backend deletions
    // (e.g. the Spices purge) could never fully propagate to offline
    // clients. The function is now a permanent stub — prices MUST come
    // from the tenant-scoped catalog (API or AsyncStorage cache). These
    // tests lock the stub shape so hardcoded tables can never be
    // re-introduced without a deliberate review.

    it('should return undefined for any FreshMart slug (source-of-truth lives in tenant catalog)', () => {
      expect(getHardcodedItemPrice('gf-001', 'Wheat Flour / Atta')).toBeUndefined();
      expect(getHardcodedItemPrice('rc-001', 'Basmati Rice')).toBeUndefined();
      expect(getHardcodedItemPrice('dl-001', 'Toor Dal / Arhar Dal')).toBeUndefined();
      expect(getHardcodedItemPrice('ol-001', 'Sunflower Oil')).toBeUndefined();
    });

    it('should return undefined for other tenants\' slugs (no cross-tenant leakage)', () => {
      // QuickBasket, VijayParcelPOS, ABTrade slug namespaces must also
      // miss — the previous fallback only carried freshmart-style slugs,
      // which meant non-freshmart tenants never benefited AND were at
      // risk of serving a freshmart price on a name collision.
      expect(getHardcodedItemPrice('qb-dy-001', 'Full Cream Milk')).toBeUndefined();
      expect(getHardcodedItemPrice('vp-ch-001', 'Chicken Fry')).toBeUndefined();
      expect(getHardcodedItemPrice('ab-stp-001', 'Sona Masoori / Ponni Rice')).toBeUndefined();
    });

    it('should return undefined for unknown ids and names', () => {
      expect(getHardcodedItemPrice('unknown-id', 'Unknown Item')).toBeUndefined();
      expect(getHardcodedItemPrice('', '')).toBeUndefined();
    });

    it('should return undefined for previously-removed Spices (regression guard)', () => {
      // Spices were deleted from all tenants; the hardcoded fallback
      // used to serve stale sp-* prices even after the backend purge.
      expect(getHardcodedItemPrice('sp-001', 'Cumin Seeds')).toBeUndefined();
      expect(getHardcodedItemPrice('sp-025', 'Asafoetida (Hing)')).toBeUndefined();
    });
  });
});

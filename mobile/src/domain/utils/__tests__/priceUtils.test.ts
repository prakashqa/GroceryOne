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

  describe('getHardcodedItemPrice', () => {
    it('should return price for a known item by ID', () => {
      const price = getHardcodedItemPrice('gf-001', 'Wheat Flour / Atta');
      expect(price).toBe(48);
    });

    it('should return price for Cumin Seeds by ID', () => {
      const price = getHardcodedItemPrice('sp-001', 'Cumin Seeds');
      expect(price).toBe(85);
    });

    it('should fallback to name match when ID does not match', () => {
      const price = getHardcodedItemPrice('unknown-id', 'Wheat Flour / Atta');
      expect(price).toBe(48);
    });

    it('should handle case-insensitive name matching', () => {
      const price = getHardcodedItemPrice('unknown-id', 'wheat flour / atta');
      expect(price).toBe(48);
    });

    it('should return undefined for unknown items', () => {
      const price = getHardcodedItemPrice('unknown-id', 'Unknown Item');
      expect(price).toBeUndefined();
    });

    it('should return price for Basmati Rice', () => {
      const price = getHardcodedItemPrice('rc-001', 'Basmati Rice');
      expect(price).toBe(140);
    });

    it('should return price for Toor Dal', () => {
      const price = getHardcodedItemPrice('dl-001', 'Toor Dal / Arhar Dal');
      expect(price).toBe(160);
    });

    it('should return price for Sunflower Oil', () => {
      const price = getHardcodedItemPrice('ol-001', 'Sunflower Oil');
      expect(price).toBe(145);
    });
  });
});

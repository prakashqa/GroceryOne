/**
 * Tests for reportCalculations
 * Following TDD: Write tests first, then implement
 */

import {
  calculateReportMetrics,
  calculateSalesTrend,
  calculateTopProducts,
  calculateCategoryBreakdown,
  filterCartsByDateRange,
} from '../reportCalculations';
import { DateRange } from '../../types/reports.types';
import { ManagedCart, CartItemState, Category } from '../../../../domain/types/picking';

describe('reportCalculations', () => {
  // Test fixtures — use UUID-style IDs to match production data from the backend
  const CAT_GRAINS = '550e8400-0001-0000-0000-000000000001';
  const CAT_RICE = '550e8400-0001-0000-0000-000000000002';
  const CAT_VEGETABLES = '550e8400-0001-0000-0000-000000000003';

  const mockCategories: Category[] = [
    { id: CAT_GRAINS, name: 'Grains & Flour', icon: '🌾' },
    { id: CAT_RICE, name: 'Rice', icon: '🍚' },
    { id: CAT_VEGETABLES, name: 'Vegetables', icon: '🥬' },
  ];

  const createMockCartItem = (
    itemId: string,
    categoryId: string,
    name: string,
    quantity: number,
    priceSnapshot: number
  ): CartItemState => ({
    item: {
      id: itemId,
      categoryId,
      name,
      unit: 'kg',
      defaultQuantity: 1,
      price: priceSnapshot,
    },
    quantity,
    addedAt: '2024-01-15T10:00:00.000Z',
    priceSnapshot,
  });

  const createMockCart = (
    id: string,
    status: 'draft' | 'printed' | 'paid' | 'completed',
    items: CartItemState[],
    createdAt: string,
    paidAmount?: number
  ): ManagedCart => ({
    id,
    name: `Cart ${id}`,
    items,
    createdAt,
    updatedAt: createdAt,
    status,
    paidAt: status === 'paid' ? createdAt : undefined,
    paidAmount,
  });

  const dateRange: DateRange = {
    startDate: '2024-01-10T00:00:00.000Z',
    endDate: '2024-01-20T23:59:59.999Z',
    preset: 'custom',
  };

  describe('filterCartsByDateRange', () => {
    const carts: ManagedCart[] = [
      createMockCart('1', 'paid', [], '2024-01-09T12:00:00.000Z'), // Before range
      createMockCart('2', 'paid', [], '2024-01-10T00:00:00.000Z'), // Start of range
      createMockCart('3', 'paid', [], '2024-01-15T12:00:00.000Z'), // In range
      createMockCart('4', 'paid', [], '2024-01-20T23:59:59.999Z'), // End of range
      createMockCart('5', 'paid', [], '2024-01-21T00:00:00.000Z'), // After range
    ];

    it('should filter carts within date range', () => {
      const result = filterCartsByDateRange(carts, dateRange);

      expect(result).toHaveLength(3);
      expect(result.map(c => c.id)).toEqual(['2', '3', '4']);
    });

    it('should include carts on start date (inclusive)', () => {
      const result = filterCartsByDateRange(carts, dateRange);

      expect(result.find(c => c.id === '2')).toBeDefined();
    });

    it('should include carts on end date (inclusive)', () => {
      const result = filterCartsByDateRange(carts, dateRange);

      expect(result.find(c => c.id === '4')).toBeDefined();
    });

    it('should exclude carts before range', () => {
      const result = filterCartsByDateRange(carts, dateRange);

      expect(result.find(c => c.id === '1')).toBeUndefined();
    });

    it('should exclude carts after range', () => {
      const result = filterCartsByDateRange(carts, dateRange);

      expect(result.find(c => c.id === '5')).toBeUndefined();
    });

    it('should return empty array when no carts match', () => {
      const emptyRange: DateRange = {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-31T23:59:59.999Z',
        preset: 'custom',
      };

      const result = filterCartsByDateRange(carts, emptyRange);

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateReportMetrics', () => {
    it('should calculate total sales from paid carts only', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 2, 100),
        ], '2024-01-15T10:00:00.000Z', 200),
        createMockCart('2', 'draft', [
          createMockCartItem('item2', CAT_RICE, 'Rice', 1, 50),
        ], '2024-01-15T11:00:00.000Z'),
        createMockCart('3', 'paid', [
          createMockCartItem('item3', CAT_GRAINS, 'Flour', 3, 30),
        ], '2024-01-15T12:00:00.000Z', 90),
      ];

      const result = calculateReportMetrics(carts);

      expect(result.totalSales).toBe(290); // 200 + 90
    });

    it('should count total carts', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [], '2024-01-15T10:00:00.000Z', 100),
        createMockCart('2', 'draft', [], '2024-01-15T11:00:00.000Z'),
        createMockCart('3', 'paid', [], '2024-01-15T12:00:00.000Z', 50),
      ];

      const result = calculateReportMetrics(carts);

      expect(result.totalCarts).toBe(3);
    });

    it('should count unique items sold', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 2, 100),
          createMockCartItem('item2', CAT_RICE, 'Rice', 1, 50),
        ], '2024-01-15T10:00:00.000Z', 250),
        createMockCart('2', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 1, 100), // Same item
          createMockCartItem('item3', CAT_VEGETABLES, 'Potato', 2, 35),
        ], '2024-01-15T11:00:00.000Z', 170),
      ];

      const result = calculateReportMetrics(carts);

      expect(result.totalItemsSold).toBe(3); // item1, item2, item3
    });

    it('should calculate total quantity sold', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 2, 100),
          createMockCartItem('item2', CAT_RICE, 'Rice', 3, 50),
        ], '2024-01-15T10:00:00.000Z', 350),
      ];

      const result = calculateReportMetrics(carts);

      expect(result.totalQuantitySold).toBe(5); // 2 + 3
    });

    it('should calculate average cart value', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 1, 100),
        ], '2024-01-15T10:00:00.000Z', 100),
        createMockCart('2', 'paid', [
          createMockCartItem('item2', CAT_RICE, 'Rice', 1, 200),
        ], '2024-01-15T11:00:00.000Z', 200),
      ];

      const result = calculateReportMetrics(carts);

      expect(result.averageCartValue).toBe(150); // (100 + 200) / 2
    });

    it('should count paid vs unpaid carts', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [createMockCartItem('i1', CAT_GRAINS, 'W', 1, 10)], '2024-01-15T10:00:00.000Z', 10),
        createMockCart('2', 'draft', [createMockCartItem('i2', CAT_RICE, 'R', 1, 20)], '2024-01-15T11:00:00.000Z'),
        createMockCart('3', 'paid', [createMockCartItem('i3', CAT_GRAINS, 'F', 1, 30)], '2024-01-15T12:00:00.000Z', 30),
        createMockCart('4', 'printed', [createMockCartItem('i4', CAT_VEGETABLES, 'P', 1, 40)], '2024-01-15T13:00:00.000Z'),
      ];

      const result = calculateReportMetrics(carts);

      expect(result.paidCartsCount).toBe(2);
      expect(result.unpaidCartsCount).toBe(2);
    });

    it('should return zero metrics for empty carts', () => {
      const result = calculateReportMetrics([]);

      expect(result.totalSales).toBe(0);
      expect(result.totalCarts).toBe(0);
      expect(result.totalItemsSold).toBe(0);
      expect(result.totalQuantitySold).toBe(0);
      expect(result.averageCartValue).toBe(0);
      expect(result.paidCartsCount).toBe(0);
      expect(result.unpaidCartsCount).toBe(0);
    });
  });

  describe('calculateSalesTrend', () => {
    // Use local time dates for consistent testing
    const rangeStart = new Date(2024, 0, 13, 0, 0, 0, 0);
    const rangeEnd = new Date(2024, 0, 15, 23, 59, 59, 999);
    const trendRange: DateRange = {
      startDate: rangeStart.toISOString(),
      endDate: rangeEnd.toISOString(),
      preset: 'custom',
    };

    it('should group sales by day', () => {
      // Create carts with local time dates
      const cart1Date = new Date(2024, 0, 13, 10, 0, 0);
      const cart2Date = new Date(2024, 0, 13, 14, 0, 0);
      const cart3Date = new Date(2024, 0, 15, 10, 0, 0);

      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 1, 100),
        ], cart1Date.toISOString(), 100),
        createMockCart('2', 'paid', [
          createMockCartItem('item2', CAT_RICE, 'Rice', 1, 150),
        ], cart2Date.toISOString(), 150),
        createMockCart('3', 'paid', [
          createMockCartItem('item3', CAT_VEGETABLES, 'Potato', 1, 200),
        ], cart3Date.toISOString(), 200),
      ];

      const result = calculateSalesTrend(carts, trendRange);

      expect(result).toHaveLength(3); // 3 days in range
      expect(result[0].sales).toBe(250); // Jan 13: 100 + 150
      expect(result[1].sales).toBe(0);   // Jan 14: no sales
      expect(result[2].sales).toBe(200); // Jan 15: 200
    });

    it('should include cart count per day', () => {
      const cart1Date = new Date(2024, 0, 13, 10, 0, 0);
      const cart2Date = new Date(2024, 0, 13, 14, 0, 0);
      const cart3Date = new Date(2024, 0, 15, 10, 0, 0);

      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [], cart1Date.toISOString(), 100),
        createMockCart('2', 'paid', [], cart2Date.toISOString(), 150),
        createMockCart('3', 'paid', [], cart3Date.toISOString(), 200),
      ];

      const result = calculateSalesTrend(carts, trendRange);

      expect(result[0].cartCount).toBe(2); // Jan 13
      expect(result[1].cartCount).toBe(0); // Jan 14
      expect(result[2].cartCount).toBe(1); // Jan 15
    });

    it('should include formatted labels', () => {
      const carts: ManagedCart[] = [];
      const result = calculateSalesTrend(carts, trendRange);

      expect(result[0].label).toBeDefined();
      expect(typeof result[0].label).toBe('string');
    });

    it('should only count paid carts for sales', () => {
      const cart1Date = new Date(2024, 0, 15, 10, 0, 0);
      const cart2Date = new Date(2024, 0, 15, 14, 0, 0);

      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [], cart1Date.toISOString(), 100),
        createMockCart('2', 'draft', [], cart2Date.toISOString()),
      ];

      const result = calculateSalesTrend(carts, trendRange);

      expect(result[2].sales).toBe(100); // Only paid cart
      expect(result[2].cartCount).toBe(2); // Both carts counted for cart count
    });
  });

  describe('calculateTopProducts', () => {
    it('should return products sorted by revenue descending', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 2, 100), // 200
          createMockCartItem('item2', CAT_RICE, 'Rice', 1, 500), // 500
        ], '2024-01-15T10:00:00.000Z', 700),
        createMockCart('2', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 1, 100), // 100
        ], '2024-01-15T11:00:00.000Z', 100),
      ];

      const result = calculateTopProducts(carts, mockCategories);

      expect(result[0].itemId).toBe('item2'); // Rice: 500 revenue
      expect(result[1].itemId).toBe('item1'); // Wheat: 300 revenue
    });

    it('should aggregate quantities across carts', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 2, 100),
        ], '2024-01-15T10:00:00.000Z', 200),
        createMockCart('2', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 3, 100),
        ], '2024-01-15T11:00:00.000Z', 300),
      ];

      const result = calculateTopProducts(carts, mockCategories);

      expect(result[0].quantity).toBe(5); // 2 + 3
      expect(result[0].revenue).toBe(500); // 200 + 300
    });

    it('should count cart appearances', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 1, 100),
        ], '2024-01-15T10:00:00.000Z', 100),
        createMockCart('2', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 1, 100),
        ], '2024-01-15T11:00:00.000Z', 100),
        createMockCart('3', 'paid', [
          createMockCartItem('item2', CAT_RICE, 'Rice', 1, 50),
        ], '2024-01-15T12:00:00.000Z', 50),
      ];

      const result = calculateTopProducts(carts, mockCategories);
      const wheat = result.find(p => p.itemId === 'item1');

      expect(wheat?.cartAppearances).toBe(2);
    });

    it('should limit results to specified count', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'A', 1, 100),
          createMockCartItem('item2', CAT_RICE, 'B', 1, 200),
          createMockCartItem('item3', CAT_VEGETABLES, 'C', 1, 300),
        ], '2024-01-15T10:00:00.000Z', 600),
      ];

      const result = calculateTopProducts(carts, mockCategories, 2);

      expect(result).toHaveLength(2);
    });

    it('should include category information', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 1, 100),
        ], '2024-01-15T10:00:00.000Z', 100),
      ];

      const result = calculateTopProducts(carts, mockCategories);

      expect(result[0].categoryId).toBe(CAT_GRAINS);
      expect(result[0].categoryName).toBe('Grains & Flour');
    });

    it('should only include items from paid carts', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 1, 100),
        ], '2024-01-15T10:00:00.000Z', 100),
        createMockCart('2', 'draft', [
          createMockCartItem('item2', CAT_RICE, 'Rice', 10, 1000), // High value but draft
        ], '2024-01-15T11:00:00.000Z'),
      ];

      const result = calculateTopProducts(carts, mockCategories);

      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe('item1');
    });
  });

  describe('calculateCategoryBreakdown', () => {
    it('should group sales by category', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 2, 100), // 200
          createMockCartItem('item2', CAT_RICE, 'Rice', 1, 150), // 150
        ], '2024-01-15T10:00:00.000Z', 350),
        createMockCart('2', 'paid', [
          createMockCartItem('item3', CAT_GRAINS, 'Flour', 1, 50), // 50
        ], '2024-01-15T11:00:00.000Z', 50),
      ];

      const result = calculateCategoryBreakdown(carts, mockCategories);

      const grainsCategory = result.find(c => c.categoryId === CAT_GRAINS);
      const riceCategory = result.find(c => c.categoryId === CAT_RICE);

      expect(grainsCategory?.totalRevenue).toBe(250); // 200 + 50
      expect(riceCategory?.totalRevenue).toBe(150);
    });

    it('should calculate percentage of total', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 1, 100), // 100
          createMockCartItem('item2', CAT_RICE, 'Rice', 1, 100), // 100
        ], '2024-01-15T10:00:00.000Z', 200),
      ];

      const result = calculateCategoryBreakdown(carts, mockCategories);

      expect(result[0].percentage).toBeCloseTo(50, 1);
      expect(result[1].percentage).toBeCloseTo(50, 1);
    });

    it('should include category metadata', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 1, 100),
        ], '2024-01-15T10:00:00.000Z', 100),
      ];

      const result = calculateCategoryBreakdown(carts, mockCategories);

      expect(result[0].categoryName).toBe('Grains & Flour');
      expect(result[0].categoryIcon).toBe('🌾');
    });

    it('should calculate total quantity per category', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 2, 100),
          createMockCartItem('item2', CAT_GRAINS, 'Flour', 3, 50),
        ], '2024-01-15T10:00:00.000Z', 350),
      ];

      const result = calculateCategoryBreakdown(carts, mockCategories);
      const grainsCategory = result.find(c => c.categoryId === CAT_GRAINS);

      expect(grainsCategory?.totalQuantity).toBe(5); // 2 + 3
    });

    it('should sort by revenue descending', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 1, 100),
          createMockCartItem('item2', CAT_RICE, 'Rice', 1, 300),
          createMockCartItem('item3', CAT_VEGETABLES, 'Potato', 1, 200),
        ], '2024-01-15T10:00:00.000Z', 600),
      ];

      const result = calculateCategoryBreakdown(carts, mockCategories);

      expect(result[0].categoryId).toBe(CAT_RICE); // 300
      expect(result[1].categoryId).toBe(CAT_VEGETABLES); // 200
      expect(result[2].categoryId).toBe(CAT_GRAINS); // 100
    });

    it('should only include items from paid carts', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 1, 100),
        ], '2024-01-15T10:00:00.000Z', 100),
        createMockCart('2', 'draft', [
          createMockCartItem('item2', CAT_RICE, 'Rice', 10, 1000), // Draft - excluded
        ], '2024-01-15T11:00:00.000Z'),
      ];

      const result = calculateCategoryBreakdown(carts, mockCategories);

      expect(result).toHaveLength(1);
      expect(result[0].categoryId).toBe(CAT_GRAINS);
    });

    it('should show Uncategorized when categoryId has no matching category', () => {
      const unknownCategoryId = '550e8400-e29b-41d4-a716-999999999999';

      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', unknownCategoryId, 'Mystery Item', 2, 100),
        ], '2024-01-15T10:00:00.000Z', 200),
      ];

      const result = calculateCategoryBreakdown(carts, mockCategories);

      expect(result[0].categoryName).toBe('Uncategorized');
    });

    it('should resolve category name when categoryId matches UUID-based category IDs', () => {
      const carts: ManagedCart[] = [
        createMockCart('1', 'paid', [
          createMockCartItem('item1', CAT_GRAINS, 'Wheat', 2, 100),
          createMockCartItem('item2', CAT_RICE, 'Basmati Rice', 3, 80),
        ], '2024-01-15T10:00:00.000Z', 440),
      ];

      const result = calculateCategoryBreakdown(carts, mockCategories);

      const grainsCategory = result.find(r => r.categoryId === CAT_GRAINS);
      const riceCategory = result.find(r => r.categoryId === CAT_RICE);

      expect(grainsCategory?.categoryName).toBe('Grains & Flour');
      expect(riceCategory?.categoryName).toBe('Rice');
    });
  });
});

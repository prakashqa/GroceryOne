/**
 * Regression test for the API → Redux mapping used by useCatalogHydration.
 *
 * Bug history: the inline mapping for categories dropped `nameTe`, so the
 * Telugu language switch on /management/categories silently rendered the
 * English `name` even when the backend returned a Telugu translation.
 * Items had `nameTe` mapped correctly; categories did not — an asymmetry
 * easy to re-introduce. These tests pin the contract.
 */

import {
  mapApiCategoriesToStore,
  mapApiItemsToStore,
} from '@/hooks/useCatalogHydration';

describe('mapApiCategoriesToStore', () => {
  it('preserves nameTe so the Telugu language switch can render it', () => {
    const mapped = mapApiCategoriesToStore([
      {
        id: 'cat-uuid-1',
        slug: 'rice',
        name: 'Rice',
        nameTe: 'బియ్యం',
        icon: '🍚',
        trackInventory: false,
      } as any,
    ]);

    expect(mapped).toHaveLength(1);
    expect(mapped[0].nameTe).toBe('బియ్యం');
    expect(mapped[0].name).toBe('Rice');
  });

  it('handles categories without a Telugu translation (nameTe stays undefined)', () => {
    const mapped = mapApiCategoriesToStore([
      {
        id: 'cat-uuid-2',
        slug: 'misc',
        name: 'Misc',
        icon: '📦',
        trackInventory: false,
      } as any,
    ]);

    expect(mapped[0].nameTe).toBeUndefined();
    expect(mapped[0].name).toBe('Misc');
  });

  it('uses backend uuid as backendId and slug as id', () => {
    const mapped = mapApiCategoriesToStore([
      { id: 'cat-uuid-3', slug: 'oils', name: 'Oils', icon: '🫒', trackInventory: false } as any,
    ]);
    expect(mapped[0].backendId).toBe('cat-uuid-3');
    expect(mapped[0].id).toBe('oils');
  });
});

describe('mapApiItemsToStore', () => {
  it('preserves nameTe (regression guard — already worked, but lock it in)', () => {
    const mapped = mapApiItemsToStore([
      {
        id: 'item-1',
        slug: 'basmati',
        name: 'Basmati Rice',
        nameTe: 'బాస్మతి బియ్యం',
        unit: 'kg',
        defaultQuantity: 5,
        price: 140,
        category: { slug: 'rice' },
      } as any,
    ]);
    expect(mapped[0].nameTe).toBe('బాస్మతి బియ్యం');
  });

  it('preserves barcode so scanning, the Product List, and Edit see it', () => {
    // Bug: the mapping dropped `barcode`, so items hydrated from the backend
    // lost their code — rows showed "No barcode", Edit was empty, and the
    // local scan lookup never matched, even when the DB had the barcode.
    const mapped = mapApiItemsToStore([
      {
        id: 'item-1',
        slug: 'basmati',
        name: 'Basmati Rice',
        unit: 'kg',
        defaultQuantity: 5,
        price: 140,
        barcode: '2000000000022',
        category: { slug: 'rice' },
      } as any,
    ]);
    expect(mapped[0].barcode).toBe('2000000000022');
  });

  it('leaves barcode undefined when the item has none', () => {
    const mapped = mapApiItemsToStore([
      { id: 'i2', slug: 's2', name: 'Salt', unit: 'kg', defaultQuantity: 1 } as any,
    ]);
    expect(mapped[0].barcode).toBeUndefined();
  });

  it('preserves price + mrp (the backend compareAtPrice→mrp transform is load-bearing)', () => {
    // productApi.getItems runs a transformResponse that copies compareAtPrice→mrp
    // BEFORE this mapping runs; if anyone drops that transform, MRP silently
    // vanishes from the catalog. This pins the field at the mapping boundary.
    const mapped = mapApiItemsToStore([
      {
        id: 'i4', slug: 'oil', name: 'Sunflower Oil', unit: 'L', defaultQuantity: 1,
        price: 145, mrp: 160, category: { slug: 'oils' },
      } as any,
    ]);
    expect(mapped[0].price).toBe(145);
    expect(mapped[0].mrp).toBe(160);
  });

  it('preserves stock fields (stockQuantity, lowStockThreshold, trackInventory, costPrice)', () => {
    // costPrice was being dropped (same bug class as barcode) — the Stock tab
    // and Inventory page need it.
    const mapped = mapApiItemsToStore([
      {
        id: 'i3', slug: 'rice', name: 'Rice', unit: 'kg', defaultQuantity: 5,
        stockQuantity: 8, lowStockThreshold: 10, trackInventory: true, costPrice: 120,
        category: { slug: 'rice' },
      } as any,
    ]);
    expect(mapped[0].stockQuantity).toBe(8);
    expect(mapped[0].lowStockThreshold).toBe(10);
    expect(mapped[0].trackInventory).toBe(true);
    expect(mapped[0].costPrice).toBe(120);
  });
});

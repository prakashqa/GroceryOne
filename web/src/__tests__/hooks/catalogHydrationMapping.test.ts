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
});

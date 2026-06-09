import { resolveBarcode } from '@/lib/barcode/resolveBarcode';

interface TestItem {
  id: string;
  name: string;
  barcode?: string;
}

const items: TestItem[] = [
  { id: '1', name: 'Rice 1kg', barcode: '8901234567890' },
  { id: '2', name: 'Salt 1kg', barcode: '8909999999999' },
  { id: '3', name: 'Loose item', barcode: undefined },
];

describe('resolveBarcode — local-first, backend fallback, never throws offline', () => {
  it('resolves from the local catalog WITHOUT calling the backend', async () => {
    const lazyFetch = jest.fn();
    const res = await resolveBarcode({ barcode: '8901234567890', items, lazyFetch });
    expect(res.status).toBe('local');
    expect(res.item?.id).toBe('1');
    expect(lazyFetch).not.toHaveBeenCalled();
  });

  it('trims the scanned code before matching', async () => {
    const lazyFetch = jest.fn();
    const res = await resolveBarcode({ barcode: '  8901234567890  ', items, lazyFetch });
    expect(res.status).toBe('local');
    expect(res.item?.id).toBe('1');
  });

  it('falls back to the backend when not in the local catalog', async () => {
    const remote: TestItem = { id: '99', name: 'New Product', barcode: '5555000011112' };
    const lazyFetch = jest.fn().mockResolvedValue(remote);
    const res = await resolveBarcode({ barcode: '5555000011112', items, lazyFetch });
    expect(lazyFetch).toHaveBeenCalledWith('5555000011112');
    expect(res.status).toBe('remote');
    expect(res.item?.id).toBe('99');
  });

  it('returns not-found when local misses and backend has no item', async () => {
    const lazyFetch = jest.fn().mockResolvedValue(null);
    const res = await resolveBarcode({ barcode: '0000000000000', items, lazyFetch });
    expect(res.status).toBe('not-found');
    expect(res.item).toBeUndefined();
  });

  it('never throws when the backend rejects (offline) — returns not-found', async () => {
    const lazyFetch = jest.fn().mockRejectedValue(new Error('Network error'));
    const res = await resolveBarcode({ barcode: '0000000000000', items, lazyFetch });
    expect(res.status).toBe('not-found');
  });

  it('returns not-found for an empty/whitespace barcode without any lookup', async () => {
    const lazyFetch = jest.fn();
    const res = await resolveBarcode({ barcode: '   ', items, lazyFetch });
    expect(res.status).toBe('not-found');
    expect(lazyFetch).not.toHaveBeenCalled();
  });

  it('works with no lazyFetch provided (pure offline) — local hit', async () => {
    const res = await resolveBarcode({ barcode: '8909999999999', items });
    expect(res.status).toBe('local');
    expect(res.item?.id).toBe('2');
  });

  it('returns not-found offline-only when local misses and no lazyFetch given', async () => {
    const res = await resolveBarcode({ barcode: '1212121212121', items });
    expect(res.status).toBe('not-found');
  });
});

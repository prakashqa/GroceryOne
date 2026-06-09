/**
 * Shared barcode resolution used by both the POS and item-management scanners.
 *
 * Resolution order (offline-first):
 *   1. Local Redux catalog — instant, works with no network.
 *   2. Backend `GET /items/barcode/:barcode` (tenant-scoped) — only when the
 *      local catalog misses AND a `lazyFetch` is supplied.
 *   3. not-found — caller offers an "Add this product" shortcut.
 *
 * Pure: the backend call is injected as `lazyFetch`, so this is unit-testable
 * without RTK Query or a network. The injected fetch MUST resolve to the item
 * or null/undefined and may reject when offline — we swallow rejections and
 * report `not-found` so a scan never crashes the till.
 */
export type BarcodeResolution<T> =
  | { status: 'local'; item: T }
  | { status: 'remote'; item: T }
  | { status: 'not-found'; item?: undefined };

export interface ResolveBarcodeArgs<T extends { barcode?: string }> {
  barcode: string;
  items: readonly T[];
  /** Backend lookup; resolves to the item, or null/undefined when none. */
  lazyFetch?: (barcode: string) => Promise<T | null | undefined>;
}

export async function resolveBarcode<T extends { barcode?: string }>({
  barcode,
  items,
  lazyFetch,
}: ResolveBarcodeArgs<T>): Promise<BarcodeResolution<T>> {
  const code = barcode.trim();
  if (!code) return { status: 'not-found' };

  // 1) Local catalog.
  const local = items.find((i) => i.barcode === code);
  if (local) return { status: 'local', item: local };

  // 2) Backend fallback (best-effort; never throws).
  if (lazyFetch) {
    try {
      const remote = await lazyFetch(code);
      if (remote) return { status: 'remote', item: remote };
    } catch {
      // Offline or 404 — fall through to not-found.
    }
  }

  // 3) Nothing matched.
  return { status: 'not-found' };
}

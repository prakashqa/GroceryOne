import multiCartReducer, {
  syncCartsFromBackend,
  markCartAsPaid,
  updateCartBackendId,
} from './multiCartSlice';
import type { MultiCartState, ManagedCart, CartStatus } from '../types/picking';

const INITIAL: MultiCartState = {
  carts: [],
  activeCartId: null,
  isHydrated: false,
  lastSyncedAt: null,
  deletedCartIds: [],
};

const makeBackendCart = (overrides: Partial<{
  id: string;
  name: string;
  status: CartStatus;
  paidAt?: string;
  paidAmount?: number;
  createdAt: string;
  updatedAt: string;
  items: Array<any>;
}>) => ({
  id: 'c1',
  name: 'Cart 1',
  status: 'draft' as CartStatus,
  createdAt: '2026-01-30T10:00:00.000Z',
  updatedAt: '2026-01-30T10:00:00.000Z',
  items: [],
  ...overrides,
});

describe('multiCartSlice — syncCartsFromBackend status normalization', () => {
  it('normalizes status to "paid" when backend cart has paidAt but status=draft (replaceAll)', () => {
    const state = multiCartReducer(
      INITIAL,
      syncCartsFromBackend({
        carts: [makeBackendCart({ status: 'draft', paidAt: '2026-01-30T11:00:00.000Z', paidAmount: 500 })],
        replaceAll: true,
      }),
    );
    expect(state.carts).toHaveLength(1);
    expect(state.carts[0].status).toBe('paid');
    expect(state.carts[0].paidAt).toBe('2026-01-30T11:00:00.000Z');
  });

  it('normalizes status to "paid" when backend cart has paidAt but status=draft (merge mode)', () => {
    const prior: MultiCartState = {
      ...INITIAL,
      carts: [
        // Pre-existing local copy with same id but NO local paid state — this simulates
        // a fresh install that then pulls backend data
        { id: 'c1', name: 'Cart 1', status: 'draft', items: [], createdAt: '2026-01-30T10:00:00.000Z', updatedAt: '2026-01-30T10:00:00.000Z' } as ManagedCart,
      ],
    };
    const state = multiCartReducer(
      prior,
      syncCartsFromBackend({
        carts: [makeBackendCart({ status: 'draft', paidAt: '2026-01-30T11:00:00.000Z', paidAmount: 500 })],
        replaceAll: false,
      }),
    );
    expect(state.carts[0].status).toBe('paid');
  });

  it('leaves status untouched when backend cart has no paidAt', () => {
    const state = multiCartReducer(
      INITIAL,
      syncCartsFromBackend({
        carts: [makeBackendCart({ status: 'draft' })],
        replaceAll: true,
      }),
    );
    expect(state.carts[0].status).toBe('draft');
  });

  it('respects explicit backend status=paid when paidAt is also set', () => {
    const state = multiCartReducer(
      INITIAL,
      syncCartsFromBackend({
        carts: [makeBackendCart({ status: 'paid', paidAt: '2026-01-30T11:00:00.000Z' })],
        replaceAll: true,
      }),
    );
    expect(state.carts[0].status).toBe('paid');
  });

  it('LOCAL-WINS: preserves local paid status even if local.status not set but local.paidAt is', () => {
    // Scenario: local cart has paidAt (was previously paid), but its status was somehow
    // reset to draft (e.g. stale cached state from a buggy older version). Backend merge
    // should NOT downgrade it to draft — the paidAt is load-bearing proof of payment.
    const prior: MultiCartState = {
      ...INITIAL,
      carts: [
        {
          id: 'c1',
          name: 'Cart 1',
          status: 'draft', // incorrectly downgraded locally
          paidAt: '2026-01-30T11:00:00.000Z',
          paidAmount: 500,
          items: [],
          createdAt: '2026-01-30T10:00:00.000Z',
          updatedAt: '2026-01-30T10:00:00.000Z',
        } as ManagedCart,
      ],
    };
    const state = multiCartReducer(
      prior,
      syncCartsFromBackend({
        carts: [makeBackendCart({ status: 'draft', paidAt: '2026-01-30T11:00:00.000Z', paidAmount: 500 })],
        replaceAll: false,
      }),
    );
    expect(state.carts[0].status).toBe('paid');
    expect(state.carts[0].paidAmount).toBe(500);
  });
});

describe('multiCartSlice — tenant isolation', () => {
  it('syncCartsFromBackend replaces state on logout — cannot bleed tenant A carts into tenant B session', () => {
    // Simulate tenant A session
    const tenantAState: MultiCartState = {
      ...INITIAL,
      carts: [
        { id: 'a-cart-1', name: 'Tenant A Cart', status: 'paid', paidAt: '2026-01-30T11:00:00.000Z', items: [], createdAt: '2026-01-30T10:00:00.000Z', updatedAt: '2026-01-30T10:00:00.000Z' } as ManagedCart,
      ],
    };
    // After logout (extraReducer resets to initial) and tenant B login, sync arrives
    // with only tenant B's carts. State must reflect only B, never A.
    const afterLogout = multiCartReducer(tenantAState, { type: 'auth/logout' });
    expect(afterLogout.carts).toHaveLength(0);

    const tenantBSynced = multiCartReducer(
      afterLogout,
      syncCartsFromBackend({
        carts: [makeBackendCart({ id: 'b-cart-1', name: 'Tenant B Cart' })],
        replaceAll: true,
      }),
    );
    expect(tenantBSynced.carts).toHaveLength(1);
    expect(tenantBSynced.carts[0].id).toBe('b-cart-1');
    expect(tenantBSynced.carts.find((c) => c.id === 'a-cart-1')).toBeUndefined();
  });
});

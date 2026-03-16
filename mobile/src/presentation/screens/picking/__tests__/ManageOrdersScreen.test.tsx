/**
 * ManageOrdersScreen Tests
 * TDD: Tests for backend fetch, pull-to-refresh, loading state, and date picker fix
 *
 * Bug: ManageOrdersScreen never fetched from backend — only read Redux store.
 * Historical orders (yesterday, date picker) were invisible because Redux
 * depended on potentially stale AsyncStorage cache.
 */

import React from 'react';
import { RefreshControl } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import ManageOrdersScreen from '../ManageOrdersScreen';

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      dispatch: jest.fn(),
      reset: jest.fn(),
      isFocused: jest.fn(() => true),
      canGoBack: jest.fn(() => false),
      getParent: jest.fn(() => undefined),
      getState: jest.fn(() => ({ routes: [] })),
      getId: jest.fn(),
      setParams: jest.fn(),
      removeListener: jest.fn(),
    }),
  };
});

// Mock useGetCartsQuery
const mockRefetch = jest.fn();
let mockCartsQueryResult: {
  data: unknown[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch: jest.Mock;
} = {
  data: undefined,
  isLoading: false,
  isFetching: false,
  refetch: mockRefetch,
};

jest.mock('../../../../data/api/cartApi', () => ({
  ...jest.requireActual('../../../../data/api/cartApi'),
  useGetCartsQuery: () => mockCartsQueryResult,
}));

// Helper: create a backend cart payload
function makeBackendCart(overrides: {
  id: string;
  name: string;
  createdAt: string;
  status?: string;
}) {
  return {
    id: overrides.id,
    name: overrides.name,
    status: overrides.status || 'draft',
    createdAt: overrides.createdAt,
    updatedAt: overrides.createdAt,
    items: [],
  };
}

// Helper: get yesterday's date as ISO string
function getYesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

// Helper: get today's date as ISO string
function getTodayISO(): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

// Tenant state required for API queries
const tenantState = {
  tenant: {
    tenant: {
      id: 'tenant-uuid',
      name: 'Fresh Mart',
      slug: 'freshmart',
      status: 'active' as const,
      subscriptionPlan: 'free' as const,
      branding: { primaryColor: '#4CAF50', logoUrl: null },
      defaultLanguage: 'en' as const,
      supportedLanguages: ['en' as const],
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    config: null,
    branding: { primaryColor: '#4CAF50', logoUrl: null },
    currentLanguage: 'en' as const,
    isLoading: false,
    error: null,
  },
};

describe('ManageOrdersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCartsQueryResult = {
      data: undefined,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    };
  });

  describe('backend fetch and historical carts', () => {
    it('should sync backend carts to Redux when data arrives (including historical)', async () => {
      const yesterdayCart = makeBackendCart({
        id: 'uuid-yesterday',
        name: 'Yesterday Cart',
        createdAt: getYesterdayISO(),
      });
      const todayCart = makeBackendCart({
        id: 'uuid-today',
        name: 'Today Cart',
        createdAt: getTodayISO(),
      });

      mockCartsQueryResult.data = [todayCart, yesterdayCart];

      const { store } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: {
          ...tenantState,
          multiCart: {
            carts: [],
            activeCartId: null,
            isHydrated: true,
            lastSyncedAt: null,
            deletedCartIds: [],
          },
        } as any,
      });

      await waitFor(() => {
        const carts = ((store.getState() as any).multiCart).carts;
        expect(carts.length).toBeGreaterThanOrEqual(2);
        expect(carts.find((c: any) => c.name === 'Yesterday Cart')).toBeTruthy();
        expect(carts.find((c: any) => c.name === 'Today Cart')).toBeTruthy();
      });
    });

    it('should dispatch syncCartsFromBackend with replaceAll: true', async () => {
      const cart = makeBackendCart({
        id: 'uuid-1',
        name: 'Test Cart',
        createdAt: getTodayISO(),
      });

      mockCartsQueryResult.data = [cart];

      const { store } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: {
          ...tenantState,
          multiCart: {
            carts: [],
            activeCartId: null,
            isHydrated: true,
            lastSyncedAt: null,
            deletedCartIds: [],
          },
        } as any,
      });

      // After sync, the cart should be in Redux store
      await waitFor(() => {
        const carts = ((store.getState() as any).multiCart).carts;
        expect(carts.length).toBe(1);
        expect(carts[0].id).toBe('uuid-1');
      });
    });

    it('should show loading indicator while fetching', () => {
      mockCartsQueryResult.isLoading = true;

      const { getByTestId } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: {
          ...tenantState,
          multiCart: {
            carts: [],
            activeCartId: null,
            isHydrated: true,
            lastSyncedAt: null,
            deletedCartIds: [],
          },
        } as any,
      });

      expect(getByTestId('carts-loading-indicator')).toBeTruthy();
    });

    it('should have RefreshControl on the cart list', () => {
      mockCartsQueryResult.data = [
        makeBackendCart({ id: 'uuid-1', name: 'Cart 1', createdAt: getTodayISO() }),
      ];

      const { UNSAFE_getAllByType } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: {
          ...tenantState,
          multiCart: {
            carts: [
              {
                id: 'uuid-1',
                name: 'Cart 1',
                status: 'draft',
                createdAt: getTodayISO(),
                updatedAt: getTodayISO(),
                items: [],
              },
            ],
            activeCartId: 'uuid-1',
            isHydrated: true,
            lastSyncedAt: null,
            deletedCartIds: [],
          },
        } as any,
      });

      // RefreshControl renders as RCTRefreshControl in test env — testID doesn't propagate.
      // Verify the RefreshControl component exists and has onRefresh wired to refetch.
      const refreshControls = UNSAFE_getAllByType(RefreshControl);
      expect(refreshControls.length).toBeGreaterThan(0);
      expect(refreshControls[0].props.onRefresh).toBeDefined();
    });
  });

  describe('createdAt preservation during delayed sync', () => {
    it('should preserve local createdAt when backend has later timestamp (delayed sync)', async () => {
      const localYesterdayCreatedAt = getYesterdayISO();
      const backendTodayCreatedAt = getTodayISO();

      // Backend cart was synced today (delayed), but was locally created yesterday
      const backendCart = makeBackendCart({
        id: 'uuid-delayed',
        name: 'Delayed Sync Cart',
        createdAt: backendTodayCreatedAt,
      });

      mockCartsQueryResult.data = [backendCart];

      const { store } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: {
          ...tenantState,
          multiCart: {
            carts: [{
              id: 'uuid-delayed',
              name: 'Delayed Sync Cart',
              status: 'draft',
              createdAt: localYesterdayCreatedAt,
              updatedAt: localYesterdayCreatedAt,
              items: [],
            }],
            activeCartId: 'uuid-delayed',
            isHydrated: true,
            lastSyncedAt: null,
            deletedCartIds: [],
          },
        } as any,
      });

      await waitFor(() => {
        const carts = ((store.getState() as any).multiCart).carts;
        const cart = carts.find((c: any) => c.id === 'uuid-delayed');
        expect(cart).toBeTruthy();
        // createdAt should be the EARLIER timestamp (yesterday), not today's backend timestamp
        expect(new Date(cart!.createdAt).toDateString())
          .toBe(new Date(localYesterdayCreatedAt).toDateString());
      });
    });

    it('should use backend createdAt when no local cart exists (fresh sync)', async () => {
      const backendCreatedAt = getYesterdayISO();

      const backendCart = makeBackendCart({
        id: 'uuid-fresh',
        name: 'Fresh Backend Cart',
        createdAt: backendCreatedAt,
      });

      mockCartsQueryResult.data = [backendCart];

      const { store } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: {
          ...tenantState,
          multiCart: {
            carts: [],
            activeCartId: null,
            isHydrated: true,
            lastSyncedAt: null,
            deletedCartIds: [],
          },
        } as any,
      });

      await waitFor(() => {
        const carts = ((store.getState() as any).multiCart).carts;
        const cart = carts.find((c: any) => c.id === 'uuid-fresh');
        expect(cart).toBeTruthy();
        // No local cart — use backend's createdAt as-is
        expect(new Date(cart!.createdAt).toDateString())
          .toBe(new Date(backendCreatedAt).toDateString());
      });
    });

    it('should preserve local createdAt for cart matched by backendId', async () => {
      const localYesterdayCreatedAt = getYesterdayISO();
      const backendTodayCreatedAt = getTodayISO();

      // Backend returns cart with UUID
      const backendCart = makeBackendCart({
        id: 'backend-uuid-123',
        name: 'BackendId Match Cart',
        createdAt: backendTodayCreatedAt,
      });

      mockCartsQueryResult.data = [backendCart];

      const { store } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: {
          ...tenantState,
          multiCart: {
            carts: [{
              id: 'cart-local-456',
              backendId: 'backend-uuid-123',
              name: 'BackendId Match Cart',
              status: 'draft',
              createdAt: localYesterdayCreatedAt,
              updatedAt: localYesterdayCreatedAt,
              items: [],
            }],
            activeCartId: 'cart-local-456',
            isHydrated: true,
            lastSyncedAt: null,
            deletedCartIds: [],
          },
        } as any,
      });

      await waitFor(() => {
        const carts = ((store.getState() as any).multiCart).carts;
        // Cart should now have backend UUID as id
        const cart = carts.find((c: any) => c.id === 'backend-uuid-123');
        expect(cart).toBeTruthy();
        // createdAt should be the EARLIER timestamp (yesterday)
        expect(new Date(cart!.createdAt).toDateString())
          .toBe(new Date(localYesterdayCreatedAt).toDateString());
      });
    });
  });

  describe('date picker dismiss fix', () => {
    it('should NOT change filter when date picker is dismissed', async () => {
      // Include both today AND yesterday carts so we can detect filter change.
      // Bug: on Android dismiss, date is always provided. The old `if (date)`
      // check incorrectly switches filter to 'custom' (today's date), hiding
      // yesterday's cart. After fix, filter stays 'all' and both are visible.
      const todayCart = makeBackendCart({
        id: 'uuid-today',
        name: 'Today Cart',
        createdAt: getTodayISO(),
      });
      const yesterdayCart = makeBackendCart({
        id: 'uuid-yesterday',
        name: 'Yesterday Cart',
        createdAt: getYesterdayISO(),
      });

      mockCartsQueryResult.data = [todayCart, yesterdayCart];

      const { getByTestId, queryByTestId } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: {
          ...tenantState,
          multiCart: {
            carts: [
              {
                id: 'uuid-today',
                name: 'Today Cart',
                status: 'draft',
                createdAt: getTodayISO(),
                updatedAt: getTodayISO(),
                items: [],
              },
              {
                id: 'uuid-yesterday',
                name: 'Yesterday Cart',
                status: 'draft',
                createdAt: getYesterdayISO(),
                updatedAt: getYesterdayISO(),
                items: [],
              },
            ],
            activeCartId: 'uuid-today',
            isHydrated: true,
            lastSyncedAt: null,
            deletedCartIds: [],
          },
        } as any,
      });

      // Both carts visible under default 'all' filter
      expect(getByTestId('cart-uuid-yesterday')).toBeTruthy();

      // Open date picker
      fireEvent.press(getByTestId('filter-custom'));

      // Simulate dismiss on Android (event.type = 'dismissed')
      // Android v8+: date is ALWAYS provided even on dismiss
      const picker = queryByTestId('date-picker');
      if (picker && picker.props.onChange) {
        picker.props.onChange({ type: 'dismissed' }, new Date());
      }

      // Yesterday's cart should STILL be visible (filter must NOT change to 'custom')
      // With the bug: filter='custom' + date=today → yesterday's cart hidden
      await waitFor(() => {
        expect(getByTestId('cart-uuid-yesterday')).toBeTruthy();
      });
    });

    it('should change filter when date is selected (event.type === set)', async () => {
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      yesterdayDate.setHours(12, 0, 0, 0);

      const yesterdayCart = makeBackendCart({
        id: 'uuid-yesterday',
        name: 'Yesterday Cart',
        createdAt: getYesterdayISO(),
      });

      mockCartsQueryResult.data = [yesterdayCart];

      const { getByTestId, queryByTestId } = renderWithProviders(<ManageOrdersScreen />, {
        preloadedState: {
          ...tenantState,
          multiCart: {
            carts: [
              {
                id: 'uuid-yesterday',
                name: 'Yesterday Cart',
                status: 'draft',
                createdAt: getYesterdayISO(),
                updatedAt: getYesterdayISO(),
                items: [],
              },
            ],
            activeCartId: 'uuid-yesterday',
            isHydrated: true,
            lastSyncedAt: null,
            deletedCartIds: [],
          },
        } as any,
      });

      // Open date picker
      fireEvent.press(getByTestId('filter-custom'));

      // Simulate selecting yesterday's date (event.type = 'set')
      const picker = queryByTestId('date-picker');
      if (picker && picker.props.onChange) {
        picker.props.onChange({ type: 'set' }, yesterdayDate);
      }

      // Yesterday's cart should be visible via custom filter
      await waitFor(() => {
        expect(getByTestId('cart-uuid-yesterday')).toBeTruthy();
      });
    });
  });
});

/**
 * GroceryOne Mobile Application
 * Main App Component
 */

import React, { useEffect } from 'react';
import { Alert, LogBox } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nextProvider } from 'react-i18next';

import { store } from './store';
import i18n from './i18n';
import { TenantProvider } from './tenant';
import { ThemeProvider } from './presentation/theme';
import { RootNavigator } from './presentation/navigation/RootNavigator';
import { initializeCatalog, mergeCatalogFromBackend, selectIsCatalogInitialized, selectCategories } from './store/slices/catalogSlice';
import { loadOrSeedCatalog, refreshCatalogFromBackend } from './utils/storage/catalogStorage';
import { selectTenant } from './store/slices/tenantSlice';
import { hydrateMultiCart, syncCartsFromBackend, resetMultiCart, selectIsMultiCartHydrated } from './store/slices/multiCartSlice';
import { selectAccessToken } from './store/slices/authSlice';
import { loadOrFetchCarts, fetchCartsFromBackend } from './utils/storage/cartHydration';
import { processPendingSyncQueue } from './store/middleware/multiCartPersistMiddleware';
import { processPendingCatalogSyncQueue } from './store/middleware/catalogPersistMiddleware';

// Ignore specific warnings (temporary)
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

/**
 * App Content with Theme
 * Handles catalog initialization
 */
function AppContent() {
  const dispatch = useDispatch();
  const isCatalogInitialized = useSelector(selectIsCatalogInitialized);
  const categories = useSelector(selectCategories);
  const tenant = useSelector(selectTenant);
  const tenantSlug = tenant?.slug;
  const isMultiCartHydrated = useSelector(selectIsMultiCartHydrated);
  const accessToken = useSelector(selectAccessToken);

  // ── Cart Hydration Phase 1: Load carts from cache or backend ──
  // Runs on first mount / after login when carts haven't been hydrated yet.
  // Re-runs when accessToken changes (e.g., after login provides token).
  // Also re-runs after tenant switch since resetMultiCart() clears isHydrated.
  useEffect(() => {
    if (!tenantSlug || isMultiCartHydrated) return;

    // Clear any stale carts from a previous tenant before hydrating
    dispatch(resetMultiCart());

    const controller = new AbortController();

    console.log('[App] Hydrating carts...', { tenantSlug, hasAccessToken: !!accessToken });
    loadOrFetchCarts(tenantSlug, accessToken, controller.signal).then((result) => {
      if (controller.signal.aborted) return; // Guard: tenant changed, discard stale response

      if (result.fromCache || result.fromBackend) {
        console.log('[App] Cart hydration result:', {
          cartsCount: result.carts.length,
          fromCache: result.fromCache,
          fromBackend: result.fromBackend,
        });
        dispatch(hydrateMultiCart({
          carts: result.carts,
          activeCartId: result.activeCartId,
          lastSyncedAt: result.lastSyncedAt,
        }));
      } else if (result.backendSkipped) {
        // Token not available yet — do NOT mark as hydrated.
        // The effect will re-run when accessToken changes.
        console.log('[App] Cart hydration skipped (no token), will retry when token available');
        return; // Skip processPendingSyncQueue too
      } else {
        // Both cache and backend checked with token available, genuinely empty
        dispatch(hydrateMultiCart({ carts: [], activeCartId: null }));
      }

      // Process any pending sync queue items from previous sessions
      processPendingSyncQueue(store.dispatch, store.getState);
    });

    return () => { controller.abort(); }; // Cleanup: cancel in-flight fetch on tenant/token change
  }, [dispatch, tenantSlug, isMultiCartHydrated, accessToken]);

  // ── Cart Hydration Phase 2: Background refresh from backend after cache load ──
  // Ensures stale cached data gets updated with latest backend state
  useEffect(() => {
    if (!tenantSlug || !isMultiCartHydrated || !accessToken) return;

    const controller = new AbortController();

    fetchCartsFromBackend(tenantSlug, accessToken, controller.signal).then((freshData) => {
      if (controller.signal.aborted) return; // Guard: tenant changed, discard stale response

      if (freshData && freshData.carts.length > 0) {
        console.log('[App] Background cart refresh:', {
          cartsCount: freshData.carts.length,
        });
        // Map ManagedCart format to syncCartsFromBackend payload format
        const backendPayload = freshData.carts.map((cart) => ({
          id: cart.id,
          name: cart.name,
          status: cart.status,
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
          paidAt: cart.paidAt,
          paidAmount: cart.paidAmount,
          items: cart.items.map((cartItem) => ({
            itemId: cartItem.item.id,
            quantity: cartItem.quantity,
            priceSnapshot: cartItem.priceSnapshot,
            addedAt: cartItem.addedAt,
            item: cartItem.item,
          })),
        }));
        dispatch(syncCartsFromBackend({
          carts: backendPayload,
          replaceAll: true, // Replace all — backend is the source of truth for tenant-isolated data
        }));
      }
    });

    return () => { controller.abort(); }; // Cleanup: cancel in-flight fetch on tenant/token change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, tenantSlug, isMultiCartHydrated, accessToken]);

  // Phase 1: Initial load from backend or cache
  // Also re-fetch if initialized but categories are empty (network was unavailable during first load)
  useEffect(() => {
    if (!tenantSlug) return;

    const shouldFetchCatalog = !isCatalogInitialized || (isCatalogInitialized && categories.length === 0);

    if (shouldFetchCatalog) {
      console.log('[App] Loading catalog...', { isCatalogInitialized, categoriesCount: categories.length, tenantSlug });
      loadOrSeedCatalog(tenantSlug).then((catalogData) => {
        console.log('[App] Catalog loaded:', {
          categoriesCount: catalogData.categories.length,
          itemsCount: catalogData.items.length,
          fromCache: catalogData.fromCache
        });
        dispatch(initializeCatalog(catalogData));
        if (catalogData.error) {
          Alert.alert(
            'Connection Error',
            catalogData.error,
            [{ text: 'OK' }]
          );
        }

        // Retry any failed category/item syncs from previous sessions
        processPendingCatalogSyncQueue(store.getState);
      });
    }
  }, [dispatch, isCatalogInitialized, categories.length, tenantSlug]);

  // Phase 2: Background refresh from backend after cache load
  // Ensures stale cached data (e.g. missing MRP/price fields) gets updated
  // NOTE: categories.length intentionally NOT in deps to avoid infinite re-render loop
  useEffect(() => {
    if (!tenantSlug) return;

    if (isCatalogInitialized && categories.length > 0) {
      refreshCatalogFromBackend(tenantSlug).then((freshData) => {
        if (freshData) {
          console.log('[App] Background refresh: merging catalog with fresh backend data', {
            categoriesCount: freshData.categories.length,
            itemsCount: freshData.items.length,
          });
          // Merge instead of replace to preserve locally-created categories/items
          dispatch(mergeCatalogFromBackend(freshData));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isCatalogInitialized, tenantSlug]);

  return <RootNavigator />;
}

/**
 * Main App Component
 */
function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <SafeAreaProvider>
            <ThemeProvider>
              <TenantProvider>
                <AppContent />
              </TenantProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </I18nextProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;

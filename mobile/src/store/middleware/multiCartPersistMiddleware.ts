/**
 * Multi-Cart Persist Middleware
 * Automatically persists cart changes to AsyncStorage and syncs to backend
 * All persistence is tenant-scoped for data isolation
 */

import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../rootReducer';
import {
  saveMultiCartState,
  addToPendingSyncQueue,
  removeFromPendingSyncQueue,
  loadPendingSyncQueue,
} from '../../utils/storage/multiCartStorage';
import { updateCartBackendId } from '../slices/multiCartSlice';
import {
  operationStarted,
  operationCompleted,
  operationFailed,
} from '../slices/cartOperationsSlice';
import { API_CONFIG } from '../../core/config/api.config';
import type { Item } from '../../domain/types/picking';

/**
 * Resolve the backend-compatible item ID for API calls.
 * Prefers backendId (UUID) when available, falls back to id (slug) for
 * backward compatibility with items cached before backendId was introduced.
 */
const resolveBackendItemId = (item: Item): string => item.backendId || item.id;

// Actions that should trigger persistence
const PERSIST_ACTIONS = [
  'multiCart/createCart',
  'multiCart/deleteCart',
  'multiCart/renameCart',
  'multiCart/setActiveCart',
  'multiCart/addItemToActiveCart',
  'multiCart/removeItemFromActiveCart',
  'multiCart/updateItemQuantityInActiveCart',
  'multiCart/incrementItemInActiveCart',
  'multiCart/decrementItemInActiveCart',
  'multiCart/clearActiveCart',
  'multiCart/setActiveCartStatus',
  'multiCart/updateCartBackendId',
  'multiCart/markActiveCartAsPaid',
  'multiCart/markCartAsPaid',
  'multiCart/syncCartsFromBackend',
  'multiCart/refreshActiveCartPrices',
];

// Actions that should trigger backend sync (cart creation)
const SYNC_TO_BACKEND_ACTIONS = [
  'multiCart/createCart',
];

// Actions that should trigger backend payment sync
const PAYMENT_SYNC_ACTIONS = [
  'multiCart/markActiveCartAsPaid',
  'multiCart/markCartAsPaid',
];

// Actions that should trigger backend item sync
const ITEM_SYNC_ACTIONS = [
  'multiCart/addItemToActiveCart',
];

// Actions that should trigger backend cart delete
const DELETE_CART_ACTIONS = [
  'multiCart/deleteCart',
];

// Actions that should trigger backend cart update (name, status)
const UPDATE_CART_ACTIONS = [
  'multiCart/renameCart',
  'multiCart/setActiveCartStatus',
];

// Actions that should trigger backend item removal
const REMOVE_ITEM_ACTIONS = [
  'multiCart/removeItemFromActiveCart',
  'multiCart/removeItemFromCart',
];

// Actions that should trigger backend item quantity update
const UPDATE_ITEM_ACTIONS = [
  'multiCart/updateItemQuantityInActiveCart',
  'multiCart/incrementItemInActiveCart',
  'multiCart/decrementItemInActiveCart',
];

// Actions that should trigger backend clear cart
const CLEAR_CART_ACTIONS = [
  'multiCart/clearActiveCart',
];

// Actions that require pre-dispatch state capture (data removed by reducer)
const PRE_DISPATCH_ACTIONS = [
  ...DELETE_CART_ACTIONS,
  ...REMOVE_ITEM_ACTIONS,
  ...CLEAR_CART_ACTIONS,
];

// Debounce timer reference
let persistTimer: NodeJS.Timeout | null = null;
const DEBOUNCE_MS = 500;

// Critical actions that should persist IMMEDIATELY (no debounce)
// These are important state changes that must be saved before the app closes
const IMMEDIATE_PERSIST_ACTIONS = [
  'multiCart/markActiveCartAsPaid',
  'multiCart/markCartAsPaid',
  'multiCart/deleteCart',
];

/**
 * Get tenant slug from Redux state
 */
const getTenantSlug = (state: RootState): string | undefined =>
  state.tenant?.tenant?.slug;

/**
 * Sync a cart to the backend API
 */
const syncCartToBackend = async (
  cart: { id: string; name: string; status: string; createdAt: string },
  dispatch: (action: unknown) => void,
  getState: () => RootState
): Promise<void> => {
  try {
    const state = getState();
    const tenantSlug = getTenantSlug(state);

    if (!tenantSlug) {
      console.warn('[MultiCartSync] No tenant slug, skipping backend sync');
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Version': API_CONFIG.VERSION,
    };

    headers['X-Tenant-ID'] = tenantSlug;

    // Add auth token if available
    const token = state.auth?.accessToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Build request body — tenantId is NOT included here because the backend
    // injects it server-side from the X-Tenant-ID header. Sending it in the body
    // triggers a 400 error due to forbidNonWhitelisted validation.
    const requestBody = {
      name: cart.name,
      status: cart.status,
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}/carts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const json = await response.json();
    // Handle wrapped response format: { success: true, data: T }
    const backendCart = json.data || json;

    if (backendCart && backendCart.id) {
      // Update local cart with backend ID
      dispatch(updateCartBackendId({
        localId: cart.id,
        backendId: backendCart.id,
      }));

      // Remove from pending queue if it was there
      await removeFromPendingSyncQueue(cart.id, tenantSlug);

      console.log(`[MultiCartSync] Cart synced: ${cart.name} -> ${backendCart.id}`);
    }
  } catch (error) {
    console.warn('[MultiCartSync] Failed to sync cart:', error instanceof Error ? error.message : String(error));
    // Add to pending queue for retry
    const state = getState();
    const tenantSlug = getTenantSlug(state);
    if (tenantSlug) {
      await addToPendingSyncQueue(cart, tenantSlug);
    }
  }
};

/**
 * Build common request headers for backend API calls
 */
const buildHeaders = (state: RootState, tenantSlug: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Version': API_CONFIG.VERSION,
    'X-Tenant-ID': tenantSlug,
  };

  const token = state.auth?.accessToken;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Sync cart payment status to the backend API via PUT /carts/:backendId
 */
const syncCartPaymentToBackend = async (
  cart: { backendId: string; status: string; paidAt?: string; paidAmount?: number },
  getState: () => RootState
): Promise<void> => {
  try {
    const state = getState();
    const tenantSlug = getTenantSlug(state);

    if (!tenantSlug) {
      console.warn('[MultiCartSync] No tenant slug, skipping payment sync');
      return;
    }

    const headers = buildHeaders(state, tenantSlug);

    const requestBody = {
      status: cart.status,
      paidAt: cart.paidAt,
      paidAmount: cart.paidAmount,
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}/carts/${cart.backendId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    console.log(`[MultiCartSync] Payment synced for cart ${cart.backendId}`);
  } catch (error) {
    console.warn('[MultiCartSync] Failed to sync payment:', error instanceof Error ? error.message : String(error));
  }
};

/**
 * Sync a cart item to the backend API via POST /carts/:backendId/items
 */
const syncCartItemToBackend = async (
  backendCartId: string,
  item: { itemId: string; quantity: number; priceSnapshot?: number },
  getState: () => RootState
): Promise<void> => {
  try {
    const state = getState();
    const tenantSlug = getTenantSlug(state);

    if (!tenantSlug) {
      console.warn('[MultiCartSync] No tenant slug, skipping item sync');
      return;
    }

    const headers = buildHeaders(state, tenantSlug);

    const requestBody = {
      itemId: item.itemId,
      quantity: item.quantity,
      priceSnapshot: item.priceSnapshot,
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}/carts/${backendCartId}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    console.log(`[MultiCartSync] Item ${item.itemId} synced to cart ${backendCartId}`);
  } catch (error) {
    console.warn('[MultiCartSync] Failed to sync item:', error instanceof Error ? error.message : String(error));
  }
};

/**
 * Delete a cart from the backend API via DELETE /carts/:backendId
 */
const deleteCartFromBackend = async (
  backendId: string,
  getState: () => RootState
): Promise<void> => {
  try {
    const state = getState();
    const tenantSlug = getTenantSlug(state);
    if (!tenantSlug) return;

    const headers = buildHeaders(state, tenantSlug);

    const response = await fetch(`${API_CONFIG.BASE_URL}/carts/${backendId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    console.log(`[MultiCartSync] Cart deleted from backend: ${backendId}`);
  } catch (error) {
    console.warn('[MultiCartSync] Failed to delete cart:', error instanceof Error ? error.message : String(error));
  }
};

/**
 * Update a cart on the backend API via PUT /carts/:backendId
 */
const updateCartOnBackend = async (
  backendId: string,
  updates: Record<string, unknown>,
  getState: () => RootState
): Promise<void> => {
  try {
    const state = getState();
    const tenantSlug = getTenantSlug(state);
    if (!tenantSlug) return;

    const headers = buildHeaders(state, tenantSlug);

    const response = await fetch(`${API_CONFIG.BASE_URL}/carts/${backendId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    console.log(`[MultiCartSync] Cart updated on backend: ${backendId}`);
  } catch (error) {
    console.warn('[MultiCartSync] Failed to update cart:', error instanceof Error ? error.message : String(error));
  }
};

/**
 * Remove an item from a cart on the backend API via DELETE /carts/:backendCartId/items/:itemId
 */
const removeCartItemFromBackend = async (
  backendCartId: string,
  itemId: string,
  getState: () => RootState
): Promise<void> => {
  try {
    const state = getState();
    const tenantSlug = getTenantSlug(state);
    if (!tenantSlug) return;

    const headers = buildHeaders(state, tenantSlug);

    const response = await fetch(`${API_CONFIG.BASE_URL}/carts/${backendCartId}/items/${itemId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    console.log(`[MultiCartSync] Item ${itemId} removed from cart ${backendCartId}`);
  } catch (error) {
    console.warn('[MultiCartSync] Failed to remove item:', error instanceof Error ? error.message : String(error));
  }
};

/**
 * Update item quantity on backend via PUT /carts/:backendCartId/items/:itemId
 */
const updateCartItemOnBackend = async (
  backendCartId: string,
  itemId: string,
  quantity: number,
  getState: () => RootState
): Promise<void> => {
  try {
    const state = getState();
    const tenantSlug = getTenantSlug(state);
    if (!tenantSlug) return;

    const headers = buildHeaders(state, tenantSlug);

    const response = await fetch(`${API_CONFIG.BASE_URL}/carts/${backendCartId}/items/${itemId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    console.log(`[MultiCartSync] Item ${itemId} quantity updated to ${quantity} in cart ${backendCartId}`);
  } catch (error) {
    console.warn('[MultiCartSync] Failed to update item quantity:', error instanceof Error ? error.message : String(error));
  }
};

/**
 * Clear all items from a cart on the backend via DELETE /carts/:backendCartId/items
 */
const clearCartOnBackend = async (
  backendCartId: string,
  getState: () => RootState
): Promise<void> => {
  try {
    const state = getState();
    const tenantSlug = getTenantSlug(state);
    if (!tenantSlug) return;

    const headers = buildHeaders(state, tenantSlug);

    const response = await fetch(`${API_CONFIG.BASE_URL}/carts/${backendCartId}/items`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    console.log(`[MultiCartSync] All items cleared from cart ${backendCartId}`);
  } catch (error) {
    console.warn('[MultiCartSync] Failed to clear cart:', error instanceof Error ? error.message : String(error));
  }
};

/**
 * Process pending sync queue
 */
export const processPendingSyncQueue = async (
  dispatch: (action: unknown) => void,
  getState: () => RootState
): Promise<void> => {
  try {
    const state = getState();
    const tenantSlug = getTenantSlug(state);

    if (!tenantSlug) {
      console.warn('[MultiCartSync] No tenant slug, skipping pending queue processing');
      return;
    }

    const queue = await loadPendingSyncQueue(tenantSlug);
    if (queue.length === 0) return;

    console.log(`[MultiCartSync] Processing ${queue.length} pending syncs`);

    for (const item of queue) {
      // Check if cart still exists and doesn't have a backendId
      const currentState = getState();
      const cart = currentState.multiCart.carts.find((c) => c.id === item.localId);

      if (cart && !cart.backendId) {
        await syncCartToBackend(
          {
            id: cart.id,
            name: cart.name,
            status: cart.status,
            createdAt: cart.createdAt,
          },
          dispatch,
          getState
        );
      } else {
        // Cart no longer exists or already synced, remove from queue
        await removeFromPendingSyncQueue(item.localId, tenantSlug);
      }
    }
  } catch (error) {
    console.warn('[MultiCartSync] Failed to process pending queue:', error instanceof Error ? error.message : String(error));
  }
};

export const multiCartPersistMiddleware: Middleware<object, RootState> =
  (storeAPI) => (next) => (action) => {
    // Pre-dispatch state capture for destructive actions
    // These actions remove data from state, so we need backendId BEFORE the reducer runs
    let preDispatchData: {
      cartBackendId?: string;
      activeCartBackendId?: string;
      itemId?: string;
    } | null = null;

    if (
      typeof action === 'object' &&
      action !== null &&
      'type' in action
    ) {
      const actionType = (action as { type: string }).type;

      if (PRE_DISPATCH_ACTIONS.includes(actionType)) {
        const preState = storeAPI.getState();

        if (DELETE_CART_ACTIONS.includes(actionType)) {
          const cartId = (action as { payload: string }).payload;
          const cart = preState.multiCart.carts.find((c) => c.id === cartId);
          if (cart?.backendId) {
            preDispatchData = { cartBackendId: cart.backendId };
          }
        }

        if (REMOVE_ITEM_ACTIONS.includes(actionType)) {
          if (actionType === 'multiCart/removeItemFromActiveCart') {
            const itemId = (action as { payload: string }).payload;
            const activeCart = preState.multiCart.carts.find(
              (c) => c.id === preState.multiCart.activeCartId
            );
            if (activeCart?.backendId) {
              // Resolve backendId before dispatch (item will be removed from state)
              const cartItem = activeCart.items.find((i) => i.item.id === itemId);
              const resolvedItemId = cartItem ? resolveBackendItemId(cartItem.item) : itemId;
              preDispatchData = { activeCartBackendId: activeCart.backendId, itemId: resolvedItemId };
            }
          } else if (actionType === 'multiCart/removeItemFromCart') {
            const { cartId, itemId } = (action as { payload: { cartId: string; itemId: string } }).payload;
            const cart = preState.multiCart.carts.find((c) => c.id === cartId);
            if (cart?.backendId) {
              // Resolve backendId before dispatch (item will be removed from state)
              const cartItem = cart.items.find((i) => i.item.id === itemId);
              const resolvedItemId = cartItem ? resolveBackendItemId(cartItem.item) : itemId;
              preDispatchData = { cartBackendId: cart.backendId, itemId: resolvedItemId };
            }
          }
        }

        if (CLEAR_CART_ACTIONS.includes(actionType)) {
          const activeCart = preState.multiCart.carts.find(
            (c) => c.id === preState.multiCart.activeCartId
          );
          if (activeCart?.backendId) {
            preDispatchData = { activeCartBackendId: activeCart.backendId };
          }
        }
      }
    }

    const result = next(action);

    // Check if this action should trigger persistence or sync
    if (
      typeof action === 'object' &&
      action !== null &&
      'type' in action
    ) {
      const actionType = (action as { type: string }).type;

      // Handle persistence to AsyncStorage
      if (PERSIST_ACTIONS.includes(actionType)) {
        const state = storeAPI.getState();
        const tenantSlug = getTenantSlug(state);

        if (!tenantSlug) {
          console.warn('[MultiCartPersist] No tenant slug, skipping persistence');
        } else if (IMMEDIATE_PERSIST_ACTIONS.includes(actionType)) {
          // Critical actions: persist IMMEDIATELY without debounce
          // This ensures payment status is saved before app closes
          saveMultiCartState(state.multiCart, tenantSlug).catch((error) => {
            console.error('[MultiCartPersist] Failed to save state (immediate):', error);
          });
        } else {
          // Non-critical actions: debounce to avoid excessive writes
          if (persistTimer) {
            clearTimeout(persistTimer);
          }
          persistTimer = setTimeout(() => {
            const currentState = storeAPI.getState();
            const currentTenantSlug = getTenantSlug(currentState);
            if (!currentTenantSlug) {
              console.warn('[MultiCartPersist] No tenant slug, skipping persistence');
              return;
            }
            saveMultiCartState(currentState.multiCart, currentTenantSlug).catch((error) => {
              console.error('[MultiCartPersist] Failed to save state:', error);
            });
          }, DEBOUNCE_MS);
        }
      }

      // Handle backend sync for cart creation
      if (SYNC_TO_BACKEND_ACTIONS.includes(actionType)) {
        const cartId = storeAPI.getState().multiCart.activeCartId;
        if (cartId) {
          storeAPI.dispatch(operationStarted({ type: 'cart', id: cartId, operation: 'creating' }));
        }
        setTimeout(async () => {
          const state = storeAPI.getState();
          const carts = state.multiCart.carts;

          if (carts.length > 0) {
            const newCart = carts.find(
              (c) => c.id === state.multiCart.activeCartId && !c.backendId
            );

            if (newCart) {
              try {
                await syncCartToBackend(
                  {
                    id: newCart.id,
                    name: newCart.name,
                    status: newCart.status,
                    createdAt: newCart.createdAt,
                  },
                  storeAPI.dispatch,
                  storeAPI.getState
                );
                storeAPI.dispatch(operationCompleted({ type: 'cart', id: newCart.id }));
              } catch (error) {
                storeAPI.dispatch(operationFailed({
                  type: 'cart',
                  id: newCart.id,
                  error: error instanceof Error ? error.message : 'Failed to create cart',
                }));
              }
            } else if (cartId) {
              // Cart already synced or not found
              storeAPI.dispatch(operationCompleted({ type: 'cart', id: cartId }));
            }
          } else if (cartId) {
            storeAPI.dispatch(operationCompleted({ type: 'cart', id: cartId }));
          }
        }, DEBOUNCE_MS);
      }

      // Handle backend sync for payment — IMMEDIATE (no debounce)
      // Payment is a critical state change; it must reach the backend ASAP
      // before Phase 2 background refresh returns stale 'draft' status.
      if (PAYMENT_SYNC_ACTIONS.includes(actionType)) {
        (async () => {
          const state = storeAPI.getState();
          const typedAction = action as { type: string; payload?: { cartId?: string } };

          let cart;
          if (typedAction.payload?.cartId) {
            cart = state.multiCart.carts.find((c) => c.id === typedAction.payload!.cartId);
          } else {
            cart = state.multiCart.carts.find((c) => c.id === state.multiCart.activeCartId);
          }

          if (cart && cart.backendId) {
            await syncCartPaymentToBackend(
              {
                backendId: cart.backendId,
                status: cart.status,
                paidAt: cart.paidAt,
                paidAmount: cart.paidAmount,
              },
              storeAPI.getState
            );
          }
        })();
      }

      // Handle backend sync for item addition
      if (ITEM_SYNC_ACTIONS.includes(actionType)) {
        const typedAddAction = action as {
          type: string;
          payload: { item: { id: string }; quantity: number };
        };
        const addedItemId = typedAddAction.payload.item.id;
        storeAPI.dispatch(operationStarted({ type: 'item', id: addedItemId, operation: 'adding' }));

        setTimeout(async () => {
          try {
            const state = storeAPI.getState();
            const activeCart = state.multiCart.carts.find(
              (c) => c.id === state.multiCart.activeCartId
            );

            if (activeCart && activeCart.backendId) {
              const lastItem = activeCart.items.find(
                (i) => i.item.id === addedItemId
              );

              if (lastItem) {
                await syncCartItemToBackend(
                  activeCart.backendId,
                  {
                    itemId: resolveBackendItemId(lastItem.item),
                    quantity: typedAddAction.payload.quantity,
                    priceSnapshot: lastItem.priceSnapshot,
                  },
                  storeAPI.getState
                );
              }
            }
            storeAPI.dispatch(operationCompleted({ type: 'item', id: addedItemId }));
          } catch (error) {
            storeAPI.dispatch(operationFailed({
              type: 'item',
              id: addedItemId,
              error: error instanceof Error ? error.message : 'Failed to sync item',
            }));
          }
        }, DEBOUNCE_MS);
      }

      // Handle backend sync for cart deletion (uses pre-dispatch data)
      if (DELETE_CART_ACTIONS.includes(actionType) && preDispatchData?.cartBackendId) {
        const backendId = preDispatchData.cartBackendId;
        const deletedCartId = (action as { payload: string }).payload;
        storeAPI.dispatch(operationStarted({ type: 'cart', id: deletedCartId, operation: 'deleting' }));
        setTimeout(async () => {
          try {
            await deleteCartFromBackend(backendId, storeAPI.getState);
            storeAPI.dispatch(operationCompleted({ type: 'cart', id: deletedCartId }));
          } catch (error) {
            storeAPI.dispatch(operationFailed({
              type: 'cart',
              id: deletedCartId,
              error: error instanceof Error ? error.message : 'Failed to delete cart',
            }));
          }
        }, DEBOUNCE_MS);
      }

      // Handle backend sync for cart updates (rename, status change)
      if (UPDATE_CART_ACTIONS.includes(actionType)) {
        setTimeout(async () => {
          const state = storeAPI.getState();

          if (actionType === 'multiCart/renameCart') {
            const { cartId, name } = (action as { payload: { cartId: string; name: string } }).payload;
            const cart = state.multiCart.carts.find((c) => c.id === cartId);
            if (cart?.backendId) {
              await updateCartOnBackend(cart.backendId, { name }, storeAPI.getState);
            }
          }

          if (actionType === 'multiCart/setActiveCartStatus') {
            const status = (action as { payload: string }).payload;
            const activeCart = state.multiCart.carts.find(
              (c) => c.id === state.multiCart.activeCartId
            );
            if (activeCart?.backendId) {
              await updateCartOnBackend(activeCart.backendId, { status }, storeAPI.getState);
            }
          }
        }, DEBOUNCE_MS);
      }

      // Handle backend sync for item removal (uses pre-dispatch data)
      if (REMOVE_ITEM_ACTIONS.includes(actionType) && preDispatchData?.itemId) {
        const backendCartId = preDispatchData.activeCartBackendId || preDispatchData.cartBackendId;
        const removedItemId = preDispatchData.itemId;
        if (backendCartId) {
          storeAPI.dispatch(operationStarted({ type: 'item', id: removedItemId, operation: 'removing' }));
          setTimeout(async () => {
            try {
              await removeCartItemFromBackend(backendCartId, removedItemId, storeAPI.getState);
              storeAPI.dispatch(operationCompleted({ type: 'item', id: removedItemId }));
            } catch (error) {
              storeAPI.dispatch(operationFailed({
                type: 'item',
                id: removedItemId,
                error: error instanceof Error ? error.message : 'Failed to remove item',
              }));
            }
          }, DEBOUNCE_MS);
        }
      }

      // Handle backend sync for item quantity updates
      if (UPDATE_ITEM_ACTIONS.includes(actionType)) {
        // Extract itemId for lifecycle tracking
        let updatedItemId: string | undefined;
        if (actionType === 'multiCart/updateItemQuantityInActiveCart') {
          updatedItemId = (action as { payload: { itemId: string } }).payload.itemId;
        } else {
          updatedItemId = (action as { payload: string }).payload;
        }
        if (updatedItemId) {
          storeAPI.dispatch(operationStarted({ type: 'item', id: updatedItemId, operation: 'updating' }));
        }

        setTimeout(async () => {
          try {
            const state = storeAPI.getState();
            const activeCart = state.multiCart.carts.find(
              (c) => c.id === state.multiCart.activeCartId
            );

            if (!activeCart?.backendId) {
              if (updatedItemId) {
                storeAPI.dispatch(operationCompleted({ type: 'item', id: updatedItemId }));
              }
              return;
            }

            if (actionType === 'multiCart/updateItemQuantityInActiveCart') {
              const { itemId, quantity } = (action as { payload: { itemId: string; quantity: number } }).payload;
              const itemExists = activeCart.items.find((i) => i.item.id === itemId);
              const resolvedId = itemExists ? resolveBackendItemId(itemExists.item) : itemId;
              if (itemExists) {
                await updateCartItemOnBackend(activeCart.backendId, resolvedId, quantity, storeAPI.getState);
              } else {
                await removeCartItemFromBackend(activeCart.backendId, resolvedId, storeAPI.getState);
              }
            }

            if (actionType === 'multiCart/incrementItemInActiveCart') {
              const itemId = (action as { payload: string }).payload;
              const item = activeCart.items.find((i) => i.item.id === itemId);
              if (item) {
                const resolvedId = resolveBackendItemId(item.item);
                await updateCartItemOnBackend(activeCart.backendId, resolvedId, item.quantity, storeAPI.getState);
              }
            }

            if (actionType === 'multiCart/decrementItemInActiveCart') {
              const itemId = (action as { payload: string }).payload;
              const item = activeCart.items.find((i) => i.item.id === itemId);
              if (item) {
                const resolvedId = resolveBackendItemId(item.item);
                await updateCartItemOnBackend(activeCart.backendId, resolvedId, item.quantity, storeAPI.getState);
              } else {
                await removeCartItemFromBackend(activeCart.backendId, itemId, storeAPI.getState);
              }
            }

            if (updatedItemId) {
              storeAPI.dispatch(operationCompleted({ type: 'item', id: updatedItemId }));
            }
          } catch (error) {
            if (updatedItemId) {
              storeAPI.dispatch(operationFailed({
                type: 'item',
                id: updatedItemId,
                error: error instanceof Error ? error.message : 'Failed to update item',
              }));
            }
          }
        }, DEBOUNCE_MS);
      }

      // Handle backend sync for clear cart (uses pre-dispatch data)
      if (CLEAR_CART_ACTIONS.includes(actionType) && preDispatchData?.activeCartBackendId) {
        const backendId = preDispatchData.activeCartBackendId;
        setTimeout(async () => {
          await clearCartOnBackend(backendId, storeAPI.getState);
        }, DEBOUNCE_MS);
      }
    }

    return result;
  };

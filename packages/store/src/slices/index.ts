// Re-export slices with explicit names to avoid collisions

// Auth slice
export {
  authSlice,
  setCredentials, setTokens, updateUser, logout, setRequiresPinSetup,
  setLoading as setAuthLoading,
  setError as setAuthError,
  selectCurrentUser, selectAccessToken, selectIsAuthenticated,
  selectAuthLoading, selectAuthError, selectRequiresPinSetup,
} from './authSlice';

// Tenant slice
export {
  tenantSlice,
  setTenant, setTenantConfig, setBranding, clearTenant,
  setLanguage as setTenantLanguage,
  setLoading as setTenantLoading,
  setError as setTenantError,
  selectTenant, selectTenantConfig, selectBranding,
  selectCurrentLanguage, selectTenantLoading, selectTenantError,
} from './tenantSlice';

// Cart slice (legacy single cart)
export {
  cartSlice,
  setCart,
  addItem as addCartItemLegacy,
  updateItemQuantity as updateCartItemQuantity,
  removeItem as removeCartItemLegacy,
  applyCoupon, removeCoupon,
  clearCart as clearCartLegacy,
  setLoading as setCartLoading,
  setError as setCartError,
  selectCart, selectCartItems, selectCartTotalItems,
  selectCartSubtotal, selectCartDiscount, selectCartLoading, selectCartError,
} from './cartSlice';

// Multi-Cart slice
export {
  createCart, deleteCart, renameCart, setActiveCart,
  addItemToActiveCart, removeItemFromActiveCart, removeItemFromCart,
  updateItemQuantityInActiveCart, incrementItemInActiveCart, decrementItemInActiveCart,
  clearActiveCart, setActiveCartStatus, refreshActiveCartPrices,
  markActiveCartAsPaid, markCartAsPaid,
  hydrateMultiCart, syncCartsFromBackend, updateCartBackendId,
  resetMultiCart, clearMultiCartInMemory, clearDeletedCartId,
  selectAllCarts, selectActiveCartId, selectActiveCart, selectActiveCartItems,
  selectActiveCartItemCount, selectActiveCartCategoryCount, selectActiveCartTotalQuantity,
  selectCartCount, selectIsMultiCartHydrated, selectActiveCartGrandTotal,
  selectActiveCartHasPrices, selectTodaysCarts, selectYesterdaysCarts,
  selectCartsByDateRange, selectCartsSortedByDate, selectCartsByStatus,
  selectTodaysMetrics, selectRecentCarts, selectMostRecentDraftCart,
  selectActiveCartIsPaid, selectActiveCartPaymentInfo, selectCanMarkPayment,
  selectTodaysPaidAmount, selectPendingPaymentsCount,
} from './multiCartSlice';
export type { MultiCartState } from './multiCartSlice';
export { default as multiCartReducer } from './multiCartSlice';

// Catalog slice
export {
  initializeCatalog, mergeCatalogFromBackend,
  addCategory, updateCategory, deleteCategory,
  addItem as addCatalogItem,
  updateItem as updateCatalogItem,
  deleteItem as deleteCatalogItem,
  removeItemFromAllCarts, resetCatalog,
  selectCategories, selectItems, selectItemsByCategory,
  selectCategoryById, selectItemById, selectIsCatalogInitialized,
} from './catalogSlice';
export type { CatalogState } from './catalogSlice';
export { default as catalogReducer } from './catalogSlice';

// Settings slice
export {
  setThemeMode,
  setLanguage as setSettingsLanguage,
  setNotificationsEnabled, updateNotificationPreference,
  setPrinterEnabled, setPrinterConnectionType, setSelectedPrinter,
  setPrinterConnectionStatus, setAutoPrint, setPaperSize, setImageWidthDots, setPrintFormat,
  setMerchantUpiId, setMerchantName, setPaymentSettings, hydrateSettings, resetSettings,
  selectThemeMode, selectLanguage, selectNotifications, selectPrinter,
  selectPaymentSettings, selectMerchantUpiId, selectMerchantName,
  selectIsSettingsHydrated, selectSettings,
} from './settingsSlice';
export type {
  PrinterConnectionStatus as SettingsPrinterConnectionStatus,
  PrinterConfig, NotificationPreferences, PaymentSettings, SettingsState,
} from './settingsSlice';
export { default as settingsReducer } from './settingsSlice';

// Subscription slice
export {
  setSubscription, setExpired, clearSubscription,
  setLoading as setSubscriptionLoading,
  setError as setSubscriptionError,
  selectSubscription, selectIsSubscriptionActive, selectIsSubscriptionExpired,
  selectSubscriptionLoading, selectSubscriptionError,
} from './subscriptionSlice';
export { default as subscriptionReducer } from './subscriptionSlice';

// UI slice
export {
  uiSlice,
  setLoading as setUiLoading,
  showToast, hideToast, clearAllToasts,
  openModal, closeModal, closeAllModals,
  setOnlineStatus, setKeyboardVisible,
  selectIsLoading, selectLoadingMessage, selectToasts,
  selectModals, selectIsOnline, selectIsKeyboardVisible,
} from './uiSlice';

// Cart Operations slice
export {
  operationStarted, operationCompleted, operationFailed,
  clearError as clearOperationError,
  clearAllErrors as clearAllOperationErrors,
  resetCartOperations,
  selectIsItemPending, selectItemOperation, selectIsCartPending,
  selectSyncStatus, selectHasPendingOperations,
  selectErrors as selectOperationErrors,
} from './cartOperationsSlice';
export type { ItemOperation, CartOperation, CartOperationsState } from './cartOperationsSlice';
export { default as cartOperationsReducer } from './cartOperationsSlice';

// Picking Cart slice
export {
  addToCart, removeFromCart,
  updateQuantity as updatePickingQuantity,
  incrementQuantity, decrementQuantity,
  clearCart as clearPickingCart,
  setCartStatus as setPickingCartStatus,
  selectPickingCartItems, selectPickingCartTotalItems, selectPickingCartItemCount,
  selectPickingCartCreatedAt, selectPickingCartStatus,
} from './pickingCartSlice';
export type { PickingCartItemState, PickingCartState } from './pickingCartSlice';
export { default as pickingCartReducer } from './pickingCartSlice';

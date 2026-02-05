/**
 * Slice exports
 */

// Auth slice
export {
  authSlice,
  setCredentials,
  setTokens,
  updateUser,
  setLoading as setAuthLoading,
  setError as setAuthError,
  logout,
  selectCurrentUser,
  selectAccessToken,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from './authSlice';

// Cart slice
export {
  cartSlice,
  setCart,
  addItem,
  updateItemQuantity,
  removeItem,
  applyCoupon,
  removeCoupon,
  clearCart,
  setLoading as setCartLoading,
  setError as setCartError,
  selectCart,
  selectCartItems,
  selectCartTotalItems,
  selectCartSubtotal,
  selectCartDiscount,
  selectCartLoading,
  selectCartError,
} from './cartSlice';

// Tenant slice
export {
  tenantSlice,
  setTenant,
  setTenantConfig,
  setBranding,
  setLanguage,
  setLoading as setTenantLoading,
  setError as setTenantError,
  clearTenant,
  selectTenant,
  selectTenantConfig,
  selectBranding,
  selectCurrentLanguage,
  selectTenantLoading,
  selectTenantError,
} from './tenantSlice';

// UI slice
export {
  uiSlice,
  setLoading as setUiLoading,
  showToast,
  hideToast,
  clearAllToasts,
  openModal,
  closeModal,
  closeAllModals,
  setOnlineStatus,
  setKeyboardVisible,
  selectIsLoading,
  selectLoadingMessage,
  selectToasts,
  selectModals,
  selectIsOnline,
  selectIsKeyboardVisible,
} from './uiSlice';

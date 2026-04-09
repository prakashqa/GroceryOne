// Mock for @groceryone/store
export const selectTenant = () => ({ name: 'Test Store', slug: 'test-store' });
export const selectCurrentLanguage = () => 'en';
export const selectTodaysMetrics = () => ({ totalSales: 0, cartsCreated: 0, itemsPicked: 0, totalQuantity: 0 });
export const selectRecentCarts = () => [];
export const selectCategories = () => [];
export const selectItems = () => [];
export const selectActiveCart = () => null;
export const selectActiveCartItems = () => [];
export const selectActiveCartItemCount = () => 0;
export const selectActiveCartGrandTotal = () => 0;
export const selectCartCount = () => 0;
export const selectAllCarts = () => [];
export const selectTodaysCarts = () => [];
export const selectYesterdaysCarts = () => [];
export const selectActiveCartId = () => null;
export const selectCartsByStatus = () => ({ draft: 0, paid: 0, printed: 0 });
export const selectCartsByDateRange = () => [];
export const selectActiveCartHasPrices = () => false;
export const selectActiveCartIsPaid = () => false;
export const selectCanMarkPayment = () => false;
export const selectMerchantUpiId = () => '';
export const selectMerchantName = () => '';

export const addItemToActiveCart = (payload: any) => ({ type: 'cart/addItem', payload });
export const incrementItemInActiveCart = (id: string) => ({ type: 'cart/increment', payload: id });
export const decrementItemInActiveCart = (id: string) => ({ type: 'cart/decrement', payload: id });
export const removeItemFromActiveCart = (id: string) => ({ type: 'cart/remove', payload: id });
export const createCart = (payload: any) => ({ type: 'cart/create', payload });
export const setActiveCart = (id: string) => ({ type: 'cart/setActive', payload: id });
export const deleteCart = (id: string) => ({ type: 'cart/delete', payload: id });
export const renameCart = (payload: any) => ({ type: 'cart/rename', payload });
export const clearActiveCart = () => ({ type: 'cart/clear' });
export const markActiveCartAsPaid = (payload: any) => ({ type: 'cart/markPaid', payload });
export const logout = () => ({ type: 'auth/logout' });
export const clearTenant = () => ({ type: 'tenant/clear' });
export const setCredentials = (payload: any) => ({ type: 'auth/setCredentials', payload });
export const setTenant = (payload: any) => ({ type: 'tenant/set', payload });

export const DomainTypes = {
  createCashPaymentInfo: (received?: number, change?: number) => ({ method: 'cash', received, change }),
  createUpiPaymentInfo: (upiId?: string, ref?: string) => ({ method: 'upi', upiId, ref }),
  createCardPaymentInfo: (last4?: string) => ({ method: 'card', last4 }),
};

/**
 * Web Redux Store Configuration
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  baseApi,
  setStorageAdapter,
  setApiConfig,
  authSlice,
  tenantSlice,
  cartSlice,
  uiSlice,
  multiCartReducer,
  catalogReducer,
  settingsReducer,
  subscriptionReducer,
  cartOperationsReducer,
  pickingCartReducer,
} from '@groceryone/store';
import { webStorageAdapter } from './webStorage';

// Initialize platform adapters
setStorageAdapter(webStorageAdapter);
setApiConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  version: '1.0',
});

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authSlice.reducer,
  cart: cartSlice.reducer,
  tenant: tenantSlice.reducer,
  ui: uiSlice.reducer,
  multiCart: multiCartReducer,
  catalog: catalogReducer,
  settings: settingsReducer,
  subscription: subscriptionReducer,
  cartOperations: cartOperationsReducer,
  pickingCart: pickingCartReducer,
});

export const makeStore = () => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: true,
      }).concat(baseApi.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });

  setupListeners(store.dispatch);
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

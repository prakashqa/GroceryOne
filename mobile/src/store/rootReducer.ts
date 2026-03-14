/**
 * Root Reducer
 * Combines all slice reducers
 */

import { combineReducers } from '@reduxjs/toolkit';

import { baseApi } from '../data/api/baseApi';
import { authSlice } from './slices/authSlice';
import { cartSlice } from './slices/cartSlice';
import { tenantSlice } from './slices/tenantSlice';
import { uiSlice } from './slices/uiSlice';
import pickingCartReducer from './slices/pickingCartSlice';
import settingsReducer from './slices/settingsSlice';
import multiCartReducer from './slices/multiCartSlice';
import catalogReducer from './slices/catalogSlice';
import cartOperationsReducer from './slices/cartOperationsSlice';
import scanReducer from '../features/orderScanning/store/scanSlice';
import pinReducer from '../features/pinAuth/store/pinSlice';
import reportsReducer from '../features/reports/store/reportsSlice';
import subscriptionReducer from './slices/subscriptionSlice';

export const rootReducer = combineReducers({
  // API reducer (RTK Query)
  [baseApi.reducerPath]: baseApi.reducer,

  // Feature slices
  auth: authSlice.reducer,
  cart: cartSlice.reducer,
  tenant: tenantSlice.reducer,
  ui: uiSlice.reducer,
  pickingCart: pickingCartReducer,
  settings: settingsReducer,
  multiCart: multiCartReducer,
  catalog: catalogReducer,
  cartOperations: cartOperationsReducer,
  scan: scanReducer,
  pin: pinReducer,
  reports: reportsReducer,
  subscription: subscriptionReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { rootReducer } from './rootReducer';
import { baseApi } from '../data/api/baseApi';
import { tenantMiddleware } from './middleware/tenantMiddleware';
import { errorMiddleware } from './middleware/errorMiddleware';
import { multiCartPersistMiddleware } from './middleware/multiCartPersistMiddleware';
import { catalogPersistMiddleware } from './middleware/catalogPersistMiddleware';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore specific action types from RTK Query
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'tenant/setTenant'],
        // Ignore date fields in state
        ignoredPaths: [
          'tenant.tenant.createdAt',
          'tenant.tenant.updatedAt',
          'auth.user.createdAt',
          'auth.user.updatedAt',
        ],
      },
    })
      .concat(baseApi.middleware)
      .concat(tenantMiddleware)
      .concat(errorMiddleware)
      .concat(multiCartPersistMiddleware)
      .concat(catalogPersistMiddleware),
  devTools: __DEV__,
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Infer types from the store
export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;

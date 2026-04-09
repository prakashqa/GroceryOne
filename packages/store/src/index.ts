/**
 * @groceryone/store - Shared Redux store package
 *
 * Before creating the store, platforms must call:
 *   setStorageAdapter(adapter)  - for persistence
 *   setApiConfig({ baseUrl })   - for API endpoint resolution
 */

// Adapters
export { setStorageAdapter, getStorageAdapter } from './adapters/storage';
export type { StorageAdapter } from './adapters/storage';

// API (RTK Query endpoints and their types)
export * from './api';

// Slices (Redux slices with renamed exports to avoid collisions)
export * from './slices';

// Domain types (exported under a namespace to avoid collisions with API types)
export * as DomainTypes from './types';

// Utils (exported under namespace to avoid ItemUnit collision with productApi)
export * as StoreUtils from './utils';

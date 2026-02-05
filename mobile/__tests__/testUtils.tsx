/**
 * Test utilities for React Native Testing Library
 */

import React, { PropsWithChildren } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { configureStore } from '@reduxjs/toolkit';

import { rootReducer, RootState } from '../src/store/rootReducer';
import i18n from '../src/i18n/i18n.config';
import { TenantProvider } from '../src/tenant/TenantProvider';
import { ThemeProvider } from '../src/presentation/theme';

// Create a test store with optional preloaded state
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof configureStore>;
}

export function createTestStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
}

function AllProviders({
  children,
  store,
}: PropsWithChildren<{ store: ReturnType<typeof configureStore> }>) {
  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 390, height: 844 },
            insets: { top: 47, left: 0, right: 0, bottom: 34 },
          }}
        >
          <ThemeProvider>
            <TenantProvider>
              <NavigationContainer>{children}</NavigationContainer>
            </TenantProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </I18nextProvider>
    </Provider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren) {
    return <AllProviders store={store}>{children}</AllProviders>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Re-export everything from testing library
export * from '@testing-library/react-native';

// Override render with our custom render
export { renderWithProviders as render };

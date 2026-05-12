/**
 * RoleGate Tests
 *
 * Verifies the role-based screen gate: admins see content, non-admins see
 * the "Access restricted" fallback. This guards against navigation-state
 * restore and direct-navigate bypasses that the bottom-tab gate alone
 * doesn't catch.
 */
/* eslint-disable @typescript-eslint/no-var-requires */

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '../../../store/slices/authSlice';
const authReducer = authSlice.reducer;
import { RoleGate } from '../RoleGate';

jest.mock('../../theme', () => ({
  useTheme: require('../../../__test-utils__/mocks/theme.mock').mockUseTheme,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

const buildStore = (role: 'admin' | 'cashier' | null) => {
  const user = role
    ? {
        id: 'u1',
        tenantId: 't1',
        email: 'x@y.z',
        firstName: 'X',
        lastName: 'Y',
        role,
      }
    : null;
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: user as any,
        accessToken: 'a',
        refreshToken: 'r',
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
        requiresPinSetup: false,
      },
    },
  });
};

const Child = () => <Text testID="child-content">Reports content</Text>;

describe('RoleGate', () => {
  it('renders children when user role is admin', () => {
    const store = buildStore('admin');
    const { getByTestId } = render(
      <Provider store={store}>
        <RoleGate roles={['admin']}>
          <Child />
        </RoleGate>
      </Provider>,
    );

    expect(getByTestId('child-content')).toBeTruthy();
  });

  it('renders fallback when user role is cashier (employee)', () => {
    const store = buildStore('cashier');
    const { queryByTestId, getByText } = render(
      <Provider store={store}>
        <RoleGate roles={['admin']}>
          <Child />
        </RoleGate>
      </Provider>,
    );

    expect(queryByTestId('child-content')).toBeNull();
    expect(getByText('Access restricted')).toBeTruthy();
  });

  it('renders fallback when user is logged out (no role)', () => {
    const store = buildStore(null);
    const { queryByTestId } = render(
      <Provider store={store}>
        <RoleGate roles={['admin']}>
          <Child />
        </RoleGate>
      </Provider>,
    );

    expect(queryByTestId('child-content')).toBeNull();
  });

  it('renders custom fallback when provided', () => {
    const store = buildStore('cashier');
    const { getByText, queryByTestId } = render(
      <Provider store={store}>
        <RoleGate
          roles={['admin']}
          fallback={<Text>Custom denial</Text>}
        >
          <Child />
        </RoleGate>
      </Provider>,
    );

    expect(queryByTestId('child-content')).toBeNull();
    expect(getByText('Custom denial')).toBeTruthy();
  });

  it('allows multiple roles in the list', () => {
    const store = buildStore('cashier');
    const { getByTestId } = render(
      <Provider store={store}>
        <RoleGate roles={['admin', 'cashier']}>
          <Child />
        </RoleGate>
      </Provider>,
    );

    expect(getByTestId('child-content')).toBeTruthy();
  });
});

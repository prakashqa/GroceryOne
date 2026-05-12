/**
 * RoleGate (web) tests
 *
 * Verifies the role-based screen gate on the Next.js side: admins see the
 * page content; non-admins (cashiers/employees) see the "Access restricted"
 * fallback. Defence-in-depth for routes whose URL the user might type
 * directly even though the sidebar link is hidden.
 */

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '@groceryone/store';
import { RoleGate } from '@/components/common/RoleGate';

// Mock react-i18next so default-fallback strings render predictably.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback || _key,
  }),
}));

const buildStore = (role: 'admin' | 'cashier' | null) => {
  const user = role
    ? { id: 'u1', tenantId: 't1', email: 'a@b.c', role }
    : null;
  return configureStore({
    reducer: { auth: authSlice.reducer },
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

const renderWith = (role: 'admin' | 'cashier' | null, children: React.ReactNode) =>
  render(<Provider store={buildStore(role)}>{children}</Provider>);

describe('RoleGate (web)', () => {
  it('renders children for admin', () => {
    renderWith(
      'admin',
      <RoleGate roles={['admin']}>
        <div>Reports dashboard content</div>
      </RoleGate>,
    );
    expect(screen.getByText('Reports dashboard content')).toBeInTheDocument();
  });

  it('renders the access-restricted fallback for cashier', () => {
    renderWith(
      'cashier',
      <RoleGate roles={['admin']}>
        <div>Reports dashboard content</div>
      </RoleGate>,
    );
    expect(screen.queryByText('Reports dashboard content')).not.toBeInTheDocument();
    expect(screen.getByText('Access restricted')).toBeInTheDocument();
  });

  it('renders the access-restricted fallback when logged out', () => {
    renderWith(
      null,
      <RoleGate roles={['admin']}>
        <div>Should not be visible</div>
      </RoleGate>,
    );
    expect(screen.queryByText('Should not be visible')).not.toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    renderWith(
      'cashier',
      <RoleGate roles={['admin']} fallback={<div>Custom block</div>}>
        <div>Reports content</div>
      </RoleGate>,
    );
    expect(screen.getByText('Custom block')).toBeInTheDocument();
    expect(screen.queryByText('Reports content')).not.toBeInTheDocument();
  });
});

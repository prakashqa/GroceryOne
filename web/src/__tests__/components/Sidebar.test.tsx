/**
 * Sidebar RBAC tests
 *
 * Verifies the role-based nav filter: admins see Reports + Employees;
 * cashiers (employees) do not. The page-level RoleGate is the security
 * fallback if someone reaches the URL anyway.
 */

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '@groceryone/store';
import { Sidebar } from '@/components/common/Sidebar';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  );
});

// Mock useSidebar (project-specific UI store)
jest.mock('@/hooks/useSidebar', () => ({
  useSidebar: () => ({
    isOpen: true,
    setIsOpen: jest.fn(),
    collapsed: false,
    setCollapsed: jest.fn(),
  }),
}));

// Mock useAppDispatch
jest.mock('@/hooks/useAppDispatch', () => ({
  useAppDispatch: () => jest.fn(),
}));

// i18n: return the fallback string passed to t() so test labels are predictable.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const map: Record<string, string> = {
        'navigation.dashboard': 'Dashboard',
        'navigation.picking': 'Picking',
        'navigation.carts': 'Orders',
        'navigation.items': 'Items',
        'navigation.reports': 'Reports',
        'navigation.inventory': 'Inventory',
        'navigation.scan': 'Scan Order',
        'navigation.categories': 'Categories',
        'navigation.productList': 'Product List',
        'navigation.employees': 'Employees',
        'more.sections.management': 'Management',
        'more.settings': 'Settings',
        'more.logout': 'Logout',
        appName: 'GroOne',
      };
      return map[key] ?? fallback ?? key;
    },
  }),
}));

const buildStore = (role: 'admin' | 'cashier') =>
  configureStore({
    reducer: { auth: authSlice.reducer },
    preloadedState: {
      auth: {
        user: { id: 'u1', tenantId: 't1', email: 'a@b.c', role } as any,
        accessToken: 'a',
        refreshToken: 'r',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        requiresPinSetup: false,
      },
    },
  });

const renderSidebar = (role: 'admin' | 'cashier') =>
  render(
    <Provider store={buildStore(role)}>
      <Sidebar />
    </Provider>,
  );

describe('Sidebar RBAC', () => {
  it('admin sees Reports in the main nav', () => {
    renderSidebar('admin');
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('cashier (employee) does NOT see Reports', () => {
    renderSidebar('cashier');
    expect(screen.queryByText('Reports')).not.toBeInTheDocument();
  });

  it('admin sees Employees row in Management section', () => {
    renderSidebar('admin');
    expect(screen.getByText('Employees')).toBeInTheDocument();
  });

  it('cashier (employee) does NOT see Employees row', () => {
    renderSidebar('cashier');
    expect(screen.queryByText('Employees')).not.toBeInTheDocument();
  });

  it('cashier still sees the core operational nav (Dashboard / Picking / Orders / Items)', () => {
    renderSidebar('cashier');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Picking')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
  });

  it('shows the dedicated "Scan Barcode" entry (linking to /scan-barcode) for all roles', () => {
    renderSidebar('cashier');
    const link = screen.getByText('Scan Barcode').closest('a');
    expect(link).toHaveAttribute('href', '/scan-barcode');
  });
});

describe('Sidebar — desktop build (vendor mint screen hidden)', () => {
  const OLD = process.env.NEXT_PUBLIC_DESKTOP_BUILD;
  afterEach(() => {
    if (OLD === undefined) delete process.env.NEXT_PUBLIC_DESKTOP_BUILD;
    else process.env.NEXT_PUBLIC_DESKTOP_BUILD = OLD;
  });

  it('admin sees Desktop licenses in the cloud build (flag unset)', () => {
    delete process.env.NEXT_PUBLIC_DESKTOP_BUILD;
    renderSidebar('admin');
    expect(screen.getByText('Desktop licenses')).toBeInTheDocument();
  });

  it('admin does NOT see Desktop licenses in the desktop build (flag=1)', () => {
    process.env.NEXT_PUBLIC_DESKTOP_BUILD = '1';
    renderSidebar('admin');
    expect(screen.queryByText('Desktop licenses')).not.toBeInTheDocument();
    // Other admin items unaffected.
    expect(screen.getByText('Employees')).toBeInTheDocument();
  });
});

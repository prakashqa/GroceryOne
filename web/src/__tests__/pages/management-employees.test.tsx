import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/management/employees',
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, f?: any) => (typeof f === 'string' ? f : k) }),
}));
// The page reads the tenant via react-redux useSelector; the mocked selectTenant
// ignores state, so returning sel() is enough.
jest.mock('react-redux', () => ({ useSelector: (sel: any) => sel() }));
// RoleGate gates on Redux role; bypass it so we test the page body directly.
jest.mock('@/components/common/RoleGate', () => ({ RoleGate: ({ children }: any) => children }));

import EmployeesPage from '@/app/(dashboard)/management/employees/page';

const emp = (over: any = {}) => ({
  id: 'e1', firstName: 'Asha', lastName: 'K', phone: '9876543210',
  role: 'cashier', status: 'active', createdAt: '', ...over,
});

describe('EmployeesPage (RTK — no manual localStorage fetch)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('renders the list from useGetEmployeesQuery', () => {
    const store = require('@groceryone/store');
    store.useGetEmployeesQuery = () => ({ data: [emp()], isLoading: false, error: undefined });
    render(<EmployeesPage />);
    expect(screen.getByText('Asha K')).toBeInTheDocument();
  });

  it('surfaces a backend error from the real { data: { error: { message } } } envelope', () => {
    // baseApi wraps backend errors as { error: { code, message } } — the page
    // must read data.error.message, not just data.message.
    const store = require('@groceryone/store');
    store.useGetEmployeesQuery = () => ({
      data: undefined,
      isLoading: false,
      error: { status: 400, data: { success: false, error: { code: 'TENANT_NOT_FOUND', message: 'Tenant context not available.' } } },
    });
    render(<EmployeesPage />);
    expect(screen.getByText('Tenant context not available.')).toBeInTheDocument();
  });

  it('also surfaces a top-level { data: { message } } error shape', () => {
    const store = require('@groceryone/store');
    store.useGetEmployeesQuery = () => ({
      data: undefined, isLoading: false, error: { status: 401, data: { message: 'Unauthorized' } },
    });
    render(<EmployeesPage />);
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });

  it('shows the empty state when there are no employees', () => {
    const store = require('@groceryone/store');
    store.useGetEmployeesQuery = () => ({ data: [], isLoading: false, error: undefined });
    render(<EmployeesPage />);
    expect(screen.getByText('No employees yet')).toBeInTheDocument();
  });

  it('creates an employee through the mutation hook (in-memory token path)', async () => {
    const calls: any[] = [];
    const store = require('@groceryone/store');
    store.useGetEmployeesQuery = () => ({ data: [], isLoading: false, error: undefined });
    store.useCreateEmployeeMutation = () => [
      (b: any) => { calls.push(b); return { unwrap: () => Promise.resolve({}) }; },
      { isLoading: false },
    ];

    render(<EmployeesPage />);
    fireEvent.click(screen.getByText('Add employee'));
    fireEvent.change(screen.getByTestId('emp-firstName'), { target: { value: 'Asha' } });
    fireEvent.change(screen.getByTestId('emp-phone'), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByTestId('emp-pin'), { target: { value: '1234' } });
    fireEvent.change(screen.getByTestId('emp-confirmPin'), { target: { value: '1234' } });
    fireEvent.click(screen.getByTestId('emp-submit'));

    await waitFor(() => expect(calls).toEqual([
      { firstName: 'Asha', lastName: undefined, phone: '9876543210', pin: '1234' },
    ]));
  });
});

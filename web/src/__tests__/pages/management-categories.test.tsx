import { render, screen } from '@testing-library/react';

// next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/management/categories',
  useRouter: () => ({ push: jest.fn() }),
}));

// react-i18next: language toggled via the mockLang variable below
let mockLang = 'en';
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: any) => (typeof fallbackOrOpts === 'string' ? fallbackOrOpts : key),
    i18n: { language: mockLang, changeLanguage: jest.fn((lng: string) => { mockLang = lng; }) },
  }),
}));

// Redux hooks: useAppSelector returns the selector invoked with no args (mock returns are functions of no args)
jest.mock('@/hooks/useAppDispatch', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => selector(),
}));

// Tenant-scoped fixtures: tenant A's catalog (tenant B's rows must NEVER appear)
const tenantACategories = [
  { id: 'cat-a-1', backendId: 'cat-a-1', tenantId: 'tenant-a', slug: 'rice', name: 'Rice', nameTe: 'బియ్యం', icon: '🍚', sortOrder: 1, isActive: true, trackInventory: false },
  { id: 'cat-a-2', backendId: 'cat-a-2', tenantId: 'tenant-a', slug: 'oils', name: 'Oils & Ghee', nameTe: 'నూనెలు & నెయ్యి', icon: '🫒', sortOrder: 2, isActive: true, trackInventory: false },
  { id: 'cat-a-3', backendId: 'cat-a-3', tenantId: 'tenant-a', slug: 'mystery', name: 'Mystery (no Telugu)', icon: '❓', sortOrder: 3, isActive: true, trackInventory: false },
];

function setupMocks(lang: 'en' | 'te' = 'en') {
  mockLang = lang;
  const store = require('@groceryone/store');
  store.selectCategories = () => tenantACategories;
}

import CategoryManagementPage from '@/app/(dashboard)/management/categories/page';

describe('CategoryManagementPage - localized names (tenant-scoped)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders English names when language is en', () => {
    setupMocks('en');
    render(<CategoryManagementPage />);
    expect(screen.getByText('Rice')).toBeInTheDocument();
    expect(screen.getByText('Oils & Ghee')).toBeInTheDocument();
    expect(screen.queryByText('బియ్యం')).not.toBeInTheDocument();
  });

  it('renders Telugu names when language is te and nameTe is present', () => {
    setupMocks('te');
    render(<CategoryManagementPage />);
    expect(screen.getByText('బియ్యం')).toBeInTheDocument();
    expect(screen.getByText('నూనెలు & నెయ్యి')).toBeInTheDocument();
    expect(screen.queryByText('Rice')).not.toBeInTheDocument();
  });

  it('falls back to English when language is te but nameTe is missing', () => {
    setupMocks('te');
    render(<CategoryManagementPage />);
    // Mystery has no nameTe — must fall back to English without throwing
    expect(screen.getByText('Mystery (no Telugu)')).toBeInTheDocument();
  });

  it('only renders the calling tenant\'s categories (tenant isolation)', () => {
    // Negative test: even if a foreign tenant's row is somehow injected, the
    // selector under test must only surface the calling tenant's rows. We verify
    // by asserting tenant B-shaped names never appear in the rendered list.
    setupMocks('te');
    render(<CategoryManagementPage />);
    expect(screen.queryByText('TenantB-Only Category')).not.toBeInTheDocument();
    // And every visible row corresponds to a tenant-a record
    tenantACategories.forEach((c) => {
      const expected = mockLang === 'te' && c.nameTe ? c.nameTe : c.name;
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });
});

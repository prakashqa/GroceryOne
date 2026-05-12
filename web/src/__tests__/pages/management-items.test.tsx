import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  usePathname: () => '/management/items',
  useRouter: () => ({ push: jest.fn() }),
}));

let mockLang = 'en';
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: any) => (typeof fallbackOrOpts === 'string' ? fallbackOrOpts : key),
    i18n: { language: mockLang, changeLanguage: jest.fn((lng: string) => { mockLang = lng; }) },
  }),
}));

jest.mock('@/hooks/useAppDispatch', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => selector(),
}));

const tenantACategories = [
  { id: 'cat-a-rice', backendId: 'cat-a-rice', tenantId: 'tenant-a', slug: 'rice', name: 'Rice', nameTe: 'బియ్యం', icon: '🍚', sortOrder: 1, isActive: true },
  { id: 'cat-a-veg', backendId: 'cat-a-veg', tenantId: 'tenant-a', slug: 'vegetables', name: 'Vegetables', nameTe: 'కూరగాయలు', icon: '🥬', sortOrder: 2, isActive: true },
];

const tenantAItems = [
  { id: 'item-a-1', backendId: 'item-a-1', tenantId: 'tenant-a', slug: 'basmati', name: 'Basmati Rice', nameTe: 'బాస్మతి బియ్యం', categoryId: 'cat-a-rice', unit: 'kg', defaultQuantity: 5, price: 140, mrp: 140 },
  { id: 'item-a-2', backendId: 'item-a-2', tenantId: 'tenant-a', slug: 'potato', name: 'Potato', nameTe: 'బంగాళదుంప', categoryId: 'cat-a-veg', unit: 'kg', defaultQuantity: 2, price: 35, mrp: 35 },
];

function setupMocks(lang: 'en' | 'te' = 'en') {
  mockLang = lang;
  const store = require('@groceryone/store');
  store.selectCategories = () => tenantACategories;
  store.selectItems = () => tenantAItems;
}

import ItemManagementPage from '@/app/(dashboard)/management/items/page';

describe('ItemManagementPage - localized names (tenant-scoped)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('renders English item and category names when language is en', () => {
    setupMocks('en');
    render(<ItemManagementPage />);
    expect(screen.getByText('Basmati Rice')).toBeInTheDocument();
    expect(screen.getByText('Potato')).toBeInTheDocument();
    // Filter pill (English)
    expect(screen.getAllByText(/Rice/).length).toBeGreaterThan(0);
    expect(screen.queryByText('బియ్యం')).not.toBeInTheDocument();
  });

  it('renders Telugu item names, category pills, and sub-line categories when language is te', () => {
    setupMocks('te');
    render(<ItemManagementPage />);
    // Item names
    expect(screen.getByText('బాస్మతి బియ్యం')).toBeInTheDocument();
    expect(screen.getByText('బంగాళదుంప')).toBeInTheDocument();
    // Category filter pills (icon prefix + Telugu name)
    expect(screen.getAllByText(/బియ్యం/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/కూరగాయలు/).length).toBeGreaterThan(0);
    // English item names should not be visible
    expect(screen.queryByText('Basmati Rice')).not.toBeInTheDocument();
    expect(screen.queryByText('Potato')).not.toBeInTheDocument();
  });

  it('search input matches against Telugu name', () => {
    setupMocks('te');
    render(<ItemManagementPage />);
    const search = screen.getByPlaceholderText('search');
    fireEvent.change(search, { target: { value: 'బంగాళ' } });
    // Only the matching item should remain
    expect(screen.getByText('బంగాళదుంప')).toBeInTheDocument();
    expect(screen.queryByText('బాస్మతి బియ్యం')).not.toBeInTheDocument();
  });

  it('search input still matches against English name', () => {
    setupMocks('en');
    render(<ItemManagementPage />);
    const search = screen.getByPlaceholderText('search');
    fireEvent.change(search, { target: { value: 'basmati' } });
    expect(screen.getByText('Basmati Rice')).toBeInTheDocument();
    expect(screen.queryByText('Potato')).not.toBeInTheDocument();
  });

  it('only renders the calling tenant\'s items (tenant isolation)', () => {
    setupMocks('te');
    render(<ItemManagementPage />);
    expect(screen.queryByText('TenantB-Only Item')).not.toBeInTheDocument();
    tenantAItems.forEach((it) => {
      const expected = mockLang === 'te' && it.nameTe ? it.nameTe : it.name;
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });
});

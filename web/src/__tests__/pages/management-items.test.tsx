import { render, screen, fireEvent, waitFor } from '@testing-library/react';

let mockBarcodeParam: string | null = null;
jest.mock('next/navigation', () => ({
  usePathname: () => '/management/items',
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: (k: string) => (k === 'barcode' ? mockBarcodeParam : null) }),
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
  beforeEach(() => { jest.clearAllMocks(); mockBarcodeParam = null; });

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

describe('ItemManagementPage - barcode scanning', () => {
  beforeEach(() => { jest.clearAllMocks(); mockBarcodeParam = null; });

  /** Emit a barcode as a fast keyboard-wedge burst on window. */
  function wedgeScan(code: string) {
    let now = 1000;
    const spy = jest.spyOn(performance, 'now').mockImplementation(() => now);
    for (const key of code.split('')) { now += 10; fireEvent.keyDown(window, { key }); }
    now += 10;
    fireEvent.keyDown(window, { key: 'Enter' });
    spy.mockRestore();
  }

  it('fills the barcode field from a USB-scanner burst while the Add form is open', () => {
    setupMocks('en');
    render(<ItemManagementPage />);
    // Open the Add Item form.
    fireEvent.click(screen.getAllByText('manageItems.addItem')[0]);
    wedgeScan('8901234567890');
    const barcodeInput = screen.getByPlaceholderText(/Barcode/i) as HTMLInputElement;
    expect(barcodeInput.value).toBe('8901234567890');
  });

  it('does NOT capture scanner input when the form is closed (wedge disabled)', () => {
    setupMocks('en');
    render(<ItemManagementPage />);
    wedgeScan('8901234567890');
    // Form is closed, so there is no barcode input to populate.
    expect(screen.queryByPlaceholderText(/Barcode/i)).not.toBeInTheDocument();
  });

  it('prefills the barcode + opens the form from the ?barcode= deep link', () => {
    mockBarcodeParam = '5555000011112';
    setupMocks('en');
    render(<ItemManagementPage />);
    const barcodeInput = screen.getByPlaceholderText(/Barcode/i) as HTMLInputElement;
    expect(barcodeInput.value).toBe('5555000011112');
  });

  it('renders a camera scan button next to the barcode field', () => {
    setupMocks('en');
    render(<ItemManagementPage />);
    fireEvent.click(screen.getAllByText('manageItems.addItem')[0]);
    expect(screen.getByLabelText('Scan barcode')).toBeInTheDocument();
  });

  it('shows "No barcode" on rows whose item has no barcode', () => {
    setupMocks('en'); // tenantAItems have no barcode
    render(<ItemManagementPage />);
    expect(screen.getAllByText('No barcode').length).toBe(tenantAItems.length);
  });

  it('shows the stored barcode on a row when the item has one', () => {
    const store = require('@groceryone/store');
    store.selectCategories = () => tenantACategories;
    store.selectItems = () => [{ ...tenantAItems[0], barcode: '2000000000022' }];
    render(<ItemManagementPage />);
    expect(screen.getByText('2000000000022')).toBeInTheDocument();
    expect(screen.queryByText('No barcode')).not.toBeInTheDocument();
  });
});

describe('ItemManagementPage - Pricing|Stock tabs', () => {
  beforeEach(() => { jest.clearAllMocks(); mockBarcodeParam = null; });

  function captureCreate() {
    const calls: any[] = [];
    const store = require('@groceryone/store');
    store.selectCategories = () => tenantACategories;
    store.selectItems = () => tenantAItems;
    store.useCreateItemMutation = () => [
      (payload: any) => { calls.push(payload); return { unwrap: () => Promise.resolve({}) }; },
      {},
    ];
    return calls;
  }

  it('renders Pricing and Stock tabs in the form', () => {
    captureCreate();
    render(<ItemManagementPage />);
    fireEvent.click(screen.getAllByText('manageItems.addItem')[0]);
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
  });

  it('sends stock fields + auto-track when an Opening Quantity is entered', async () => {
    const calls = captureCreate();
    render(<ItemManagementPage />);
    fireEvent.click(screen.getAllByText('manageItems.addItem')[0]);
    // name + category
    fireEvent.change(screen.getByPlaceholderText('manageItems.enterItemName'), { target: { value: 'New Rice' } });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'cat-a-rice' } });
    // Stock tab
    fireEvent.click(screen.getByText('Stock'));
    fireEvent.change(screen.getByPlaceholderText(/Opening Quantity/i), { target: { value: '8' } });
    fireEvent.change(screen.getByPlaceholderText(/At Price/i), { target: { value: '120' } });
    fireEvent.change(screen.getByPlaceholderText(/Min Stock/i), { target: { value: '10' } });
    fireEvent.click(screen.getByText('save'));

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toEqual(expect.objectContaining({
      stockQuantity: 8, trackInventory: true, costPrice: 120, lowStockThreshold: 10,
    }));
  });

  it('omits stock/trackInventory when Opening Quantity is blank', async () => {
    const calls = captureCreate();
    render(<ItemManagementPage />);
    fireEvent.click(screen.getAllByText('manageItems.addItem')[0]);
    fireEvent.change(screen.getByPlaceholderText('manageItems.enterItemName'), { target: { value: 'Loose Rice' } });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'cat-a-rice' } });
    fireEvent.click(screen.getByText('save'));

    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0].stockQuantity).toBeUndefined();
    expect(calls[0].trackInventory).toBeUndefined();
  });

  it('pre-fills stock fields from the item on edit', () => {
    const store = require('@groceryone/store');
    store.selectCategories = () => tenantACategories;
    store.selectItems = () => [{ ...tenantAItems[0], stockQuantity: 7, costPrice: 95, lowStockThreshold: 4 }];
    render(<ItemManagementPage />);
    fireEvent.click(screen.getByLabelText('Edit'));
    fireEvent.click(screen.getByText('Stock'));
    expect((screen.getByPlaceholderText(/Opening Quantity/i) as HTMLInputElement).value).toBe('7');
    expect((screen.getByPlaceholderText(/At Price/i) as HTMLInputElement).value).toBe('95');
    expect((screen.getByPlaceholderText(/Min Stock/i) as HTMLInputElement).value).toBe('4');
  });
});

describe('ItemManagementPage - delete item', () => {
  beforeEach(() => { jest.clearAllMocks(); mockBarcodeParam = null; });

  /** Mock the delete mutation; `resolved` controls success vs rejection. */
  function captureDelete(resolved = true) {
    const calls: any[] = [];
    const store = require('@groceryone/store');
    store.selectCategories = () => tenantACategories;
    store.selectItems = () => tenantAItems;
    store.useDeleteItemMutation = () => [
      (id: any) => {
        calls.push(id);
        return { unwrap: () => (resolved ? Promise.resolve(undefined) : Promise.reject({ data: '' })) };
      },
      {},
    ];
    return calls;
  }

  it('deletes via backendId and shows no error alert on a resolved (204) delete', async () => {
    const calls = captureDelete(true);
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ItemManagementPage />);
    fireEvent.click(screen.getAllByLabelText('Delete')[0]);

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(calls).toEqual(['item-a-1']));
    expect(alertSpy).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('does not delete when the confirm dialog is cancelled', () => {
    const calls = captureDelete(true);
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ItemManagementPage />);
    fireEvent.click(screen.getAllByLabelText('Delete')[0]);

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([]);

    confirmSpy.mockRestore();
  });
});

describe('ItemManagementPage - Generate test barcodes (gated test tool)', () => {
  const OLD_FLAG = process.env.NEXT_PUBLIC_ENABLE_TEST_TOOLS;

  function setupAdmin() {
    const store = require('@groceryone/store');
    store.selectCategories = () => tenantACategories;
    store.selectItems = () => tenantAItems;
    store.selectIsAdmin = () => true;
    store.selectTenant = () => ({ slug: 'test2-business', name: 'Test2 Business' });
  }

  beforeEach(() => { jest.clearAllMocks(); mockBarcodeParam = null; });
  afterEach(() => {
    if (OLD_FLAG === undefined) delete process.env.NEXT_PUBLIC_ENABLE_TEST_TOOLS;
    else process.env.NEXT_PUBLIC_ENABLE_TEST_TOOLS = OLD_FLAG;
    // Restore admin selector so other suites aren't affected.
    const store = require('@groceryone/store');
    store.selectIsAdmin = (s: any) => s?.auth?.user?.role === 'admin';
  });

  it('shows the button (flag on, admin) and lists assigned codes after clicking', async () => {
    process.env.NEXT_PUBLIC_ENABLE_TEST_TOOLS = '1';
    setupAdmin();
    const store = require('@groceryone/store');
    const trigger = jest.fn(() => ({
      unwrap: () => Promise.resolve({ updated: 1, skipped: 0, assignments: [{ name: 'Basmati Rice', barcode: '2000000000015' }] }),
    }));
    store.useAssignTestBarcodesMutation = () => [trigger, { isLoading: false }];

    render(<ItemManagementPage />);
    fireEvent.click(screen.getByTestId('generate-test-barcodes'));
    expect(trigger).toHaveBeenCalled();
    expect(await screen.findByText('2000000000015')).toBeInTheDocument();
  });

  it('hides the button when the test-tools flag is off (cloud-safe)', () => {
    delete process.env.NEXT_PUBLIC_ENABLE_TEST_TOOLS;
    setupAdmin();
    render(<ItemManagementPage />);
    expect(screen.queryByTestId('generate-test-barcodes')).toBeNull();
  });

  it('works even when Redux has no tenant (baseApi owns auth/tenant; no slug arg)', async () => {
    process.env.NEXT_PUBLIC_ENABLE_TEST_TOOLS = '1';
    const store = require('@groceryone/store');
    store.selectCategories = () => tenantACategories;
    store.selectItems = () => tenantAItems;
    store.selectIsAdmin = () => true;
    store.selectTenant = () => null; // Redux tenant not hydrated
    const trigger = jest.fn(() => ({ unwrap: () => Promise.resolve({ updated: 1, skipped: 0, assignments: [] }) }));
    store.useAssignTestBarcodesMutation = () => [trigger, { isLoading: false }];

    render(<ItemManagementPage />);
    fireEvent.click(screen.getByTestId('generate-test-barcodes'));
    expect(trigger).toHaveBeenCalledWith(); // no slug argument
  });
});

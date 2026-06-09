import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => '/scan-barcode',
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: any) => (typeof fallbackOrOpts === 'string' ? fallbackOrOpts : key),
    i18n: { language: 'en' },
  }),
}));

const mockDispatch = jest.fn();
jest.mock('@/hooks/useAppDispatch', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) => selector(),
}));

// Stub the camera so jsdom never touches getUserMedia.
jest.mock('@/components/barcode/BarcodeScanner', () => ({
  BarcodeScanner: () => <div data-testid="camera-stub" />,
}));

const RICE = { id: 'r1', name: 'Rice 1kg', barcode: '8901234567890', categoryId: 'c1', unit: 'kg', defaultQuantity: 1, price: 50, isActive: true, sortOrder: 1, slug: 'rice', createdAt: '', updatedAt: '' };

function setItems(items: any[]) {
  const store = require('@groceryone/store');
  store.selectItems = () => items;
}

import ScanBarcodePage from '@/app/(dashboard)/scan-barcode/page';

function wedgeScan(code: string) {
  let now = 1000;
  const spy = jest.spyOn(performance, 'now').mockImplementation(() => now);
  for (const key of code.split('')) { now += 10; fireEvent.keyDown(window, { key }); }
  now += 10;
  fireEvent.keyDown(window, { key: 'Enter' });
  spy.mockRestore();
}

describe('ScanBarcodePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setItems([RICE]);
  });

  it('renders the Scan Barcode heading', () => {
    render(<ScanBarcodePage />);
    expect(screen.getByRole('heading', { name: /scan barcode/i })).toBeInTheDocument();
  });

  it('adds a known scanned barcode to the cart and lists it as recently scanned', async () => {
    render(<ScanBarcodePage />);
    wedgeScan('8901234567890');
    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'cart/addItem' })),
    );
    expect(await screen.findByText('Rice 1kg')).toBeInTheDocument();
  });

  it('offers "Add product" for an unknown barcode and routes with the code', async () => {
    render(<ScanBarcodePage />);
    wedgeScan('0000000000000');
    const addBtn = await screen.findByRole('button', { name: /add this product/i });
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'cart/addItem' }));
    fireEvent.click(addBtn);
    expect(mockPush).toHaveBeenCalledWith('/management/items?barcode=0000000000000');
  });

  // The manual box works regardless of keystroke timing — covers slow/erratic
  // Bluetooth phone HID scanners and hand-typed codes.
  it('auto-focuses the manual scan box on mount', () => {
    render(<ScanBarcodePage />);
    const box = screen.getByPlaceholderText(/scan or type/i);
    expect(box).toHaveFocus();
  });

  it('adds a known code typed into the manual box on Enter, then clears it', async () => {
    render(<ScanBarcodePage />);
    const box = screen.getByPlaceholderText(/scan or type/i) as HTMLInputElement;
    fireEvent.change(box, { target: { value: '8901234567890' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'cart/addItem' })),
    );
    expect(await screen.findByText('Rice 1kg')).toBeInTheDocument();
    expect(box.value).toBe('');
  });

  it('shows "Add product" for an unknown manual entry', async () => {
    render(<ScanBarcodePage />);
    const box = screen.getByPlaceholderText(/scan or type/i);
    fireEvent.change(box, { target: { value: '0000000000000' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(await screen.findByRole('button', { name: /add this product/i })).toBeInTheDocument();
  });

  it('ignores an empty manual submit', () => {
    render(<ScanBarcodePage />);
    const box = screen.getByPlaceholderText(/scan or type/i);
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

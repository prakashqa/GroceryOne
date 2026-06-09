import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => '/picking',
  useRouter: () => ({ push: mockPush }),
}));

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

const RICE = { id: 'r1', name: 'Rice 1kg', barcode: '8901234567890', categoryId: 'c1', unit: 'kg', defaultQuantity: 1, price: 50, isActive: true, sortOrder: 1, slug: 'rice', createdAt: '', updatedAt: '' };

function setItems(items: any[]) {
  const store = require('@groceryone/store');
  store.selectItems = () => items;
}

import PickingPage from '@/app/(dashboard)/picking/page';

/** Emit a barcode as a fast keyboard-wedge burst on window. */
function wedgeScan(code: string) {
  let now = 1000;
  const spy = jest.spyOn(performance, 'now').mockImplementation(() => now);
  for (const key of code.split('')) {
    now += 10;
    fireEvent.keyDown(window, { key });
  }
  now += 10;
  fireEvent.keyDown(window, { key: 'Enter' });
  spy.mockRestore();
}

describe('PickingPage — USB keyboard-wedge scanning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setItems([RICE]);
  });

  it('adds a scanned (known) barcode to the active cart without opening the modal', async () => {
    render(<PickingPage />);
    wedgeScan('8901234567890');
    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'cart/addItem' })),
    );
    const addCall = mockDispatch.mock.calls.find((c) => c[0]?.type === 'cart/addItem');
    expect(addCall![0].payload.item.id).toBe('r1');
  });

  it('shows a not-found toast with an "Add product" shortcut for an unknown barcode', async () => {
    render(<PickingPage />);
    wedgeScan('0000000000000');

    const addLink = await screen.findByRole('button', { name: /add product/i });
    // No cart add happened for the unknown code.
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'cart/addItem' }));
    fireEvent.click(addLink);
    expect(mockPush).toHaveBeenCalledWith('/management/items?barcode=0000000000000');
  });
});

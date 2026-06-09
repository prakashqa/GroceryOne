import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// i18next: return the fallback string when provided, else the key.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: any) =>
      typeof fallbackOrOpts === 'string' ? fallbackOrOpts : key,
  }),
}));

// Redux hooks — selector invoked with no args (store mock returns thunks of none).
jest.mock('@/hooks/useAppDispatch', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => selector(),
}));

// Stub the camera scanner with a button that fires onScan with a controllable
// barcode, so we never touch html5-qrcode / getUserMedia in jsdom.
let nextScan = '';
jest.mock('@/components/barcode/BarcodeScanner', () => ({
  BarcodeScanner: ({ onScan }: { onScan: (b: string) => void }) => (
    <button onClick={() => onScan(nextScan)}>fire-scan</button>
  ),
}));

import { BarcodeScannerModal } from '@/components/barcode/BarcodeScannerModal';

const RICE = { id: '1', name: 'Rice 1kg', barcode: '8901234567890', unit: 'kg', defaultQuantity: 1, price: 50 };

function setItems(items: any[]) {
  const store = require('@groceryone/store');
  store.selectItems = () => items;
}
function setLazyResult(result: any | (() => Promise<any>)) {
  const store = require('@groceryone/store');
  store.useLazyGetItemByBarcodeQuery = () => [
    jest.fn(() => ({ unwrap: () => (typeof result === 'function' ? result() : Promise.resolve(result)) })),
    {},
  ];
}

describe('BarcodeScannerModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nextScan = '';
    setItems([]);
    setLazyResult(null);
  });

  it('resolves a local catalog hit and notifies the caller (caller owns cart-add)', async () => {
    setItems([RICE]);
    nextScan = '8901234567890';
    const onItemResolved = jest.fn();
    render(<BarcodeScannerModal onClose={jest.fn()} onItemResolved={onItemResolved} />);

    fireEvent.click(screen.getByText('fire-scan'));

    await waitFor(() => expect(onItemResolved).toHaveBeenCalledTimes(1));
    expect(onItemResolved.mock.calls[0][0].id).toBe('1');
    expect(await screen.findByText('Rice 1kg')).toBeInTheDocument();
  });

  it('falls back to the backend and notifies on a remote hit', async () => {
    const remote = { id: '99', name: 'New Remote', barcode: '5555000011112', unit: 'pcs', defaultQuantity: 1 };
    setItems([]); // not in local catalog
    setLazyResult(remote);
    nextScan = '5555000011112';
    const onItemResolved = jest.fn();
    render(<BarcodeScannerModal onClose={jest.fn()} onItemResolved={onItemResolved} />);

    fireEvent.click(screen.getByText('fire-scan'));

    await waitFor(() => expect(onItemResolved).toHaveBeenCalledTimes(1));
    expect(onItemResolved.mock.calls[0][0].id).toBe('99');
  });

  it('shows a not-found state with an "Add this product" CTA that passes the barcode', async () => {
    setItems([]);
    setLazyResult(null); // backend has nothing
    nextScan = '0000000000000';
    const onAddProduct = jest.fn();
    render(<BarcodeScannerModal onClose={jest.fn()} onAddProduct={onAddProduct} />);

    fireEvent.click(screen.getByText('fire-scan'));

    const addBtn = await screen.findByRole('button', { name: /add this product/i });
    expect(screen.getByText('0000000000000')).toBeInTheDocument();
    fireEvent.click(addBtn);
    expect(onAddProduct).toHaveBeenCalledWith('0000000000000');
  });

  it('does not call onItemResolved when nothing matches', async () => {
    setItems([]);
    nextScan = '0000000000000';
    const onItemResolved = jest.fn();
    render(<BarcodeScannerModal onClose={jest.fn()} onItemResolved={onItemResolved} onAddProduct={jest.fn()} />);

    fireEvent.click(screen.getByText('fire-scan'));
    await screen.findByRole('button', { name: /add this product/i });
    expect(onItemResolved).not.toHaveBeenCalled();
  });

  it('capture mode (onRawScan) returns the raw code without resolving to an item', async () => {
    setItems([RICE]); // even a known code must NOT auto-resolve in capture mode
    nextScan = '8901234567890';
    const onRawScan = jest.fn();
    const onItemResolved = jest.fn();
    render(<BarcodeScannerModal onClose={jest.fn()} onRawScan={onRawScan} onItemResolved={onItemResolved} />);

    fireEvent.click(screen.getByText('fire-scan'));

    await waitFor(() => expect(onRawScan).toHaveBeenCalledWith('8901234567890'));
    expect(onItemResolved).not.toHaveBeenCalled();
  });

  it('calls onClose from the header close button', () => {
    const onClose = jest.fn();
    render(<BarcodeScannerModal onClose={onClose} />);
    fireEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalled();
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock next/link
jest.mock('next/link', () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  );
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/orders/test-id',
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock i18n - returns fallback if provided, otherwise the key
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: any) => {
      if (typeof fallbackOrOpts === 'string') return fallbackOrOpts;
      return key;
    },
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
}));

// Mock useMediaQuery
const mockUseMediaQuery = jest.fn();
jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: (...args: any[]) => mockUseMediaQuery(...args),
}));

// Mock Redux hooks
const mockDispatch = jest.fn();
jest.mock('@/hooks/useAppDispatch', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) => selector(),
}));

// Default mock state
const mockCart = {
  id: 'cart-1',
  name: 'Order 12:04 PM',
  status: 'draft',
  items: [
    { item: { id: 'item-1', name: 'Tea', categoryId: 'cat-1', unit: 'gm' }, quantity: 500, priceSnapshot: 440 },
    { item: { id: 'item-2', name: 'Potato', categoryId: 'cat-2', unit: 'kg' }, quantity: 2, priceSnapshot: 35 },
  ],
  paidAmount: null,
  paidAt: null,
  paymentInfo: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCategories = [
  { id: 'cat-1', name: 'Tea & Beverages', icon: '🍵' },
  { id: 'cat-2', name: 'Vegetables', icon: '🥬' },
];

// Configure mock selectors
function setupMocks(overrides: {
  isDesktop?: boolean;
  hasItems?: boolean;
  isPaid?: boolean;
  canPay?: boolean;
  hasPrices?: boolean;
} = {}) {
  const { isDesktop = false, hasItems = true, isPaid = false, canPay = true, hasPrices = true } = overrides;

  mockUseMediaQuery.mockReturnValue(isDesktop);

  // Override the store module mocks
  const store = require('@groceryone/store');
  store.selectActiveCart = () => hasItems || isPaid ? {
    ...mockCart,
    status: isPaid ? 'paid' : 'draft',
    paidAmount: isPaid ? 220070 : null,
    paidAt: isPaid ? new Date().toISOString() : null,
    paymentInfo: isPaid ? { method: 'cash' } : null,
  } : mockCart;
  store.selectActiveCartItems = () => hasItems ? mockCart.items : [];
  store.selectActiveCartItemCount = () => hasItems ? 2 : 0;
  store.selectActiveCartGrandTotal = () => hasPrices ? 220070 : 0;
  store.selectActiveCartHasPrices = () => hasPrices;
  store.selectActiveCartIsPaid = () => isPaid;
  store.selectCanMarkPayment = () => canPay && !isPaid;
  store.selectCategories = () => mockCategories;
}

// Import after mocks
import OrderDetailPage from '@/app/(dashboard)/orders/[orderId]/page';

describe('OrderDetailPage - Side-by-Side Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe('Layout structure', () => {
    it('renders two-column grid on desktop', () => {
      setupMocks({ isDesktop: true });
      render(<OrderDetailPage />);
      const grid = screen.getByTestId('order-layout-grid');
      expect(grid).toBeInTheDocument();
      expect(screen.getByTestId('order-items-column')).toBeInTheDocument();
      expect(screen.getByTestId('payment-panel-column')).toBeInTheDocument();
    });

    it('renders single column on mobile (no payment panel column)', () => {
      setupMocks({ isDesktop: false });
      render(<OrderDetailPage />);
      expect(screen.getByTestId('order-items-column')).toBeInTheDocument();
      expect(screen.queryByTestId('payment-panel-column')).not.toBeInTheDocument();
    });

    it('payment panel always visible on desktop when cart has items and not paid', () => {
      setupMocks({ isDesktop: true, hasItems: true, isPaid: false });
      render(<OrderDetailPage />);
      // Payment panel rendered without needing a button click
      expect(screen.getByTestId('payment-panel-column')).toBeInTheDocument();
      expect(screen.getByText(/payment\.confirmPayment/)).toBeInTheDocument();
    });

    it('payment requires Pay Now click on mobile', () => {
      setupMocks({ isDesktop: false, hasItems: true, canPay: true });
      render(<OrderDetailPage />);
      // Payment inline not initially rendered
      expect(screen.queryByText(/payment\.confirmPayment/)).not.toBeInTheDocument();
      // Click Pay Now
      const payNowBtn = screen.getByTestId('mobile-pay-now-btn');
      fireEvent.click(payNowBtn);
      // Now payment should appear
      expect(screen.getByText(/payment\.confirmPayment/)).toBeInTheDocument();
    });
  });

  describe('Header behavior', () => {
    it('shows grand total with lg:hidden class (mobile only)', () => {
      setupMocks({ isDesktop: false, hasPrices: true });
      render(<OrderDetailPage />);
      // Grand total key should exist in the DOM
      expect(screen.getByText('picking.grandTotal')).toBeInTheDocument();
    });

    it('shows mobile action buttons on mobile', () => {
      setupMocks({ isDesktop: false });
      render(<OrderDetailPage />);
      expect(screen.getByTestId('mobile-action-buttons')).toBeInTheDocument();
    });

    it('hides mobile action buttons on desktop', () => {
      setupMocks({ isDesktop: true });
      render(<OrderDetailPage />);
      expect(screen.queryByTestId('mobile-action-buttons')).not.toBeInTheDocument();
    });
  });

  describe('Payment behavior', () => {
    it('desktop: no Cancel button in payment panel', () => {
      setupMocks({ isDesktop: true });
      render(<OrderDetailPage />);
      const paymentPanel = screen.getByTestId('payment-panel-column');
      expect(paymentPanel.querySelector('button')).toBeTruthy();
      // Cancel button should NOT be in the payment panel (onCancel not passed on desktop)
      const cancelButtons = screen.queryAllByText('cancel');
      expect(cancelButtons.length).toBe(0);
    });

    it('mobile: Cancel button present when payment is open', () => {
      setupMocks({ isDesktop: false, canPay: true });
      render(<OrderDetailPage />);
      fireEvent.click(screen.getByTestId('mobile-pay-now-btn'));
      expect(screen.getByText('cancel')).toBeInTheDocument();
    });

    it('desktop: shows paid confirmation card when order is paid', () => {
      setupMocks({ isDesktop: true, isPaid: true });
      render(<OrderDetailPage />);
      expect(screen.getByTestId('payment-panel-column')).toBeInTheDocument();
      expect(screen.getByText('payment.paymentSuccessful')).toBeInTheDocument();
      expect(screen.getAllByText('picking.printList').length).toBeGreaterThan(0);
    });
  });

  describe('Sticky behavior', () => {
    it('payment panel has sticky positioning classes on desktop', () => {
      setupMocks({ isDesktop: true });
      render(<OrderDetailPage />);
      const panel = screen.getByTestId('payment-panel-column');
      expect(panel.className).toContain('sticky');
      expect(panel.className).toContain('top-0');
      expect(panel.className).toContain('self-start');
    });
  });

  describe('Order items', () => {
    it('renders items grouped by category', () => {
      setupMocks({ isDesktop: true });
      render(<OrderDetailPage />);
      expect(screen.getByText(/Tea & Beverages/)).toBeInTheDocument();
      expect(screen.getByText(/Vegetables/)).toBeInTheDocument();
      expect(screen.getByText('Tea')).toBeInTheDocument();
      expect(screen.getByText('Potato')).toBeInTheDocument();
    });
  });

  // The web/desktop POS is local-only, so confirming payment MUST first commit
  // the sale to the backend (which deducts stock) and only mark the cart paid on
  // success. These tests pin that contract: payload shape, success→markPaid,
  // failure→error + stay-unpaid, and the in-flight disabled state.
  describe('Checkout on payment (stock deduction)', () => {
    function setCheckoutMock(impl: () => any, opts: { isLoading?: boolean } = {}) {
      const store = require('@groceryone/store');
      const fn = jest.fn(() => ({ unwrap: impl }));
      store.useCheckoutMutation = () => [fn, { isLoading: opts.isLoading ?? false }];
      return fn;
    }

    function confirmButton() {
      return screen.getByRole('button', { name: /payment\.confirmPayment/ });
    }

    it('confirming payment posts the cart line items + clientRef, then marks paid on success', async () => {
      setupMocks({ isDesktop: true });
      const checkout = setCheckoutMock(() => Promise.resolve({ id: 'o1' }));

      render(<OrderDetailPage />);
      fireEvent.click(confirmButton());

      await waitFor(() => expect(checkout).toHaveBeenCalledTimes(1));
      // Server re-derives prices — the client only sends {itemId, quantity}.
      expect(checkout).toHaveBeenCalledWith({
        items: [
          { itemId: 'item-1', quantity: 500 },
          { itemId: 'item-2', quantity: 2 },
        ],
        paymentMethod: 'cash',
        paidAmount: 220070,
        clientRef: 'cart-1', // idempotency key = local cart id
      });
      // Only AFTER the backend commit do we mark the local cart paid.
      await waitFor(() =>
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'cart/markPaid' }),
        ),
      );
    });

    it('blocks the sale on backend rejection (insufficient stock): shows the error and does NOT mark paid', async () => {
      setupMocks({ isDesktop: true });
      setCheckoutMock(() =>
        Promise.reject({ data: { message: 'Insufficient stock for Potato' } }),
      );

      render(<OrderDetailPage />);
      fireEvent.click(confirmButton());

      // The backend message is surfaced inline…
      expect(await screen.findByTestId('payment-error')).toHaveTextContent(
        'Insufficient stock for Potato',
      );
      // …and the cart is NEVER marked paid.
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cart/markPaid' }),
      );
    });

    it('disables the confirm button while the checkout is in flight', () => {
      setupMocks({ isDesktop: true });
      setCheckoutMock(() => new Promise(() => {}), { isLoading: true });

      render(<OrderDetailPage />);
      // While busy the label switches to the "processing" state and the button
      // is disabled so a cashier can't double-submit.
      expect(screen.getByRole('button', { name: /payment\.processing/ })).toBeDisabled();
    });
  });
});

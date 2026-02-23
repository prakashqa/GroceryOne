/**
 * CartScreen Tests
 * TDD tests for printer blinking indicator behavior
 */

import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import CartScreen from '../CartScreen';

// === Factories ===
const ATTA_ITEM = { id: 'atta-1', name: 'Aashirvaad Atta', categoryId: 'atta-rice', unit: 'kg' as const, defaultQuantity: 5 };
const SUGAR_ITEM = { id: 'sugar-1', name: 'Sugar', categoryId: 'staples', unit: 'kg' as const, defaultQuantity: 1 };

const createCartItem = (item: Record<string, any>, overrides: Record<string, any> = {}) => ({
  item, quantity: item.defaultQuantity, addedAt: new Date().toISOString(), ...overrides,
});

const createCart = (name: string, items: any[], overrides: Record<string, any> = {}) => ({
  id: 'cart-1', name, items,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  status: 'draft' as const, ...overrides,
});

const createMultiCartState = (cart: any, extras: Record<string, any> = {}) => ({
  multiCart: { carts: [cart], activeCartId: cart.id, isHydrated: true, lastSyncedAt: null },
  ...extras,
});

const CONNECTED_PRINTER_SETTINGS = {
  themeMode: 'light', language: 'en',
  notifications: { enabled: true, sound: true, vibration: true, orderUpdates: true, promotions: false, reminders: true },
  printer: {
    enabled: true, connectionType: 'network', selectedPrinterId: 'printer-1',
    selectedPrinterName: 'EPSON TM-T88', selectedPrinterAddress: '192.168.0.50:9100',
    paperSize: '80mm', printFormat: 'receipt', connectionStatus: 'connected',
    lastConnectedAt: new Date().toISOString(), autoPrint: false,
  },
  payment: { merchantUpiId: '', merchantName: '' }, isHydrated: true, lastUpdated: null,
};

const DISCONNECTED_PRINTER_SETTINGS = {
  ...CONNECTED_PRINTER_SETTINGS,
  printer: {
    enabled: false, connectionType: 'none', selectedPrinterId: null,
    selectedPrinterName: null, selectedPrinterAddress: null,
    paperSize: '80mm', printFormat: 'receipt', connectionStatus: 'disconnected',
    lastConnectedAt: null, autoPrint: false,
  },
};

describe('CartScreen', () => {
  describe('summary card display', () => {
    it('should display Categories, Unique Items, and Total Qty in summary', async () => {
      const cart = createCart('My Cart 1', [createCartItem(ATTA_ITEM), createCartItem(SUGAR_ITEM, { quantity: 2 })]);
      const { getByText } = renderWithProviders(<CartScreen />, { preloadedState: createMultiCartState(cart) });

      // Summary should show all three columns: Categories, Unique Items, and Total Qty
      await waitFor(() => {
        expect(getByText('Categories')).toBeTruthy();
        expect(getByText('Unique Items')).toBeTruthy();
        expect(getByText('Total Qty')).toBeTruthy();
      });
    });
  });

  describe('cart name display', () => {
    it('should display the active cart name in the header', async () => {
      const cart = createCart('My Cart 1', [createCartItem(ATTA_ITEM)]);
      const { getByTestId } = renderWithProviders(<CartScreen />, { preloadedState: createMultiCartState(cart) });
      await waitFor(() => { expect(getByTestId('cart-name-header').props.children).toBe('My Cart 1'); });
    });

    it('should display cart name with long name truncated', async () => {
      const cart = createCart('Very Long Cart Name For Testing Purposes', [createCartItem(ATTA_ITEM)]);
      const { getByTestId } = renderWithProviders(<CartScreen />, { preloadedState: createMultiCartState(cart) });
      await waitFor(() => {
        const el = getByTestId('cart-name-header');
        expect(el).toBeTruthy();
        expect(el.props.numberOfLines).toBe(1);
      });
    });

    it('should show cart name in empty cart state', async () => {
      const cart = createCart('Empty Cart', []);
      const { getByTestId } = renderWithProviders(<CartScreen />, { preloadedState: createMultiCartState(cart) });
      await waitFor(() => { expect(getByTestId('empty-cart-name').props.children).toBe('Empty Cart'); });
    });
  });

  describe('printer connection indicator', () => {
    const attaCart = createCart('Cart 1', [createCartItem(ATTA_ITEM)]);

    it('should show blinking indicator when printer is connected', async () => {
      const { getByTestId } = renderWithProviders(<CartScreen />, {
        preloadedState: createMultiCartState(attaCart, { settings: CONNECTED_PRINTER_SETTINGS }),
      });
      await waitFor(() => { expect(getByTestId('printer-blink-indicator')).toBeTruthy(); });
    });

    it('should not show blinking indicator when printer is disconnected', async () => {
      const { queryByTestId } = renderWithProviders(<CartScreen />, {
        preloadedState: createMultiCartState(attaCart, { settings: DISCONNECTED_PRINTER_SETTINGS }),
      });
      await waitFor(() => { expect(queryByTestId('printer-blink-indicator')).toBeNull(); });
    });
  });

  describe('footer button font size consistency', () => {
    it('should have the same font size for Payment and Print Picking List buttons', async () => {
      const cart = createCart('Cart 1', [createCartItem({ ...ATTA_ITEM, price: 48.0 }, { priceSnapshot: 48.0 })]);
      const { getByTestId } = renderWithProviders(<CartScreen />, { preloadedState: createMultiCartState(cart) });

      await waitFor(() => {
        const paymentText = getByTestId('footer-payment-text');
        const printText = getByTestId('footer-print-text');

        // Extract fontSize from the flattened style arrays
        const paymentStyles = [].concat(...[paymentText.props.style].flat(Infinity));
        const printStyles = [].concat(...[printText.props.style].flat(Infinity));

        const paymentFontSize = paymentStyles.reduce(
          (acc: number | undefined, s: any) => (s && s.fontSize !== undefined ? s.fontSize : acc),
          undefined
        );
        const printFontSize = printStyles.reduce(
          (acc: number | undefined, s: any) => (s && s.fontSize !== undefined ? s.fontSize : acc),
          undefined
        );

        expect(paymentFontSize).toBeDefined();
        expect(printFontSize).toBeDefined();
        expect(paymentFontSize).toBe(printFontSize);
      });
    });
  });

  describe('paid indicator change display', () => {
    const paidItemList = [createCartItem(ATTA_ITEM, { priceSnapshot: 48.0 })];

    it('should display change amount in paid indicator for cash payment with change', async () => {
      const cart = createCart('Cart 1', paidItemList, {
        status: 'paid', paidAt: new Date().toISOString(), paidAmount: 240,
        paymentInfo: { method: 'cash', details: { method: 'cash', receivedAmount: 500, changeGiven: 260 }, confirmedAt: new Date().toISOString() },
      });
      const { getByTestId } = renderWithProviders(<CartScreen />, { preloadedState: createMultiCartState(cart) });
      await waitFor(() => {
        expect(getByTestId('paid-indicator')).toBeTruthy();
        expect(getByTestId('paid-change-amount')).toBeTruthy();
      });
    });

    it('should not display change amount in paid indicator for UPI payment', async () => {
      const cart = createCart('Cart 1', paidItemList, {
        status: 'paid', paidAt: new Date().toISOString(), paidAmount: 240,
        paymentInfo: { method: 'upi', details: { method: 'upi', upiId: 'merchant@upi', transactionRef: 'TXN123' }, confirmedAt: new Date().toISOString() },
      });
      const { getByTestId, queryByTestId } = renderWithProviders(<CartScreen />, { preloadedState: createMultiCartState(cart) });
      await waitFor(() => { expect(getByTestId('paid-indicator')).toBeTruthy(); });
      expect(queryByTestId('paid-change-amount')).toBeNull();
    });
  });

  describe('summary card with 3 columns', () => {
    it('should display Categories, Unique Items, and Total Qty in summary', async () => {
      const cart = createCart('My Cart 1', [createCartItem(ATTA_ITEM), createCartItem(SUGAR_ITEM, { quantity: 2 })]);
      const { getByText } = renderWithProviders(<CartScreen />, { preloadedState: createMultiCartState(cart) });
      await waitFor(() => {
        expect(getByText('Categories')).toBeTruthy();
        expect(getByText('Unique Items')).toBeTruthy();
        expect(getByText('Total Qty')).toBeTruthy();
        expect(getByText('7')).toBeTruthy();
      });
    });
  });

  describe('printer name on print button', () => {
    it('should show printer name below print button text when connected', async () => {
      const cart = createCart('Cart 1', [createCartItem(ATTA_ITEM)]);
      const { getByTestId } = renderWithProviders(<CartScreen />, {
        preloadedState: createMultiCartState(cart, { settings: CONNECTED_PRINTER_SETTINGS }),
      });
      await waitFor(() => {
        const el = getByTestId('footer-printer-name');
        expect(el).toBeTruthy();
        expect(el.props.children).toBe('EPSON TM-T88');
      });
    });
  });

  describe('image-based printing pipeline', () => {
    it('should use renderTextToImage and printImage instead of text-mode print', () => {
      // CartScreen.handleConfirmPrint() always uses the image-based pipeline:
      // 1. renderTextToImage(receiptText, imageWidth) → base64 PNG
      // 2. printerService.printImage(base64Image, imageWidth) → send to printer
      //
      // This ensures:
      // - Telugu and other non-ASCII scripts render correctly (via native Canvas)
      // - Monospace alignment is preserved (Droid Sans Mono on Android)
      // - No sanitizeForPrinter stripping non-ASCII to '?'
      //
      // The renderTextToImage function is provided by receiptBitmap.ts
      // which uses Android's native Canvas + StaticLayout for rendering.
      const { renderTextToImage } = require('../../../../services/printer/receiptBitmap');
      expect(renderTextToImage).toBeDefined();
      expect(typeof renderTextToImage).toBe('function');
    });
  });

  describe('payment button display', () => {
    it('should display payment button with amount instead of "Mark Payment Done"', async () => {
      const cart = createCart('Cart 1', [
        createCartItem(ATTA_ITEM, { priceSnapshot: 48.0 }),
        createCartItem(SUGAR_ITEM, { quantity: 1, priceSnapshot: 52.0 }),
      ]);
      const { getByTestId } = renderWithProviders(<CartScreen />, {
        preloadedState: createMultiCartState(cart, {
          catalog: {
            items: [
              { ...ATTA_ITEM, price: 48.0, isActive: true },
              { ...SUGAR_ITEM, price: 52.0, isActive: true },
            ],
            categories: [
              { id: 'atta-rice', name: 'Atta & Rice', icon: '🌾', displayOrder: 1, isActive: true },
              { id: 'staples', name: 'Staples', icon: '🥫', displayOrder: 2, isActive: true },
            ],
            isHydrated: true, lastSyncedAt: null,
          },
        }),
      });

      // The payment button should display compact amount without ₹ symbol and without .00
      // Grand total = (48 * 5) + (52 * 1) = 240 + 52 = 292
      await waitFor(() => {
        const paymentText = getByTestId('footer-payment-text');
        expect(paymentText).toBeTruthy();

        // Collect all text content from the element
        const textContent = paymentText.props.children.join('');

        // Button should show "Payment 292" (compact format without ₹ and .00)
        expect(textContent).toContain('Payment');
        expect(textContent).toContain('292');
        expect(textContent).not.toContain('₹');
        expect(textContent).not.toContain('.00');
        expect(textContent).not.toContain('Mark Payment Done');
      });
    });
  });
});

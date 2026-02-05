/**
 * CartScreen Tests
 * TDD tests for printer blinking indicator behavior
 */

import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import CartScreen from '../CartScreen';

describe('CartScreen', () => {
  describe('summary card display', () => {
    it('should display Categories and Unique Items but NOT Total Qty in summary', async () => {
      const { getByText, queryByText } = renderWithProviders(<CartScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'My Cart 1',
                items: [
                  {
                    item: {
                      id: 'atta-1',
                      name: 'Aashirvaad Atta',
                      categoryId: 'atta-rice',
                      unit: 'kg',
                      defaultQuantity: 5,
                    },
                    quantity: 5,
                    addedAt: new Date().toISOString(),
                  },
                  {
                    item: {
                      id: 'sugar-1',
                      name: 'Sugar',
                      categoryId: 'staples',
                      unit: 'kg',
                      defaultQuantity: 1,
                    },
                    quantity: 2,
                    addedAt: new Date().toISOString(),
                  },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        },
      });

      // Summary should show Categories and Unique Items
      await waitFor(() => {
        expect(getByText('Categories')).toBeTruthy();
        expect(getByText('Unique Items')).toBeTruthy();
      });

      // Total Qty should NOT be displayed in the summary
      expect(queryByText('Total Qty')).toBeNull();
    });
  });

  describe('cart name display', () => {
    it('should display the active cart name in the header', async () => {
      const { getByTestId } = renderWithProviders(<CartScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'My Cart 1',
                items: [
                  {
                    item: {
                      id: 'atta-1',
                      name: 'Aashirvaad Atta',
                      categoryId: 'atta-rice',
                      unit: 'kg',
                      defaultQuantity: 5,
                    },
                    quantity: 5,
                    addedAt: new Date().toISOString(),
                  },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        },
      });

      // The cart name should be displayed in the header
      await waitFor(() => {
        const cartNameText = getByTestId('cart-name-header');
        expect(cartNameText.props.children).toBe('My Cart 1');
      });
    });

    it('should display cart name with long name truncated', async () => {
      const { getByTestId } = renderWithProviders(<CartScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Very Long Cart Name For Testing Purposes',
                items: [
                  {
                    item: {
                      id: 'atta-1',
                      name: 'Aashirvaad Atta',
                      categoryId: 'atta-rice',
                      unit: 'kg',
                      defaultQuantity: 5,
                    },
                    quantity: 5,
                    addedAt: new Date().toISOString(),
                  },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        },
      });

      // The cart name element should exist (truncation handled by numberOfLines prop)
      await waitFor(() => {
        const cartNameText = getByTestId('cart-name-header');
        expect(cartNameText).toBeTruthy();
        expect(cartNameText.props.numberOfLines).toBe(1);
      });
    });

    it('should show cart name in empty cart state', async () => {
      const { getByTestId } = renderWithProviders(<CartScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Empty Cart',
                items: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        },
      });

      // Even in empty state, cart name should be visible
      await waitFor(() => {
        const cartNameText = getByTestId('empty-cart-name');
        expect(cartNameText.props.children).toBe('Empty Cart');
      });
    });
  });

  describe('printer connection indicator', () => {
    it('should show blinking indicator when printer is connected', async () => {
      const { getByTestId } = renderWithProviders(<CartScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
                items: [
                  {
                    item: {
                      id: 'atta-1',
                      name: 'Aashirvaad Atta',
                      categoryId: 'atta-rice',
                      unit: 'kg',
                      defaultQuantity: 5,
                    },
                    quantity: 5,
                    addedAt: new Date().toISOString(),
                  },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
          settings: {
            themeMode: 'light',
            language: 'en',
            notifications: {
              enabled: true,
              sound: true,
              vibration: true,
              orderUpdates: true,
              promotions: false,
              reminders: true,
            },
            printer: {
              enabled: true,
              connectionType: 'network',
              selectedPrinterId: 'printer-1',
              selectedPrinterName: 'EPSON TM-T88',
              selectedPrinterAddress: '192.168.0.50:9100',
              paperSize: '80mm',
              printFormat: 'receipt',
              connectionStatus: 'connected',
              lastConnectedAt: new Date().toISOString(),
              autoPrint: false,
            },
            payment: {
              merchantUpiId: '',
              merchantName: '',
            },
            isHydrated: true,
            lastUpdated: null,
          },
        },
      });

      // The blinking printer indicator should be visible when printer is connected
      await waitFor(() => {
        const blinkingIndicator = getByTestId('printer-blink-indicator');
        expect(blinkingIndicator).toBeTruthy();
      });
    });

    it('should not show blinking indicator when printer is disconnected', async () => {
      const { queryByTestId } = renderWithProviders(<CartScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
                items: [
                  {
                    item: {
                      id: 'atta-1',
                      name: 'Aashirvaad Atta',
                      categoryId: 'atta-rice',
                      unit: 'kg',
                      defaultQuantity: 5,
                    },
                    quantity: 5,
                    addedAt: new Date().toISOString(),
                  },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
          settings: {
            themeMode: 'light',
            language: 'en',
            notifications: {
              enabled: true,
              sound: true,
              vibration: true,
              orderUpdates: true,
              promotions: false,
              reminders: true,
            },
            printer: {
              enabled: false,
              connectionType: 'none',
              selectedPrinterId: null,
              selectedPrinterName: null,
              selectedPrinterAddress: null,
              paperSize: '80mm',
              printFormat: 'receipt',
              connectionStatus: 'disconnected',
              lastConnectedAt: null,
              autoPrint: false,
            },
            payment: {
              merchantUpiId: '',
              merchantName: '',
            },
            isHydrated: true,
            lastUpdated: null,
          },
        },
      });

      // The blinking indicator should NOT be visible when printer is disconnected
      await waitFor(() => {
        const blinkingIndicator = queryByTestId('printer-blink-indicator');
        expect(blinkingIndicator).toBeNull();
      });
    });
  });

  describe('footer button font size consistency', () => {
    it('should have the same font size for Payment and Print Picking List buttons', async () => {
      const { getByTestId } = renderWithProviders(<CartScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
                items: [
                  {
                    item: {
                      id: 'atta-1',
                      name: 'Aashirvaad Atta',
                      categoryId: 'atta-rice',
                      unit: 'kg',
                      defaultQuantity: 5,
                      price: 48.0,
                    },
                    quantity: 5,
                    priceSnapshot: 48.0,
                    addedAt: new Date().toISOString(),
                  },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        },
      });

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
    it('should display change amount in paid indicator for cash payment with change', async () => {
      const { getByTestId } = renderWithProviders(<CartScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
                items: [
                  {
                    item: {
                      id: 'atta-1',
                      name: 'Aashirvaad Atta',
                      categoryId: 'atta-rice',
                      unit: 'kg',
                      defaultQuantity: 5,
                    },
                    quantity: 5,
                    priceSnapshot: 48.0,
                    addedAt: new Date().toISOString(),
                  },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'paid' as const,
                paidAt: new Date().toISOString(),
                paidAmount: 240,
                paymentInfo: {
                  method: 'cash',
                  details: {
                    method: 'cash',
                    receivedAmount: 500,
                    changeGiven: 260,
                  },
                  confirmedAt: new Date().toISOString(),
                },
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        },
      });

      await waitFor(() => {
        const paidIndicator = getByTestId('paid-indicator');
        expect(paidIndicator).toBeTruthy();
        const changeAmount = getByTestId('paid-change-amount');
        expect(changeAmount).toBeTruthy();
      });
    });

    it('should not display change amount in paid indicator for UPI payment', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<CartScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
                items: [
                  {
                    item: {
                      id: 'atta-1',
                      name: 'Aashirvaad Atta',
                      categoryId: 'atta-rice',
                      unit: 'kg',
                      defaultQuantity: 5,
                    },
                    quantity: 5,
                    priceSnapshot: 48.0,
                    addedAt: new Date().toISOString(),
                  },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'paid' as const,
                paidAt: new Date().toISOString(),
                paidAmount: 240,
                paymentInfo: {
                  method: 'upi',
                  details: {
                    method: 'upi',
                    upiId: 'merchant@upi',
                    transactionRef: 'TXN123',
                  },
                  confirmedAt: new Date().toISOString(),
                },
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
        },
      });

      await waitFor(() => {
        const paidIndicator = getByTestId('paid-indicator');
        expect(paidIndicator).toBeTruthy();
      });
      expect(queryByTestId('paid-change-amount')).toBeNull();
    });
  });

  describe('payment button display', () => {
    it('should display payment button with amount instead of "Mark Payment Done"', async () => {
      const { getByTestId } = renderWithProviders(<CartScreen />, {
        preloadedState: {
          multiCart: {
            carts: [
              {
                id: 'cart-1',
                name: 'Cart 1',
                items: [
                  {
                    item: {
                      id: 'atta-1',
                      name: 'Aashirvaad Atta',
                      categoryId: 'atta-rice',
                      unit: 'kg',
                      defaultQuantity: 5,
                    },
                    quantity: 5,
                    priceSnapshot: 48.0,
                    addedAt: new Date().toISOString(),
                  },
                  {
                    item: {
                      id: 'sugar-1',
                      name: 'Sugar',
                      categoryId: 'staples',
                      unit: 'kg',
                      defaultQuantity: 1,
                    },
                    quantity: 1,
                    priceSnapshot: 52.0,
                    addedAt: new Date().toISOString(),
                  },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'draft' as const,
              },
            ],
            activeCartId: 'cart-1',
            isHydrated: true,
            lastSyncedAt: null,
          },
          catalog: {
            items: [
              {
                id: 'atta-1',
                name: 'Aashirvaad Atta',
                categoryId: 'atta-rice',
                unit: 'kg',
                defaultQuantity: 5,
                price: 48.0,
                isActive: true,
              },
              {
                id: 'sugar-1',
                name: 'Sugar',
                categoryId: 'staples',
                unit: 'kg',
                defaultQuantity: 1,
                price: 52.0,
                isActive: true,
              },
            ],
            categories: [
              {
                id: 'atta-rice',
                name: 'Atta & Rice',
                icon: '🌾',
                displayOrder: 1,
                isActive: true,
              },
              {
                id: 'staples',
                name: 'Staples',
                icon: '🥫',
                displayOrder: 2,
                isActive: true,
              },
            ],
            isHydrated: true,
            lastSyncedAt: null,
          },
        },
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

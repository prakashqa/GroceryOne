/**
 * Payment Domain Types
 * Types for the payment processing feature
 */

/**
 * Payment method types supported by the application
 */
export type PaymentMethod = 'cash' | 'upi' | 'card';

/**
 * Payment details for cash transactions
 */
export interface CashPaymentDetails {
  method: 'cash';
  receivedAmount?: number; // Amount received from customer
  changeGiven?: number; // Change returned (computed: receivedAmount - grandTotal)
}

/**
 * Payment details for UPI transactions
 */
export interface UpiPaymentDetails {
  method: 'upi';
  upiId?: string; // Merchant UPI ID used for QR
  transactionRef?: string; // Optional: UPI transaction reference if provided
}

/**
 * Payment details for card transactions
 */
export interface CardPaymentDetails {
  method: 'card';
  lastFourDigits?: string; // Optional: last 4 digits of card
}

/**
 * Union type for all payment details
 */
export type PaymentDetails =
  | CashPaymentDetails
  | UpiPaymentDetails
  | CardPaymentDetails;

/**
 * Complete payment info stored with cart
 */
export interface PaymentInfo {
  method: PaymentMethod;
  details: PaymentDetails;
  confirmedAt: string; // ISO timestamp when payment was confirmed
}

/**
 * Payload for marking a cart as paid
 */
export interface MarkPaidPayload {
  amount: number;
  paymentInfo: PaymentInfo;
}

/**
 * Payload for marking a specific cart as paid by ID
 */
export interface MarkCartPaidPayload {
  cartId: string;
  amount: number;
  paymentInfo: PaymentInfo;
}

/**
 * Helper function to create cash payment info
 */
export const createCashPaymentInfo = (
  receivedAmount?: number,
  changeGiven?: number
): PaymentInfo => ({
  method: 'cash',
  details: {
    method: 'cash',
    receivedAmount,
    changeGiven,
  },
  confirmedAt: new Date().toISOString(),
});

/**
 * Helper function to create UPI payment info
 */
export const createUpiPaymentInfo = (
  upiId?: string,
  transactionRef?: string
): PaymentInfo => ({
  method: 'upi',
  details: {
    method: 'upi',
    upiId,
    transactionRef,
  },
  confirmedAt: new Date().toISOString(),
});

/**
 * Helper function to create card payment info
 */
export const createCardPaymentInfo = (lastFourDigits?: string): PaymentInfo => ({
  method: 'card',
  details: {
    method: 'card',
    lastFourDigits,
  },
  confirmedAt: new Date().toISOString(),
});

/**
 * Get display label for payment method
 */
export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'upi':
      return 'UPI';
    case 'card':
      return 'Card';
    default:
      return 'Unknown';
  }
};

/**
 * Get icon for payment method
 */
export const getPaymentMethodIcon = (method: PaymentMethod): string => {
  switch (method) {
    case 'cash':
      return '💵';
    case 'upi':
      return '📱';
    case 'card':
      return '💳';
    default:
      return '💰';
  }
};

/**
 * Generate UPI deep link URL for QR code
 */
export const generateUpiDeepLink = (
  upiId: string,
  merchantName: string,
  amount: number
): string => {
  const encodedName = encodeURIComponent(merchantName);
  return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount.toFixed(2)}&cu=INR`;
};

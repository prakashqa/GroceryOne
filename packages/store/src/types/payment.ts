/**
 * Payment Domain Types
 * Platform-agnostic types for payment processing
 */

export type PaymentMethod = 'cash' | 'upi' | 'card';

export interface CashPaymentDetails {
  method: 'cash';
  receivedAmount?: number;
  changeGiven?: number;
}

export interface UpiPaymentDetails {
  method: 'upi';
  upiId?: string;
  transactionRef?: string;
}

export interface CardPaymentDetails {
  method: 'card';
  lastFourDigits?: string;
}

export type PaymentDetails =
  | CashPaymentDetails
  | UpiPaymentDetails
  | CardPaymentDetails;

export interface PaymentInfo {
  method: PaymentMethod;
  details: PaymentDetails;
  confirmedAt: string;
}

export interface MarkPaidPayload {
  amount: number;
  paymentInfo: PaymentInfo;
}

export interface MarkCartPaidPayload {
  cartId: string;
  amount: number;
  paymentInfo: PaymentInfo;
}

export const createCashPaymentInfo = (
  receivedAmount?: number,
  changeGiven?: number
): PaymentInfo => ({
  method: 'cash',
  details: { method: 'cash', receivedAmount, changeGiven },
  confirmedAt: new Date().toISOString(),
});

export const createUpiPaymentInfo = (
  upiId?: string,
  transactionRef?: string
): PaymentInfo => ({
  method: 'upi',
  details: { method: 'upi', upiId, transactionRef },
  confirmedAt: new Date().toISOString(),
});

export const createCardPaymentInfo = (lastFourDigits?: string): PaymentInfo => ({
  method: 'card',
  details: { method: 'card', lastFourDigits },
  confirmedAt: new Date().toISOString(),
});

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case 'cash': return 'Cash';
    case 'upi': return 'UPI';
    case 'card': return 'Card';
    default: return 'Unknown';
  }
};

export const getPaymentMethodIcon = (method: PaymentMethod): string => {
  switch (method) {
    case 'cash': return '💵';
    case 'upi': return '📱';
    case 'card': return '💳';
    default: return '💰';
  }
};

export const generateUpiDeepLink = (
  upiId: string,
  merchantName: string,
  amount: number,
  /** Optional UPI transaction note (`tn`) — e.g. a tenant slug, for reconciliation. */
  note?: string
): string => {
  const encodedName = encodeURIComponent(merchantName);
  let url = `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount.toFixed(2)}&cu=INR`;
  if (note) url += `&tn=${encodeURIComponent(note)}`;
  return url;
};

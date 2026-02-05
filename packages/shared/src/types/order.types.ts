/**
 * Order-related type definitions
 */

export interface Cart {
  id: string;
  userId: string;
  totalItems: number;
  subtotal: number;
  couponCode?: string;
  discountAmount: number;
  items: CartItem[];
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  product?: CartItemProduct;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemProduct {
  id: string;
  name: string;
  nameTe?: string;
  slug: string;
  thumbnailUrl?: string;
  unit: string;
  unitValue: number;
  stockQuantity: number;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
  deliveryAddress: DeliveryAddress;
  deliverySlot?: DeliverySlot;
  deliveryInstructions?: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  items: OrderItem[];
  confirmedAt?: Date;
  processingAt?: Date;
  dispatchedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  deliveryPerson?: DeliveryPerson;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'cod'; // Cash on Delivery only for now

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  productName: string;
  productSku: string;
  variantName?: string;
  thumbnailUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface DeliverySlot {
  date: string;
  startTime: string;
  endTime: string;
}

export interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
}

export interface Coupon {
  id: string;
  code: string;
  name?: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
  startsAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CouponType = 'percentage' | 'fixed' | 'free_delivery';

export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; labelTe: string }> = {
  pending: { label: 'Pending', labelTe: 'పెండింగ్' },
  confirmed: { label: 'Confirmed', labelTe: 'నిర్ధారించబడింది' },
  processing: { label: 'Processing', labelTe: 'ప్రాసెసింగ్' },
  out_for_delivery: { label: 'Out for Delivery', labelTe: 'డెలివరీకి బయలుదేరింది' },
  delivered: { label: 'Delivered', labelTe: 'డెలివరీ అయింది' },
  cancelled: { label: 'Cancelled', labelTe: 'రద్దు చేయబడింది' },
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { label: string; labelTe: string }> = {
  pending: { label: 'Pending', labelTe: 'పెండింగ్' },
  paid: { label: 'Paid', labelTe: 'చెల్లించబడింది' },
  failed: { label: 'Failed', labelTe: 'విఫలమైంది' },
  refunded: { label: 'Refunded', labelTe: 'రీఫండ్ చేయబడింది' },
};

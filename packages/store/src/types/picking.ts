/**
 * Picking List Domain Types
 * Platform-agnostic types for the grocery picking list feature
 */

import type { PaymentInfo } from './payment';

export interface Category {
  id: string;
  backendId?: string;
  name: string;
  nameTe?: string;
  icon: string;
  trackInventory?: boolean;
}

export interface Item {
  id: string;
  backendId?: string;
  categoryId: string;
  name: string;
  nameTe?: string;
  barcode?: string;
  unit: 'kg' | 'gm' | 'pcs' | 'L' | 'ml';
  defaultQuantity: number;
  price?: number;
  mrp?: number;
  sortOrder?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
}

export interface CartItem {
  item: Item;
  quantity: number;
  addedAt: Date;
}

export type CartStatus = 'draft' | 'printed' | 'paid' | 'completed';

export interface PickingCart {
  id: string;
  items: CartItem[];
  createdAt: Date;
  status: CartStatus;
}

export interface CartItemState {
  item: Item;
  quantity: number;
  addedAt: string;
  priceSnapshot?: number;
  displayUnit?: 'kg' | 'gm' | 'L' | 'ml' | 'pcs';
}

export interface ManagedCart {
  id: string;
  backendId?: string;
  name: string;
  items: CartItemState[];
  createdAt: string;
  updatedAt: string;
  status: CartStatus;
  paidAt?: string;
  paidAmount?: number;
  paidItemCount?: number;
  paymentInfo?: PaymentInfo;
}

export interface MultiCartState {
  carts: ManagedCart[];
  activeCartId: string | null;
  isHydrated: boolean;
  lastSyncedAt: string | null;
  deletedCartIds: string[];
}

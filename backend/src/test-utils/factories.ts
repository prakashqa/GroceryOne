/**
 * Test entity factory functions.
 * Each factory returns a complete mock entity with sensible defaults.
 * Use the `overrides` parameter to customize specific fields.
 */

import { Tenant } from '../tenant/entities/tenant.entity';
import { User } from '../modules/users/entities/user.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { Item } from '../modules/products/entities/item.entity';
import { Cart, CartStatus } from '../modules/cart/entities/cart.entity';
import { CartItem } from '../modules/cart/entities/cart-item.entity';
import { Order, OrderStatus } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';
import { InventoryTransaction } from '../modules/inventory/entities/inventory-transaction.entity';
import { TENANT_A_ID, USER_A_ID, FIXED_DATE } from './constants';

export function buildMockTenant(overrides?: Partial<Tenant>): Tenant {
  return {
    id: 'tenant-123',
    name: 'FreshMart Groceries',
    slug: 'freshmart',
    status: 'active',
    subscriptionPlan: 'premium',
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  } as Tenant;
}

export function buildMockUser(overrides?: Partial<User>): User {
  const tenant = overrides?.tenant ?? buildMockTenant();
  return {
    id: 'user-123',
    tenantId: overrides?.tenantId ?? 'tenant-123',
    email: 'test@example.com',
    phone: '+91-9876543210',
    passwordHash: '$2b$12$hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin',
    status: 'active',
    preferredLanguage: 'en',
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    tenant,
    get fullName() {
      return `${this.firstName} ${this.lastName}`.trim();
    },
    ...overrides,
  } as User;
}

export function buildMockCategory(overrides?: Partial<Category>): Category {
  return {
    id: 'cat-a-uuid',
    slug: 'fruits',
    name: 'Fruits',
    icon: '🍎',
    sortOrder: 0,
    isActive: true,
    tenantId: TENANT_A_ID,
    items: [],
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  } as Category;
}

export function buildMockItem(overrides?: Partial<Item>): Item {
  return {
    id: 'item-a-uuid',
    slug: 'atta-1kg',
    name: 'Aashirvaad Atta 1kg',
    categoryId: 'cat-a-uuid',
    category: {} as any,
    unit: 'kg',
    defaultQuantity: 1,
    price: 250,
    compareAtPrice: 280,
    sortOrder: 0,
    isActive: true,
    stockQuantity: 100,
    lowStockThreshold: 10,
    trackInventory: true,
    tenantId: TENANT_A_ID,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  } as Item;
}

export function buildMockCartItem(overrides?: Partial<CartItem>): CartItem {
  return {
    id: 'cart-item-1',
    cartId: 'cart-uuid',
    itemId: 'item-1-uuid',
    quantity: 2,
    priceSnapshot: 50,
    addedAt: FIXED_DATE,
    item: buildMockItem({
      id: 'item-1-uuid',
      slug: 'basmati-rice-1kg',
      name: 'Basmati Rice 1kg',
      categoryId: 'cat-uuid',
      price: 50,
      compareAtPrice: 0,
      defaultQuantity: 1,
    }),
    cart: {} as any,
    ...overrides,
  } as CartItem;
}

export function buildMockCart(overrides?: Partial<Cart>): Cart {
  return {
    id: 'cart-a-uuid',
    name: 'Test Cart',
    tenantId: TENANT_A_ID,
    userId: USER_A_ID,
    status: 'draft' as CartStatus,
    isActive: true,
    items: [],
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  } as Cart;
}

export function buildMockOrder(overrides?: Partial<Order>): Order {
  return {
    id: 'order-uuid',
    orderNumber: 'ORD-20260101-001',
    tenantId: TENANT_A_ID,
    userId: USER_A_ID,
    cartId: 'cart-uuid',
    status: 'pending' as OrderStatus,
    paymentStatus: 'paid',
    paymentMethod: 'cod',
    subtotal: 190,
    taxAmount: 0,
    deliveryFee: 0,
    discountAmount: 0,
    totalAmount: 190,
    paidAt: FIXED_DATE,
    paidAmount: 250,
    items: [],
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  } as Order;
}

export function buildMockOrderItem(
  overrides?: Partial<OrderItem>,
): OrderItem {
  return {
    id: 'order-item-1',
    orderId: 'order-uuid',
    itemId: 'item-1-uuid',
    productName: 'Basmati Rice 1kg',
    productSlug: 'basmati-rice-1kg',
    quantity: 2,
    unitPrice: 50,
    totalPrice: 100,
    createdAt: FIXED_DATE,
    order: {} as any,
    ...overrides,
  } as OrderItem;
}

export function buildMockInventoryTransaction(
  overrides?: Partial<InventoryTransaction>,
): InventoryTransaction {
  return {
    id: 'inv-txn-uuid',
    tenantId: TENANT_A_ID,
    itemId: 'item-a-uuid',
    type: 'restock',
    quantity: 50,
    stockAfter: 150,
    reason: 'Restocking',
    referenceType: null,
    referenceId: null,
    performedBy: USER_A_ID,
    createdAt: FIXED_DATE,
    ...overrides,
  } as InventoryTransaction;
}

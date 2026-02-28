/**
 * Historic Seed Data
 * Generates realistic historical cart data for testing Reports & Analytics
 */

import { FRESHMART_ITEMS } from './seed-data';

export interface HistoricCartSeed {
  name: string;
  status: 'draft' | 'printed' | 'paid' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  paidAmount?: number;
  items: HistoricCartItemSeed[];
}

export interface HistoricCartItemSeed {
  itemSlug: string;
  quantity: number;
  priceSnapshot: number;
}

/**
 * Helper to generate a date relative to today
 */
function daysAgo(days: number, hours = 0, minutes = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Helper to get random items from catalog
 */
function getRandomItems(count: number): HistoricCartItemSeed[] {
  const shuffled = [...FRESHMART_ITEMS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map((item) => ({
    itemSlug: item.slug,
    quantity: Math.floor(Math.random() * 5) + 1,
    priceSnapshot: item.price || Math.floor(Math.random() * 200) + 20,
  }));
}

/**
 * Calculate total for a cart
 */
function calculateCartTotal(items: HistoricCartItemSeed[]): number {
  return items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
}

/**
 * Generate historic cart data for the past 45 days
 * This provides enough data to test:
 * - Today
 * - Yesterday
 * - Last 7 Days
 * - Last 30 Days
 * - This Month
 * - Last Month
 */
interface TempCartConfig {
  status: HistoricCartSeed['status'];
  hours: number;
  minutes: number;
}

export function generateHistoricCarts(): HistoricCartSeed[] {
  const carts: HistoricCartSeed[] = [];
  let cartNumber = 1;

  // Today - 5 carts (mix of statuses)
  const todayCarts: TempCartConfig[] = [
    { status: 'paid', hours: 9, minutes: 30 },
    { status: 'paid', hours: 11, minutes: 15 },
    { status: 'paid', hours: 14, minutes: 45 },
    { status: 'printed', hours: 16, minutes: 0 },
    { status: 'draft', hours: 17, minutes: 30 },
  ];

  for (const cart of todayCarts) {
    const items = getRandomItems(Math.floor(Math.random() * 8) + 3);
    const total = calculateCartTotal(items);
    const createdAt = daysAgo(0, cart.hours, cart.minutes);

    carts.push({
      name: `Cart ${cartNumber++}`,
      status: cart.status,
      createdAt,
      updatedAt: createdAt,
      paidAt: cart.status === 'paid' ? createdAt : undefined,
      paidAmount: cart.status === 'paid' ? total : undefined,
      items,
    });
  }

  // Yesterday - 6 carts
  const yesterdayCarts = [
    { status: 'paid' as const, hours: 8, minutes: 45 },
    { status: 'paid' as const, hours: 10, minutes: 30 },
    { status: 'paid' as const, hours: 12, minutes: 0 },
    { status: 'paid' as const, hours: 15, minutes: 15 },
    { status: 'completed' as const, hours: 17, minutes: 30 },
    { status: 'paid' as const, hours: 18, minutes: 45 },
  ];

  for (const cart of yesterdayCarts) {
    const items = getRandomItems(Math.floor(Math.random() * 10) + 2);
    const total = calculateCartTotal(items);
    const createdAt = daysAgo(1, cart.hours, cart.minutes);

    carts.push({
      name: `Cart ${cartNumber++}`,
      status: cart.status,
      createdAt,
      updatedAt: createdAt,
      paidAt: cart.status === 'paid' || cart.status === 'completed' ? createdAt : undefined,
      paidAmount: cart.status === 'paid' || cart.status === 'completed' ? total : undefined,
      items,
    });
  }

  // Last 7 days (days 2-6) - varying number of carts per day
  const cartsPerDay = [4, 5, 3, 6, 4]; // Days 2, 3, 4, 5, 6

  for (let dayIndex = 0; dayIndex < cartsPerDay.length; dayIndex++) {
    const dayOffset = dayIndex + 2;
    const numCarts = cartsPerDay[dayIndex];

    for (let i = 0; i < numCarts; i++) {
      const hour = 8 + Math.floor((10 / numCarts) * i);
      const status: HistoricCartSeed['status'] =
        Math.random() > 0.2 ? 'paid' : Math.random() > 0.5 ? 'completed' : 'printed';
      const items = getRandomItems(Math.floor(Math.random() * 12) + 2);
      const total = calculateCartTotal(items);
      const createdAt = daysAgo(dayOffset, hour, Math.floor(Math.random() * 60));

      carts.push({
        name: `Cart ${cartNumber++}`,
        status,
        createdAt,
        updatedAt: createdAt,
        paidAt: status === 'paid' || status === 'completed' ? createdAt : undefined,
        paidAmount: status === 'paid' || status === 'completed' ? total : undefined,
        items,
      });
    }
  }

  // Days 7-30 - 2-4 carts per day (busier on weekends)
  for (let dayOffset = 7; dayOffset <= 30; dayOffset++) {
    const date = daysAgo(dayOffset);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const numCarts = isWeekend ? Math.floor(Math.random() * 3) + 4 : Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < numCarts; i++) {
      const hour = 8 + Math.floor(Math.random() * 11);
      const status: HistoricCartSeed['status'] =
        Math.random() > 0.15 ? 'paid' : Math.random() > 0.5 ? 'completed' : 'printed';
      const items = getRandomItems(Math.floor(Math.random() * 10) + 3);
      const total = calculateCartTotal(items);
      const createdAt = daysAgo(dayOffset, hour, Math.floor(Math.random() * 60));

      carts.push({
        name: `Cart ${cartNumber++}`,
        status,
        createdAt,
        updatedAt: createdAt,
        paidAt: status === 'paid' || status === 'completed' ? createdAt : undefined,
        paidAmount: status === 'paid' || status === 'completed' ? total : undefined,
        items,
      });
    }
  }

  // Days 31-45 (previous month) - 1-3 carts per day
  for (let dayOffset = 31; dayOffset <= 45; dayOffset++) {
    const numCarts = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numCarts; i++) {
      const hour = 9 + Math.floor(Math.random() * 10);
      const status: HistoricCartSeed['status'] =
        Math.random() > 0.1 ? 'paid' : 'completed';
      const items = getRandomItems(Math.floor(Math.random() * 8) + 2);
      const total = calculateCartTotal(items);
      const createdAt = daysAgo(dayOffset, hour, Math.floor(Math.random() * 60));

      carts.push({
        name: `Cart ${cartNumber++}`,
        status,
        createdAt,
        updatedAt: createdAt,
        paidAt: createdAt,
        paidAmount: total,
        items,
      });
    }
  }

  return carts;
}

/**
 * Summary statistics for the generated data
 */
export function getHistoricDataSummary(carts: HistoricCartSeed[]): {
  totalCarts: number;
  totalItems: number;
  totalSales: number;
  statusBreakdown: Record<string, number>;
  dateRange: { start: Date; end: Date };
} {
  const statusBreakdown: Record<string, number> = {
    draft: 0,
    printed: 0,
    paid: 0,
    completed: 0,
  };

  let totalItems = 0;
  let totalSales = 0;
  let minDate = new Date();
  let maxDate = new Date(0);

  for (const cart of carts) {
    statusBreakdown[cart.status]++;
    totalItems += cart.items.length;

    if (cart.paidAmount) {
      totalSales += cart.paidAmount;
    }

    if (cart.createdAt < minDate) minDate = cart.createdAt;
    if (cart.createdAt > maxDate) maxDate = cart.createdAt;
  }

  return {
    totalCarts: carts.length,
    totalItems,
    totalSales: Math.round(totalSales * 100) / 100,
    statusBreakdown,
    dateRange: { start: minDate, end: maxDate },
  };
}

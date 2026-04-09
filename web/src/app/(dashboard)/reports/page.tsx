'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectAllCarts, selectTodaysCarts, selectCartsByDateRange, selectCartsByStatus,
} from '@groceryone/store';
import { BarChart3, TrendingUp, Package, Receipt } from 'lucide-react';

type DatePreset = 'today' | 'week' | 'month' | 'all';

export default function ReportsPage() {
  const { t } = useTranslation('common');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const allCarts = useAppSelector(selectAllCarts);
  const todaysCarts = useAppSelector(selectTodaysCarts);
  const statusCounts = useAppSelector(selectCartsByStatus);

  const filteredCarts = useMemo(() => {
    if (datePreset === 'today') return todaysCarts;
    if (datePreset === 'all') return allCarts;
    const now = new Date();
    const start = new Date(now);
    if (datePreset === 'week') start.setDate(start.getDate() - 7);
    else if (datePreset === 'month') start.setDate(start.getDate() - 30);
    return allCarts.filter((c) => new Date(c.createdAt) >= start);
  }, [datePreset, todaysCarts, allCarts]);

  const metrics = useMemo(() => {
    const paidCarts = filteredCarts.filter((c) => c.status === 'paid');
    const totalRevenue = paidCarts.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    const totalOrders = filteredCarts.length;
    const uniqueItems = new Set<string>();
    filteredCarts.forEach((c) => c.items.forEach((i) => uniqueItems.add(i.item.id)));
    const avgOrderValue = paidCarts.length > 0 ? totalRevenue / paidCarts.length : 0;

    // Top products
    const productCount = new Map<string, { name: string; count: number; revenue: number }>();
    filteredCarts.forEach((c) => {
      c.items.forEach((ci) => {
        const existing = productCount.get(ci.item.id) || { name: ci.item.name, count: 0, revenue: 0 };
        existing.count += ci.quantity;
        existing.revenue += (ci.priceSnapshot || 0) * ci.quantity;
        productCount.set(ci.item.id, existing);
      });
    });
    const topProducts = Array.from(productCount.values()).sort((a, b) => b.count - a.count).slice(0, 5);

    return { totalRevenue, totalOrders, uniqueItems: uniqueItems.size, avgOrderValue, topProducts, paidCount: paidCarts.length };
  }, [filteredCarts]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {(['today', 'week', 'month', 'all'] as DatePreset[]).map((p) => (
            <button key={p} onClick={() => setDatePreset(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${datePreset === p ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {p === 'today' ? t('reports.today') : p === 'week' ? t('reports.thisWeek') : p === 'month' ? t('reports.thisMonth') : t('manageCarts.allCarts')}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-500">{t('reports.totalSales')}</span><TrendingUp size={18} className="text-primary" /></div>
          <p className="text-2xl font-bold">₹{metrics.totalRevenue.toFixed(0)}</p>
          <p className="text-xs text-gray-400 mt-1">{metrics.paidCount} {t('reports.paidCarts')}</p>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-500">{t('reports.totalCarts')}</span><Receipt size={18} className="text-blue-600" /></div>
          <p className="text-2xl font-bold">{metrics.totalOrders}</p>
          <p className="text-xs text-gray-400 mt-1">{statusCounts.draft} {t('dashboard.draft')}, {statusCounts.paid} {t('dashboard.paid')}</p>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-500">{t('dashboard.uniqueItems')}</span><Package size={18} className="text-orange-600" /></div>
          <p className="text-2xl font-bold">{metrics.uniqueItems}</p>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-500">{t('reports.avgCartValue')}</span><BarChart3 size={18} className="text-purple-600" /></div>
          <p className="text-2xl font-bold">₹{metrics.avgOrderValue.toFixed(0)}</p>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold">{t('reports.topProducts')}</h2>
        </div>
        {metrics.topProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <BarChart3 size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-lg font-medium">{t('reports.noSalesData')}</p>
            <p className="text-sm mt-1">Try selecting a different date range</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {metrics.topProducts.map((p, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="font-medium text-sm">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">₹{p.revenue.toFixed(0)}</p>
                  <p className="text-xs text-gray-400">{p.count} {t('reports.units')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

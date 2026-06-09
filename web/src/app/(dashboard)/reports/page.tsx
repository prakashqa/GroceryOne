'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectAllCarts, selectTodaysCarts, selectCartsByDateRange, selectCartsByStatus,
} from '@groceryone/store';
import { BarChart3, TrendingUp, Package, Receipt } from 'lucide-react';
import { RoleGate } from '@/components/common/RoleGate';
import { Segmented } from '@/components/common/Segmented';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';

type DatePreset = 'today' | 'week' | 'month' | 'all';

// Wraps the actual report content with a role gate so non-admins navigating
// directly to /reports see the "Access restricted" panel instead of report
// data. The Sidebar also hides the Reports link for non-admins.
export default function ReportsPage() {
  return (
    <RoleGate roles={['admin']}>
      <ReportsPageContent />
    </RoleGate>
  );
}

function ReportsPageContent() {
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
    <div className="page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="page-title">{t('reports.title')}</h1>
        <Segmented<DatePreset>
          options={[
            { value: 'today', label: t('reports.today') },
            { value: 'week', label: t('reports.thisWeek') },
            { value: 'month', label: t('reports.thisMonth') },
            { value: 'all', label: t('manageCarts.allCarts') },
          ]}
          value={datePreset}
          onChange={setDatePreset}
          size="sm"
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={t('reports.totalSales')}
          value={`₹${metrics.totalRevenue.toFixed(0)}`}
          icon={<TrendingUp size={18} />}
          meta={`${metrics.paidCount} ${t('reports.paidCarts')}`}
        />
        <StatCard
          label={t('reports.totalCarts')}
          value={metrics.totalOrders.toString()}
          icon={<Receipt size={18} />}
          meta={`${statusCounts.draft} ${t('dashboard.draft')}, ${statusCounts.paid} ${t('dashboard.paid')}`}
        />
        <StatCard
          label={t('dashboard.uniqueItems')}
          value={metrics.uniqueItems.toString()}
          icon={<Package size={18} />}
        />
        <StatCard
          label={t('reports.avgCartValue')}
          value={`₹${metrics.avgOrderValue.toFixed(0)}`}
          icon={<BarChart3 size={18} />}
        />
      </div>

      {/* Top Products */}
      <div className="card">
        <div className="p-5 border-b border-line dark:border-line-dark">
          <h2 className="text-lg font-semibold">{t('reports.topProducts')}</h2>
        </div>
        {metrics.topProducts.length === 0 ? (
          <EmptyState
            icon={<BarChart3 size={26} strokeWidth={1.8} />}
            title={t('reports.noSalesData')}
            hint="Try selecting a different date range"
          />
        ) : (
          <div className="row-divider">
            {metrics.topProducts.map((p, i) => (
              <div key={i} className="row justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{p.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{p.revenue.toFixed(0)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{p.count} {t('reports.units')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

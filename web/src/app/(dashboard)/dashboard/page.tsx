'use client';

import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectTodaysMetrics, selectRecentCarts } from '@groceryone/store';
import { ShoppingCart, Package, Receipt, IndianRupee } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { cartStatusBadge } from '@/lib/cartStatus';

export default function DashboardPage() {
  const { t } = useTranslation('common');
  const metrics = useAppSelector(selectTodaysMetrics);
  const recentCarts = useAppSelector((state) => selectRecentCarts(state, 5));

  const statusLabel = (status: string) => {
    switch (status) {
      case 'paid': return t('dashboard.paid');
      case 'printed': return t('dashboard.printed');
      case 'draft': return t('dashboard.draft');
      default: return status;
    }
  };

  const metricCards = [
    { key: 'revenue', label: t('dashboard.salesAmount'), value: `₹${metrics.totalSales.toFixed(0)}`, icon: IndianRupee, color: 'text-primary' },
    { key: 'orders', label: t('dashboard.cartsCreated'), value: metrics.cartsCreated.toString(), icon: Receipt, color: 'text-blue-600' },
    { key: 'picked', label: t('dashboard.itemsPicked'), value: metrics.itemsPicked.toString(), icon: Package, color: 'text-orange-600' },
    { key: 'quantity', label: t('dashboard.totalQuantity'), value: metrics.totalQuantity.toFixed(0), icon: ShoppingCart, color: 'text-purple-600' },
  ];

  return (
    <div className="page">
      <h1 className="page-title mb-6">{t('dashboard.title')}</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metricCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={card.value}
            icon={<card.icon size={18} />}
          />
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="p-5 border-b border-line dark:border-line-dark">
          <h2 className="text-lg font-semibold">{t('dashboard.recentCarts')}</h2>
        </div>
        {recentCarts.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={26} strokeWidth={1.8} />}
            title={t('dashboard.noRecentCarts')}
            hint={t('dashboard.startByCreating')}
          />
        ) : (
          <div className="row-divider">
            {recentCarts.map((cart) => (
              <div key={cart.id} className="row justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{cart.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {cart.paidItemCount ?? cart.items.length} {t('picking.items')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={cartStatusBadge(cart.status)}>{statusLabel(cart.status)}</span>
                  {cart.paidAmount && (
                    <p className="text-sm font-medium mt-1 text-gray-900 dark:text-gray-100">₹{cart.paidAmount.toFixed(0)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

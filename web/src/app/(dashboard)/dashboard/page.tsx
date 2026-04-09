'use client';

import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectTodaysMetrics, selectRecentCarts } from '@groceryone/store';
import { ShoppingCart, Package, Receipt, IndianRupee } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('dashboard.title')}</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metricCards.map((card) => (
          <div
            key={card.key}
            className="bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">{card.label}</span>
              <card.icon size={20} className={card.color} />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold">{t('dashboard.recentCarts')}</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {recentCarts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
              <ShoppingCart size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-lg font-medium">{t('dashboard.noRecentCarts')}</p>
              <p className="text-sm mt-1">{t('dashboard.startByCreating')}</p>
            </div>
          ) : (
            recentCarts.map((cart) => (
              <div key={cart.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{cart.name}</p>
                  <p className="text-sm text-gray-500">
                    {cart.items.length} {t('picking.items')}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    cart.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    cart.status === 'printed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {statusLabel(cart.status)}
                  </span>
                  {cart.paidAmount && (
                    <p className="text-sm font-medium mt-1">₹{cart.paidAmount.toFixed(0)}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

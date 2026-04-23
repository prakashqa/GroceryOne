'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCategories, selectItems } from '@groceryone/store';
import { Package, AlertTriangle, Search } from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
  const { t } = useTranslation('common');
  const categories = useAppSelector(selectCategories);
  const allItems = useAppSelector(selectItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const inventoryItems = useMemo(() => {
    let items = allItems.filter((i) => i.trackInventory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (filter === 'low') items = items.filter((i) => (i.stockQuantity || 0) <= (i.lowStockThreshold || 5) && (i.stockQuantity || 0) > 0);
    if (filter === 'out') items = items.filter((i) => (i.stockQuantity || 0) === 0);
    return items;
  }, [allItems, searchQuery, filter]);

  const stats = useMemo(() => {
    const tracked = allItems.filter((i) => i.trackInventory);
    const low = tracked.filter((i) => (i.stockQuantity || 0) <= (i.lowStockThreshold || 5) && (i.stockQuantity || 0) > 0);
    const out = tracked.filter((i) => (i.stockQuantity || 0) === 0);
    return { total: tracked.length, low: low.length, out: out.length };
  }, [allItems]);

  const stockColor = (item: typeof inventoryItems[0]) => {
    const qty = item.stockQuantity || 0;
    if (qty === 0) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    if (qty <= (item.lowStockThreshold || 5)) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
    return 'text-green-600 bg-green-50 dark:bg-green-900/20';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('inventory.title')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500">{t('inventory.totalItems')}</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-orange-200 dark:border-orange-900/30">
          <p className="text-sm text-orange-600">{t('inventory.lowStockCount')}</p>
          <p className="text-xl font-bold text-orange-600">{stats.low}</p>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-red-200 dark:border-red-900/30">
          <p className="text-sm text-red-600">{t('inventory.outOfStockCount')}</p>
          <p className="text-xl font-bold text-red-600">{stats.out}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {(['all', 'low', 'out'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filter === f ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            {f === 'low' ? t('inventory.lowStock') : f === 'out' ? t('inventory.outOfStockCount') : t('manageItems.all')}
          </button>
        ))}
        <div className="relative w-full sm:w-auto sm:ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('search')} className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800">
        {inventoryItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <Package size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-lg font-medium">{t('inventory.noResults')}</p>
            <p className="text-sm mt-1">{t('picking.trySearching')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {inventoryItems.map((item) => (
              <Link key={item.id} href={`/inventory/${item.id}`} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">{categories.find((c) => c.id === item.categoryId)?.name} &middot; {item.unit}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${stockColor(item)}`}>
                  {(item.stockQuantity || 0) === 0 ? t('inventory.outBadge') : `${item.stockQuantity} ${item.unit}`}
                </span>
                {(item.stockQuantity || 0) <= (item.lowStockThreshold || 5) && (item.stockQuantity || 0) > 0 && (
                  <AlertTriangle size={16} className="text-orange-500" />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

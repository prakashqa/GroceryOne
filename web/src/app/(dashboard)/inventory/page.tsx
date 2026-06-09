'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCategories, selectItems, selectIsCatalogInitialized } from '@groceryone/store';
import { Package, AlertTriangle, PackageX, Search } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/Skeleton';

export default function InventoryPage() {
  const { t } = useTranslation('common');
  const categories = useAppSelector(selectCategories);
  const allItems = useAppSelector(selectItems);
  const ready = useAppSelector(selectIsCatalogInitialized);
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
    <div className="page">
      <h1 className="page-title mb-6">{t('inventory.title')}</h1>

      {/* Stats */}
      {!ready ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[0, 1, 2].map((i) => <Skeleton key={i} shimmer variant="card" className="h-[88px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 stagger">
          <StatCard label={t('inventory.totalItems')} value={stats.total.toString()} icon={<Package size={18} />} />
          <StatCard label={t('inventory.lowStockCount')} value={stats.low.toString()} tone="warning" icon={<AlertTriangle size={18} />} />
          <StatCard label={t('inventory.outOfStockCount')} value={stats.out.toString()} tone="error" icon={<PackageX size={18} />} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {(['all', 'low', 'out'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`filter-tab capitalize ${filter === f ? 'filter-tab-active' : ''}`}>
            {f === 'low' ? t('inventory.lowStock') : f === 'out' ? t('inventory.outOfStockCount') : t('manageItems.all')}
          </button>
        ))}
        <div className="search-wrap w-full sm:w-auto sm:ml-auto">
          <Search size={16} />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('search')} className="search-input sm:w-48" />
        </div>
      </div>

      {/* Items List */}
      {!ready ? (
        <div className="card row-divider">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="row justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton shimmer className="h-3.5 w-40" />
                <Skeleton shimmer className="h-3 w-24" />
              </div>
              <Skeleton shimmer className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : inventoryItems.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Package size={26} strokeWidth={1.8} />}
            title={t('inventory.noResults')}
            hint={t('picking.trySearching')}
          />
        </div>
      ) : (
        <div className="card row-divider">
          {inventoryItems.map((item) => (
            <Link key={item.id} href={`/inventory/${item.id}`} className="row">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{categories.find((c) => c.id === item.categoryId)?.name} &middot; {item.unit}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${stockColor(item)}`}>
                {(item.stockQuantity || 0) === 0 ? t('inventory.outBadge') : `${item.stockQuantity} ${item.unit}`}
              </span>
              {(item.stockQuantity || 0) <= (item.lowStockThreshold || 5) && (item.stockQuantity || 0) > 0 && (
                <AlertTriangle size={16} className="text-warning shrink-0" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

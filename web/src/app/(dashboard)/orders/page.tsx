'use client';

import { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectAllCarts, selectActiveCartId, selectTodaysCarts, selectYesterdaysCarts,
  setActiveCart, deleteCart, renameCart, createCart,
} from '@groceryone/store';
import { Plus, Trash2, Edit2, ChevronRight, Receipt } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type DateFilter = 'today' | 'yesterday' | 'all';

export default function ManageOrdersPage() {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const allCarts = useAppSelector(selectAllCarts);
  const activeCartId = useAppSelector(selectActiveCartId);
  const todaysCarts = useAppSelector(selectTodaysCarts);
  const yesterdaysCarts = useAppSelector(selectYesterdaysCarts);

  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const filteredCarts = useMemo(() => {
    let carts = dateFilter === 'today' ? todaysCarts : dateFilter === 'yesterday' ? yesterdaysCarts : allCarts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      carts = carts.filter((c) => c.name.toLowerCase().includes(q));
    }
    return [...carts].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [dateFilter, todaysCarts, yesterdaysCarts, allCarts, searchQuery]);

  const handleRename = (cartId: string) => {
    if (renameName.trim()) {
      dispatch(renameCart({ cartId, name: renameName.trim() }));
      setRenameId(null);
    }
  };

  const handleCreate = () => {
    if (newName.trim()) {
      dispatch(createCart({ name: newName.trim() }));
      setNewName('');
      setShowCreate(false);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'paid': return t('dashboard.paid');
      case 'printed': return t('dashboard.printed');
      case 'draft': return t('dashboard.draft');
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'printed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('manageCarts.title')}</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> {t('picking.newCart')}
        </button>
      </div>

      {/* Date Filter + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {(['today', 'yesterday', 'all'] as DateFilter[]).map((f) => {
          const filterLabels: Record<DateFilter, string> = {
            today: t('manageCarts.today'),
            yesterday: t('manageCarts.yesterday'),
            all: t('manageCarts.allCarts'),
          };
          return (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === f ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {filterLabels[f]}
            </button>
          );
        })}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('manageCarts.searchCarts')}
          className="w-full sm:w-48 sm:ml-auto px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Orders List */}
      {filteredCarts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Receipt size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-lg font-medium">{t('manageCarts.noCartsYet')}</p>
          <p className="text-sm mt-1">{t('manageCarts.createFirstCart')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCarts.map((cart) => (
            <div
              key={cart.id}
              className={`bg-white dark:bg-surface-dark rounded-xl border p-4 flex items-center gap-4 transition-all ${
                cart.id === activeCartId ? 'border-primary/50 ring-1 ring-primary/20' : 'border-gray-100 dark:border-gray-800'
              }`}
            >
              <div className="flex-1 min-w-0">
                {renameId === cart.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={renameName}
                      onChange={(e) => setRenameName(e.target.value)}
                      className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRename(cart.id); if (e.key === 'Escape') setRenameId(null); }}
                    />
                    <button onClick={() => handleRename(cart.id)} className="text-primary text-sm font-medium">{t('save')}</button>
                    <button onClick={() => setRenameId(null)} className="text-gray-400 text-sm">{t('cancel')}</button>
                  </div>
                ) : (
                  <>
                    <p className="font-medium truncate">{cart.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {cart.paidItemCount ?? cart.items.length} {t('picking.items')} &middot; {new Date(cart.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      {cart.paidAmount ? ` &middot; ₹${cart.paidAmount.toFixed(0)}` : ''}
                    </p>
                  </>
                )}
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(cart.status)}`}>
                {statusLabel(cart.status)}
              </span>

              <div className="flex items-center gap-1">
                {cart.status !== 'paid' && (
                  <>
                    <button
                      onClick={() => { setRenameId(cart.id); setRenameName(cart.name); }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => dispatch(deleteCart(cart.id))}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                <Link
                  href={`/orders/${cart.id}`}
                  onClick={() => dispatch(setActiveCart(cart.id))}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-4">{filteredCarts.length} {t('manageCarts.cartsTotal')}</p>

      {/* Create Order Dialog */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{t('picking.createCart')}</h3>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('picking.enterCartName')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium">{t('cancel')}</button>
              <button onClick={handleCreate} disabled={!newName.trim()} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50">{t('picking.create')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

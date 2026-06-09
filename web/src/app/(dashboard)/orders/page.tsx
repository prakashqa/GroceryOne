'use client';

import { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectAllCarts, selectActiveCartId, selectTodaysCarts, selectYesterdaysCarts,
  setActiveCart, deleteCart, renameCart, createCart,
} from '@groceryone/store';
import { Plus, Trash2, Edit2, ChevronRight, Receipt, Search } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Segmented } from '@/components/common/Segmented';
import { EmptyState } from '@/components/common/EmptyState';
import { cartStatusBadge } from '@/lib/cartStatus';

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

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{t('manageCarts.title')}</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> {t('picking.newCart')}
        </button>
      </div>

      {/* Date Filter + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <Segmented<DateFilter>
          options={[
            { value: 'today', label: t('manageCarts.today') },
            { value: 'yesterday', label: t('manageCarts.yesterday') },
            { value: 'all', label: t('manageCarts.allCarts') },
          ]}
          value={dateFilter}
          onChange={setDateFilter}
          size="sm"
        />
        <div className="search-wrap w-full sm:w-56 sm:ml-auto">
          <Search size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('manageCarts.searchCarts')}
            className="search-input"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredCarts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Receipt size={26} strokeWidth={1.8} />}
            title={t('manageCarts.noCartsYet')}
            hint={t('manageCarts.createFirstCart')}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCarts.map((cart) => (
            <div
              key={cart.id}
              className={`card p-4 flex items-center gap-4 transition-all ${
                cart.id === activeCartId ? 'border-primary/50 ring-1 ring-primary/20' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                {renameId === cart.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={renameName}
                      onChange={(e) => setRenameName(e.target.value)}
                      className="input w-48"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRename(cart.id); if (e.key === 'Escape') setRenameId(null); }}
                    />
                    <button onClick={() => handleRename(cart.id)} className="text-primary text-sm font-medium">{t('save')}</button>
                    <button onClick={() => setRenameId(null)} className="text-gray-400 text-sm">{t('cancel')}</button>
                  </div>
                ) : (
                  <>
                    <p className="font-medium truncate text-gray-900 dark:text-gray-100">{cart.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {cart.paidItemCount ?? cart.items.length} {t('picking.items')} &middot; {new Date(cart.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      {cart.paidAmount ? ` &middot; ₹${cart.paidAmount.toFixed(0)}` : ''}
                    </p>
                  </>
                )}
              </div>

              <span className={cartStatusBadge(cart.status)}>{statusLabel(cart.status)}</span>

              <div className="flex items-center gap-1">
                {cart.status !== 'paid' && (
                  <>
                    <button
                      onClick={() => { setRenameId(cart.id); setRenameName(cart.name); }}
                      className="btn-icon"
                      aria-label={t('manageCarts.rename', 'Rename')}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => dispatch(deleteCart(cart.id))}
                      className="btn-icon hover:text-error dark:hover:text-error"
                      aria-label={t('delete', 'Delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                <Link
                  href={`/orders/${cart.id}`}
                  onClick={() => dispatch(setActiveCart(cart.id))}
                  className="btn-icon"
                  aria-label={t('manageCarts.open', 'Open')}
                >
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">{filteredCarts.length} {t('manageCarts.cartsTotal')}</p>

      {/* Create Order Dialog */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="card p-6 w-full max-w-sm mx-4 shadow-card-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{t('picking.createCart')}</h3>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('picking.enterCartName')}
              className="input mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">{t('cancel')}</button>
              <button onClick={handleCreate} disabled={!newName.trim()} className="btn-primary flex-1">{t('picking.create')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

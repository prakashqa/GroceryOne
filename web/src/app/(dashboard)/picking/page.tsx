'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectCategories, selectItems, selectActiveCart, selectActiveCartItems,
  selectActiveCartItemCount, selectActiveCartGrandTotal, selectCartCount, selectAllCarts,
  addItemToActiveCart, incrementItemInActiveCart, decrementItemInActiveCart,
  createCart, setActiveCart,
} from '@groceryone/store';
import type { DomainTypes } from '@groceryone/store';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Search } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/common/ProductCard';

export default function PickingPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const allItems = useAppSelector(selectItems);
  const activeCart = useAppSelector(selectActiveCart);
  const cartItems = useAppSelector(selectActiveCartItems);
  const cartItemCount = useAppSelector(selectActiveCartItemCount);
  const grandTotal = useAppSelector(selectActiveCartGrandTotal);
  const cartCount = useAppSelector(selectCartCount);
  const allCarts = useAppSelector(selectAllCarts);
  const { t } = useTranslation('common');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCartDialog, setShowNewCartDialog] = useState(false);
  const [newCartName, setNewCartName] = useState('');

  // Filter items by category and search
  const filteredItems = useMemo(() => {
    let items = [...allItems];
    if (selectedCategory) items = items.filter((i) => i.categoryId === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || (i.nameTe && i.nameTe.includes(q)));
    }
    return items;
  }, [allItems, selectedCategory, searchQuery]);

  const orderingCategories = useMemo(() => [...categories], [categories]);

  const cartItemMap = useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach((ci) => map.set(ci.item.id, ci.quantity));
    return map;
  }, [cartItems]);

  const handleAddItem = useCallback((item: DomainTypes.Item) => {
    if (!activeCart || activeCart.status === 'paid') {
      const name = `Order ${new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`;
      dispatch(createCart({ name }));
    }
    dispatch(addItemToActiveCart({ item, quantity: item.defaultQuantity }));
  }, [dispatch, activeCart]);

  const handleCreateCart = () => {
    if (newCartName.trim()) {
      dispatch(createCart({ name: newCartName.trim() }));
      setNewCartName('');
      setShowNewCartDialog(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">{t('picking.cartReview')}</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('picking.searchItems')}
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <Link
            href="/orders"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors whitespace-nowrap"
          >
            <ShoppingCart size={16} />
            {cartItemCount > 0 && <span>{cartItemCount} {t('picking.items')}</span>}
          </Link>
        </div>
      </div>

      {/* Cart Tabs */}
      {cartCount > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {allCarts.filter((c) => c.status !== 'paid').map((cart) => (
            <button
              key={cart.id}
              onClick={() => dispatch(setActiveCart(cart.id))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCart?.id === cart.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {cart.name} ({cart.items.length})
            </button>
          ))}
          <button
            onClick={() => setShowNewCartDialog(true)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:border-primary hover:text-primary transition-colors"
          >
            {t('picking.newCart')}
          </button>
        </div>
      )}

      {/* Category Bar */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            !selectedCategory ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {t('manageItems.all')}
        </button>
        {orderingCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Search size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-lg font-medium">{searchQuery ? t('picking.noItemsFound') : t('picking.catalogEmpty')}</p>
            <p className="text-sm mt-1">{searchQuery ? t('picking.trySearching') : t('picking.catalogEmptySubtitle')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                name={item.name}
                price={item.price}
                unit={item.unit}
                inCartQty={cartItemMap.get(item.id)}
                onAdd={() => handleAddItem(item)}
                onIncrement={() => dispatch(incrementItemInActiveCart(item.id))}
                onDecrement={() => dispatch(decrementItemInActiveCart(item.id))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer — View Cart / Pay */}
      {cartItemCount > 0 && activeCart && (
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 px-4 py-3 -mx-6 -mb-6 mt-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{cartItemCount} {t('picking.items')}</p>
              {grandTotal > 0 && (
                <p className="text-primary font-bold">₹{grandTotal.toFixed(2)}</p>
              )}
            </div>
          </div>
          <Link
            href={`/orders/${activeCart.id}`}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            {t('picking.viewCart')} &rarr;
          </Link>
        </div>
      )}

      {/* New Cart Dialog */}
      {showNewCartDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewCartDialog(false)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{t('picking.createCart')}</h3>
            <input
              value={newCartName}
              onChange={(e) => setNewCartName(e.target.value)}
              placeholder={t('picking.enterCartName')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCart()}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNewCartDialog(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium">{t('cancel')}</button>
              <button onClick={handleCreateCart} disabled={!newCartName.trim()} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50">{t('picking.create')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectCategories, selectItems, selectActiveCart, selectActiveCartItems,
  selectActiveCartItemCount, addItemToActiveCart, incrementItemInActiveCart, decrementItemInActiveCart, createCart,
} from '@groceryone/store';
import type { DomainTypes } from '@groceryone/store';
import { Search, Grid, List, Plus, Minus, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/common/ProductCard';

export default function ItemsPage() {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const allItems = useAppSelector(selectItems);
  const activeCart = useAppSelector(selectActiveCart);
  const cartItems = useAppSelector(selectActiveCartItems);
  const cartItemCount = useAppSelector(selectActiveCartItemCount);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const orderingCategories = useMemo(() => [...categories], [categories]);

  const filteredItems = useMemo(() => {
    let items = [...allItems];
    if (selectedCategory) items = items.filter((i) => i.categoryId === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || (i.nameTe && i.nameTe.includes(q)));
    }
    return items;
  }, [allItems, selectedCategory, searchQuery]);

  const cartItemMap = useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach((ci) => map.set(ci.item.id, ci.quantity));
    return map;
  }, [cartItems]);

  const handleAddItem = useCallback((item: DomainTypes.Item) => {
    if (!activeCart || activeCart.status === 'paid') {
      const now = new Date();
      const name = `Order ${now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`;
      dispatch(createCart({ name }));
    }
    dispatch(addItemToActiveCart({ item, quantity: item.defaultQuantity }));
  }, [dispatch, activeCart]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{t('navigation.items')}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('picking.searchItems')}
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}><Grid size={16} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}><List size={16} /></button>
          </div>
          {cartItemCount > 0 && (
            <Link href="/orders" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">
              <ShoppingCart size={16} /> {cartItemCount}
            </Link>
          )}
        </div>
      </div>

      {/* Category Bar */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${!selectedCategory ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{t('manageItems.all')}</button>
        {orderingCategories.map((cat) => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${selectedCategory === cat.id ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">{t('picking.noItemsFound')}</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                name={item.name}
                price={item.price}
                unit={item.unit}
                defaultQuantity={item.defaultQuantity}
                inCartQty={cartItemMap.get(item.id)}
                onAdd={() => handleAddItem(item)}
                onIncrement={() => dispatch(incrementItemInActiveCart(item.id))}
                onDecrement={() => dispatch(decrementItemInActiveCart(item.id))}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
            {filteredItems.map((item) => {
              const inCartQty = cartItemMap.get(item.id);
              return (
                <div key={item.id} className={`px-4 py-3 flex items-center gap-4 ${inCartQty ? 'bg-in-cart-bg dark:bg-green-900/10' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.unit} &middot; {categories.find((c) => c.id === item.categoryId)?.name}</p>
                  </div>
                  {item.price !== undefined && <p className="text-sm font-semibold text-primary">₹{item.price}</p>}
                  {inCartQty ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => dispatch(decrementItemInActiveCart(item.id))} className="w-7 h-7 rounded bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center"><Minus size={12} /></button>
                      <span className="text-sm font-medium w-12 text-center">{inCartQty}</span>
                      <button onClick={() => handleAddItem(item)} className="w-7 h-7 rounded bg-primary/10 text-primary flex items-center justify-center"><Plus size={12} /></button>
                    </div>
                  ) : (
                    <button onClick={() => handleAddItem(item)} className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">{t('picking.add')}</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

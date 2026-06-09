'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectCategories, selectItems, selectActiveCart, selectActiveCartItems,
  selectActiveCartItemCount, selectActiveCartGrandTotal, selectCartCount, selectAllCarts,
  addItemToActiveCart, incrementItemInActiveCart, decrementItemInActiveCart,
  createCart, setActiveCart, useLazyGetItemByBarcodeQuery,
} from '@groceryone/store';
import type { DomainTypes } from '@groceryone/store';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Search, ScanLine, CheckCircle2, AlertTriangle, PackagePlus, X } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/common/ProductCard';
import { BarcodeScannerModal } from '@/components/barcode/BarcodeScannerModal';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { resolveBarcode } from '@/lib/barcode/resolveBarcode';

export default function PickingPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
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
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  // Transient feedback for USB-scanner (keyboard-wedge) scans that happen
  // without the camera modal open.
  const [scanToast, setScanToast] = useState<{ kind: 'added' | 'missing'; text: string } | null>(null);
  const [triggerBarcode] = useLazyGetItemByBarcodeQuery();

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

  // Open the new-item form prefilled with an unrecognised barcode.
  const goAddProduct = useCallback((barcode: string) => {
    setShowBarcodeScanner(false);
    setScanToast(null);
    router.push(`/management/items?barcode=${encodeURIComponent(barcode)}`);
  }, [router]);

  // A code arrived from a USB/Bluetooth keyboard-wedge scanner (no modal open).
  // Resolve local→backend, then add to cart or surface a not-found toast.
  const handleScannedCode = useCallback(async (code: string) => {
    const res = await resolveBarcode<DomainTypes.Item>({
      barcode: code,
      items: allItems,
      lazyFetch: (b) => triggerBarcode(b).unwrap(),
    });
    if (res.status === 'not-found') {
      setScanToast({ kind: 'missing', text: code.trim() });
      return;
    }
    handleAddItem(res.item);
    setScanToast({ kind: 'added', text: res.item.name });
  }, [allItems, triggerBarcode, handleAddItem]);

  // Listen for USB-scanner bursts on this page. The default focus-guard lets
  // the search box and cart-name dialog keep normal human typing.
  useBarcodeScanner({ onScan: handleScannedCode });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h1 className="page-title">{t('picking.cartReview')}</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="search-wrap flex-1 sm:flex-none">
            <Search size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('picking.searchItems')}
              className="search-input sm:w-64"
            />
          </div>
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="btn-icon border border-line dark:border-line-dark"
            aria-label="Scan barcode"
            title={t('scan.title', 'Scan Barcode')}
          >
            <ScanLine size={18} />
          </button>
          <Link href="/orders" className="btn-primary whitespace-nowrap">
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
              className={`filter-tab ${activeCart?.id === cart.id ? 'filter-tab-solid' : ''}`}
            >
              {cart.name} ({cart.items.length})
            </button>
          ))}
          <button onClick={() => setShowNewCartDialog(true)} className="filter-tab filter-tab-dashed">
            {t('picking.newCart')}
          </button>
        </div>
      )}

      {/* Category Bar */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`filter-tab ${!selectedCategory ? 'filter-tab-active' : ''}`}
        >
          {t('manageItems.all')}
        </button>
        {orderingCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`filter-tab ${selectedCategory === cat.id ? 'filter-tab-active' : ''}`}
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
                defaultQuantity={item.defaultQuantity}
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
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-line dark:border-line-dark px-4 py-3 -mx-6 -mb-6 mt-4 flex items-center justify-between shadow-card-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <ShoppingCart size={20} className="text-primary dark:text-primary-light" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{cartItemCount} {t('picking.items')}</p>
              {grandTotal > 0 && (
                <p className="text-primary dark:text-primary-light font-bold">₹{grandTotal.toFixed(2)}</p>
              )}
            </div>
          </div>
          <Link href={`/orders/${activeCart.id}`} className="btn-primary btn-lg">
            {t('picking.viewCart')} &rarr;
          </Link>
        </div>
      )}

      {/* New Cart Dialog */}
      {showNewCartDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewCartDialog(false)}>
          <div className="card p-6 w-full max-w-sm mx-4 shadow-card-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{t('picking.createCart')}</h3>
            <input
              value={newCartName}
              onChange={(e) => setNewCartName(e.target.value)}
              placeholder={t('picking.enterCartName')}
              className="input mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCart()}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNewCartDialog(false)} className="btn-secondary flex-1">{t('cancel')}</button>
              <button onClick={handleCreateCart} disabled={!newCartName.trim()} className="btn-primary flex-1">{t('picking.create')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal (camera). Cart-add is owned here, so the modal
          is reusable by item management for fill-only scanning. */}
      {showBarcodeScanner && (
        <BarcodeScannerModal
          onClose={() => setShowBarcodeScanner(false)}
          onItemResolved={handleAddItem}
          onAddProduct={goAddProduct}
        />
      )}

      {/* USB-scanner toast */}
      {scanToast && (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-card-lg animate-slide-up text-sm font-medium ${
            scanToast.kind === 'added'
              ? 'bg-success-bg text-success border-success/30 dark:bg-success/15 dark:text-green-300 dark:border-success/40'
              : 'bg-warning-bg text-warning border-warning/30 dark:bg-warning/15 dark:text-amber-300 dark:border-warning/40'
          }`}
        >
          {scanToast.kind === 'added' ? (
            <>
              <CheckCircle2 size={18} />
              <span>{scanToast.text} — {t('picking.add', 'Added')}</span>
            </>
          ) : (
            <>
              <AlertTriangle size={18} />
              <span className="font-mono">{scanToast.text}</span>
              <span>{t('picking.noItemsFound', 'Item not found')}</span>
              <button
                onClick={() => goAddProduct(scanToast.text)}
                className="inline-flex items-center gap-1 bg-white dark:bg-card-dark text-warning border border-warning/30 font-semibold rounded-lg px-2.5 py-1 hover:bg-warning-bg dark:hover:bg-warning/10 transition-colors"
              >
                <PackagePlus size={14} /> {t('scan.addProduct', 'Add product')}
              </button>
            </>
          )}
          <button onClick={() => setScanToast(null)} aria-label={t('close', 'Close')} className="ml-1 opacity-80 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

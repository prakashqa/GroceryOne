'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectCategories,
  selectItems,
  selectIsAdmin,
  selectTenant,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useSeedSampleDataMutation,
  useAssignTestBarcodesMutation,
  StoreUtils,
  type TestBarcodeResult,
} from '@groceryone/store';
import { Plus, Edit2, Trash2, Search, Loader2, Sparkles, PackagePlus, ScanLine, Barcode, Copy, X } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { BarcodeScannerModal } from '@/components/barcode/BarcodeScannerModal';

function ItemManagementPageInner() {
  // Test-only tools (e.g. "Generate test barcodes") are compiled in ONLY for the
  // offline desktop build, which sets this flag in its build:web step. Next
  // statically inlines NEXT_PUBLIC_* at build, so the cloud build evaluates this
  // to false and the button is tree-shaken out. Read here (not module scope) so
  // tests can toggle it without re-importing React.
  const testTools = process.env.NEXT_PUBLIC_ENABLE_TEST_TOOLS === '1';
  const { t, i18n } = useTranslation('common');
  const categories = useAppSelector(selectCategories);
  const allItems = useAppSelector(selectItems);
  const [createItem] = useCreateItemMutation();
  const [updateItemMut] = useUpdateItemMutation();
  const [deleteItemMut] = useDeleteItemMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', barcode: '', categoryId: '', unit: 'pcs' as any, price: '', mrp: '', defaultQuantity: '1', openingQty: '', costPrice: '', lowStockThreshold: '' });
  const [activeTab, setActiveTab] = useState<'pricing' | 'stock'>('pricing');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanFill, setShowScanFill] = useState(false);
  const [assignBarcodes, { isLoading: genningBarcodes }] = useAssignTestBarcodesMutation();
  const [barcodeResult, setBarcodeResult] = useState<TestBarcodeResult | null>(null);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Fill the barcode field from a USB/Bluetooth scanner while the form is open.
  // captureInInput=true so a scan into the focused barcode box is captured.
  useBarcodeScanner({
    enabled: showForm,
    captureInInput: true,
    onScan: (code) => setForm((f) => ({ ...f, barcode: code })),
  });

  // Deep-link: /management/items?barcode=XXXX (from the POS "Add this product"
  // shortcut) opens the Add form prefilled with the scanned barcode. Depend on
  // the extracted STRING (stable) — not the searchParams object, which can be a
  // new reference each render and would loop.
  const incomingBarcode = searchParams?.get('barcode') ?? null;
  useEffect(() => {
    if (incomingBarcode) {
      setForm((f) => ({ ...f, barcode: incomingBarcode, categoryId: f.categoryId || categories[0]?.id || '' }));
      setShowForm(true);
    }
    // Only react when the query param value itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingBarcode]);

  const isAdmin = useAppSelector(selectIsAdmin);
  const tenant = useAppSelector(selectTenant);
  const [seedSample, { isLoading: seeding }] = useSeedSampleDataMutation();
  const [seedError, setSeedError] = useState<string | null>(null);
  const handleSeedSample = async () => {
    setSeedError(null);
    try {
      const res = await seedSample().unwrap();
      if (res.alreadySeeded) {
        setSeedError(t('manageItems.alreadySeeded', 'Sample data is already loaded.'));
      }
      // On success RTK Query invalidates the Product/Category LIST → the
      // catalog re-fetches and re-hydrates automatically (no full reload).
    } catch (e: any) {
      const msg = e?.data?.message || e?.data?.error?.message || (e as Error)?.message;
      setSeedError(typeof msg === 'string' ? msg : t('error', 'Something went wrong'));
    }
  };

  // Test tooling: assign EAN-13 barcodes to existing items, then show the
  // item→code list. Rides baseApi (JWT from Redux + auto-refresh), so it keeps
  // working after the app has been idle; tag invalidation re-hydrates the
  // catalog so codes appear on the rows with no full-page reload.
  const handleGenerateBarcodes = async () => {
    setBarcodeError(null);
    try {
      const res = await assignBarcodes().unwrap();
      setBarcodeResult(res);
    } catch (e: any) {
      const msg = e?.data?.message || e?.data?.error?.message || (e as Error)?.message;
      setBarcodeError(typeof msg === 'string' ? msg : t('error', 'Something went wrong'));
    }
  };

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (selectedCategory) items = items.filter((i) => i.categoryId === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.nameTe && i.nameTe.toLowerCase().includes(q)),
      );
    }
    return items;
  }, [allItems, selectedCategory, searchQuery]);

  const handleSave = async () => {
    if (!form.name.trim() || form.name.trim().length < 2 || !form.categoryId) return;
    setSaving(true);
    setError(null);

    try {
      const cat = categories.find((c) => c.id === form.categoryId);
      const categoryBackendId = cat?.backendId;

      if (!categoryBackendId) {
        setError(t('error'));
        setSaving(false);
        return;
      }

      // Stock fields (optional). An opening quantity auto-enables inventory
      // tracking; the backend records it as an 'initial'/'correction' txn.
      const opening = form.openingQty !== '' ? parseFloat(form.openingQty) : undefined;
      const costPrice = form.costPrice !== '' ? parseFloat(form.costPrice) : undefined;
      const lowStockThreshold = form.lowStockThreshold !== '' ? parseFloat(form.lowStockThreshold) : undefined;

      if (editId) {
        const item = allItems.find((i) => i.id === editId);
        if (!item?.backendId) {
          setError(t('error'));
          setSaving(false);
          return;
        }
        await updateItemMut({
          id: item.backendId,
          data: {
            name: form.name.trim(),
            barcode: form.barcode.trim() || undefined,
            categoryId: categoryBackendId,
            unit: form.unit,
            defaultQuantity: parseFloat(form.defaultQuantity) || 1,
            price: form.price ? parseFloat(form.price) : undefined,
            compareAtPrice: form.mrp ? parseFloat(form.mrp) : undefined,
            costPrice,
            lowStockThreshold,
            // Quantity change routes through inventory (setStock) server-side.
            stockQuantity: opening,
            ...(opening != null && opening > 0 ? { trackInventory: true } : {}),
          },
        }).unwrap();
      } else {
        const slug = StoreUtils.generateSlug(form.name.trim());
        await createItem({
          slug,
          name: form.name.trim(),
          barcode: form.barcode.trim() || undefined,
          categoryId: categoryBackendId,
          unit: form.unit,
          defaultQuantity: parseFloat(form.defaultQuantity) || 1,
          price: form.price ? parseFloat(form.price) : undefined,
          compareAtPrice: form.mrp ? parseFloat(form.mrp) : 0,
          costPrice,
          lowStockThreshold,
          stockQuantity: opening,
          ...(opening != null && opening > 0 ? { trackInventory: true } : {}),
        }).unwrap();
      }
      resetForm();
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.error?.message || t('error');
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: typeof allItems[0]) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      barcode: item.barcode || '',
      categoryId: item.categoryId,
      unit: item.unit,
      price: item.price?.toString() || '',
      mrp: item.mrp?.toString() || '',
      defaultQuantity: item.defaultQuantity.toString(),
      openingQty: item.stockQuantity != null ? item.stockQuantity.toString() : '',
      costPrice: item.costPrice != null ? item.costPrice.toString() : '',
      lowStockThreshold: item.lowStockThreshold != null ? item.lowStockThreshold.toString() : '',
    });
    setActiveTab('pricing');
    setError(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const item = allItems.find((i) => i.id === id);
    if (!item?.backendId) return;
    if (!confirm(t('manageItems.deleteConfirm', { name: item.name }))) return;

    try {
      await deleteItemMut(item.backendId).unwrap();
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.error?.message || t('error');
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ name: '', barcode: '', categoryId: categories[0]?.id || '', unit: 'pcs', price: '', mrp: '', defaultQuantity: '1', openingQty: '', costPrice: '', lowStockThreshold: '' }); setActiveTab('pricing'); setError(null); };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('manageItems.title')}</h1>
          <p className="page-subtitle">
            {t('manageItems.subtitle', 'Browse, search and manage your product catalog.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {testTools && isAdmin && allItems.length > 0 && (
            <button
              onClick={handleGenerateBarcodes}
              disabled={genningBarcodes}
              className="btn-secondary"
              data-testid="generate-test-barcodes"
              title={t('manageItems.generateBarcodesHint', 'Assign EAN-13 test barcodes to your items so you can test scanning')}
            >
              {genningBarcodes ? <Loader2 size={16} className="animate-spin" /> : <Barcode size={16} />}
              {t('manageItems.generateBarcodes', 'Generate test barcodes')}
            </button>
          )}
          <button
            onClick={() => { setForm((f) => ({ ...f, categoryId: categories[0]?.id || '' })); setError(null); setShowForm(true); }}
            className="btn-primary"
          >
            <Plus size={16} /> {t('manageItems.addItem')}
          </button>
        </div>
      </div>
      {barcodeError && <p className="error-text mb-3">{barcodeError}</p>}

      <div className="card p-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0 -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              !selectedCategory
                ? 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            {t('manageItems.all')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              <span className="mr-1">{c.icon}</span>
              {StoreUtils.getLocalizedName(c, i18n.language)}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56 flex-shrink-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search')}
            className="input pl-9 py-2 text-xs"
          />
        </div>
      </div>

      <div className="card">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <PackagePlus size={26} strokeWidth={1.8} />
            </div>
            <h3 className="empty-state-title">{t('manageItems.noItemsYet')}</h3>
            <p className="empty-state-hint">
              {t(
                'manageItems.emptyHint',
                'Add your first product, or load a sample catalog with starter categories and ~113 items.',
              )}
            </p>
            {isAdmin && tenant?.slug && allItems.length === 0 && (
              <div className="flex flex-col items-center gap-2 mt-2">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    onClick={() => { setForm((f) => ({ ...f, categoryId: categories[0]?.id || '' })); setError(null); setShowForm(true); }}
                    className="btn-primary"
                  >
                    <Plus size={16} /> {t('manageItems.addItem')}
                  </button>
                  <button
                    onClick={handleSeedSample}
                    disabled={seeding}
                    className="btn-secondary"
                    data-testid="seed-sample-data"
                  >
                    {seeding ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {seeding
                      ? t('manageItems.loadingSample', 'Loading sample data…')
                      : t('manageItems.loadSample', 'Load sample data')}
                  </button>
                </div>
                {seedError && <p className="error-text">{seedError}</p>}
              </div>
            )}
          </div>
        ) : (
          <ul className="row-divider">
            {filteredItems.map((item) => (
              <li key={item.id} className="row group">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {StoreUtils.getLocalizedName(item, i18n.language)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {StoreUtils.getLocalizedName(categories.find((c) => c.id === item.categoryId), i18n.language)}
                    <span className="mx-1.5">·</span>{item.unit}
                    <span className="mx-1.5">·</span>{t('manageItems.default')}: {item.defaultQuantity}
                  </p>
                  {item.barcode ? (
                    <p className="text-xs mt-1 inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                      <Barcode size={12} className="text-gray-400" />
                      <code className="font-mono">{item.barcode}</code>
                    </p>
                  ) : (
                    <p className="text-xs mt-1 inline-flex items-center gap-1 text-gray-400 dark:text-gray-500">
                      <Barcode size={12} />
                      {t('manageItems.noBarcode', 'No barcode')}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {item.price !== undefined && (
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{item.price}</p>
                  )}
                  {item.mrp !== undefined && item.mrp !== item.price && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-through">₹{item.mrp}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(item)}
                    className="btn-icon"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn-icon hover:bg-error/10 hover:text-error dark:hover:bg-error/15"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={resetForm}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editId ? t('manageItems.editItem') : t('manageItems.addItem')}</h3>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
            <div className="space-y-3">
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('manageItems.enterItemName')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" autoFocus />
              <div className="flex gap-2">
                <input value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} placeholder={t('manageItems.barcodeOptional', 'Barcode (scan or type, optional)')}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button
                  type="button"
                  onClick={() => setShowScanFill(true)}
                  aria-label={t('scan.scanToFill', 'Scan barcode')}
                  title={t('scan.scanToFill', 'Scan barcode')}
                  className="px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  <ScanLine size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm">
                <option value="">{t('manageItems.selectCategory')}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {StoreUtils.getLocalizedName(c, i18n.language)}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm">
                  {['kg', 'gm', 'pcs', 'L', 'ml'].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <input value={form.defaultQuantity} onChange={(e) => setForm((f) => ({ ...f, defaultQuantity: e.target.value }))} placeholder={t('manageItems.defaultQuantity')} type="number" step="0.1"
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" />
              </div>
              {/* Pricing | Stock tabs */}
              <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
                {(['pricing', 'stock'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab === 'pricing' ? t('manageItems.tabPricing', 'Pricing') : t('manageItems.tabStock', 'Stock')}
                  </button>
                ))}
              </div>

              {activeTab === 'pricing' ? (
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder={t('manageItems.salePrice')} type="number" step="0.01"
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" />
                  <input value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} placeholder={t('manageItems.mrp')} type="number" step="0.01"
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" />
                </div>
              ) : (
                <div className="space-y-3">
                  <input value={form.openingQty} onChange={(e) => setForm((f) => ({ ...f, openingQty: e.target.value }))} placeholder={t('manageItems.openingQuantity', 'Opening Quantity')} type="number" step="0.1" min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} placeholder={t('manageItems.atPrice', 'At Price (cost)')} type="number" step="0.01" min="0"
                      className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" />
                    <input value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} placeholder={t('manageItems.minStock', 'Min Stock To Maintain')} type="number" step="0.1" min="0"
                      className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" />
                  </div>
                  <p className="hint">{t('manageItems.stockHint', 'Enter an opening quantity to track this item in Inventory. Leave blank for untracked items (e.g. loose goods).')}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={resetForm} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium" disabled={saving}>{t('cancel')}</button>
              <button onClick={handleSave} disabled={!form.name.trim() || form.name.trim().length < 2 || !form.categoryId || saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? t('loading') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera scan to fill the barcode field (capture mode — raw code only). */}
      {showScanFill && (
        <BarcodeScannerModal
          title={t('scan.scanToFill', 'Scan barcode')}
          onClose={() => setShowScanFill(false)}
          onRawScan={(code) => {
            setForm((f) => ({ ...f, barcode: code }));
            setShowScanFill(false);
          }}
        />
      )}

      {/* Test-barcode result: lists item → code so the user can type a code into
          the Scan Barcode box. Closing reloads so the catalog picks up barcodes. */}
      {barcodeResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setBarcodeResult(null)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-xl animate-slide-up flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-line dark:border-line-dark">
              <div className="flex items-center gap-2">
                <Barcode size={20} className="text-primary" />
                <h3 className="text-lg font-semibold">{t('manageItems.testBarcodes', 'Test barcodes')}</h3>
              </div>
              <button onClick={() => setBarcodeResult(null)} aria-label={t('close', 'Close')} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <p className="px-5 pt-3 text-sm text-gray-500 dark:text-gray-400">
              {barcodeResult.updated > 0
                ? t('manageItems.testBarcodesDone', '{{n}} item(s) got a barcode. Type one into the Scan Barcode box to test.', { n: barcodeResult.updated })
                : t('manageItems.testBarcodesNone', 'All items already had barcodes.')}
              {barcodeResult.skipped > 0 && ` (${t('manageItems.testBarcodesSkipped', '{{n}} already had one', { n: barcodeResult.skipped })})`}
            </p>
            <ul className="px-5 py-3 overflow-y-auto divide-y divide-line dark:divide-line-dark">
              {barcodeResult.assignments.map((a) => (
                <li key={a.barcode} className="flex items-center gap-3 py-2">
                  <span className="flex-1 truncate text-sm text-gray-900 dark:text-gray-100">{a.name}</span>
                  <code className="font-mono text-sm text-primary dark:text-primary-light">{a.barcode}</code>
                  <button
                    onClick={() => navigator.clipboard?.writeText(a.barcode)}
                    className="btn-icon"
                    aria-label={t('copy', 'Copy')}
                    title={t('copy', 'Copy')}
                  >
                    <Copy size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3 border-t border-line dark:border-line-dark">
              <button onClick={() => setBarcodeResult(null)} className="btn-primary w-full">
                {t('done', 'Done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// useSearchParams() (for the ?barcode= deep link) must sit under a Suspense
// boundary or Next's static prerender of /management/items fails the build.
export default function ItemManagementPage() {
  return (
    <Suspense fallback={null}>
      <ItemManagementPageInner />
    </Suspense>
  );
}

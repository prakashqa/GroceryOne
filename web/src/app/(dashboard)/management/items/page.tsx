'use client';

import { useState, useMemo } from 'react';
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
  StoreUtils,
} from '@groceryone/store';
import { Plus, Edit2, Trash2, Search, Loader2, Sparkles, PackagePlus } from 'lucide-react';
import { seedSampleData, SeedApiError } from '@/lib/api/seed';

export default function ItemManagementPage() {
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
  const [form, setForm] = useState({ name: '', barcode: '', categoryId: '', unit: 'pcs' as any, price: '', mrp: '', defaultQuantity: '1' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = useAppSelector(selectIsAdmin);
  const tenant = useAppSelector(selectTenant);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const handleSeedSample = async () => {
    if (!tenant?.slug) return;
    setSeedError(null);
    setSeeding(true);
    try {
      const res = await seedSampleData(tenant.slug);
      if (res.alreadySeeded) {
        setSeedError(t('manageItems.alreadySeeded', 'Sample data is already loaded.'));
        setSeeding(false);
        return;
      }
      window.location.reload();
    } catch (e) {
      const msg = e instanceof SeedApiError ? e.message : (e as Error)?.message;
      setSeedError(msg || t('error', 'Something went wrong'));
      setSeeding(false);
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
    setForm({ name: item.name, barcode: item.barcode || '', categoryId: item.categoryId, unit: item.unit, price: item.price?.toString() || '', mrp: item.mrp?.toString() || '', defaultQuantity: item.defaultQuantity.toString() });
    setError(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const item = allItems.find((i) => i.id === id);
    if (!item?.backendId) return;
    if (!confirm(t('manageItems.deleteConfirm'))) return;

    try {
      await deleteItemMut(item.backendId).unwrap();
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.error?.message || t('error');
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ name: '', barcode: '', categoryId: categories[0]?.id || '', unit: 'pcs', price: '', mrp: '', defaultQuantity: '1' }); setError(null); };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('manageItems.title')}</h1>
          <p className="page-subtitle">
            {t('manageItems.subtitle', 'Browse, search and manage your product catalog.')}
          </p>
        </div>
        <button
          onClick={() => { setForm((f) => ({ ...f, categoryId: categories[0]?.id || '' })); setError(null); setShowForm(true); }}
          className="btn-primary"
        >
          <Plus size={16} /> {t('manageItems.addItem')}
        </button>
      </div>

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
              <input value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} placeholder="Barcode (optional)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
              <div className="grid grid-cols-2 gap-3">
                <input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder={t('manageItems.salePrice')} type="number" step="0.01"
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" />
                <input value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} placeholder={t('manageItems.mrp')} type="number" step="0.01"
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" />
              </div>
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
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectCategories,
  selectItems,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  StoreUtils,
} from '@groceryone/store';
import { Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';

export default function ItemManagementPage() {
  const { t } = useTranslation('common');
  const categories = useAppSelector(selectCategories);
  const allItems = useAppSelector(selectItems);
  const [createItem] = useCreateItemMutation();
  const [updateItemMut] = useUpdateItemMutation();
  const [deleteItemMut] = useDeleteItemMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', categoryId: '', unit: 'pcs' as any, price: '', mrp: '', defaultQuantity: '1' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (selectedCategory) items = items.filter((i) => i.categoryId === selectedCategory);
    if (searchQuery.trim()) items = items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
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
    setForm({ name: item.name, categoryId: item.categoryId, unit: item.unit, price: item.price?.toString() || '', mrp: item.mrp?.toString() || '', defaultQuantity: item.defaultQuantity.toString() });
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

  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ name: '', categoryId: categories[0]?.id || '', unit: 'pcs', price: '', mrp: '', defaultQuantity: '1' }); setError(null); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('manageItems.title')}</h1>
        <button onClick={() => { setForm((f) => ({ ...f, categoryId: categories[0]?.id || '' })); setError(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium"><Plus size={16} /> {t('manageItems.addItem')}</button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${!selectedCategory ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'}`}>{t('manageItems.all')}</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${selectedCategory === c.id ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'}`}>{c.icon} {c.name}</button>
          ))}
        </div>
        <div className="relative w-full sm:w-auto sm:ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('search')} className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800">
        {filteredItems.length === 0 ? <div className="p-8 text-center text-gray-400">{t('manageItems.noItemsYet')}</div> : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {filteredItems.map((item) => (
              <div key={item.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">{categories.find((c) => c.id === item.categoryId)?.name} &middot; {item.unit} &middot; {t('manageItems.default')}: {item.defaultQuantity}</p>
                </div>
                <div className="text-right">
                  {item.price !== undefined && <p className="text-sm font-semibold text-primary">₹{item.price}</p>}
                  {item.mrp !== undefined && <p className="text-xs text-gray-400 line-through">₹{item.mrp}</p>}
                </div>
                <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
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
              <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm">
                <option value="">{t('manageItems.selectCategory')}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
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

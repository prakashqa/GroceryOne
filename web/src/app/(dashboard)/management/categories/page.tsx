'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectCategories,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  StoreUtils,
} from '@groceryone/store';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';

export default function CategoryManagementPage() {
  const { t } = useTranslation('common');
  const categories = useAppSelector(selectCategories);
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategoryMut] = useUpdateCategoryMutation();
  const [deleteCategoryMut] = useDeleteCategoryMutation();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) return;
    setSaving(true);
    setError(null);

    try {
      if (editId) {
        const cat = categories.find((c) => c.id === editId);
        if (!cat?.backendId) {
          setError(t('manageCategories.deleteConfirm'));
          setSaving(false);
          return;
        }
        await updateCategoryMut({ id: cat.backendId, data: { name: name.trim(), icon } }).unwrap();
      } else {
        const slug = StoreUtils.generateSlug(name.trim());
        await createCategory({ slug, name: name.trim(), icon }).unwrap();
      }
      resetForm();
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.error?.message || t('error');
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat: typeof categories[0]) => {
    setEditId(cat.id); setName(cat.name); setIcon(cat.icon);
    setError(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat?.backendId) return;
    if (!confirm(t('manageCategories.deleteConfirm'))) return;

    try {
      await deleteCategoryMut(cat.backendId).unwrap();
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.error?.message || t('error');
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const resetForm = () => { setShowForm(false); setEditId(null); setName(''); setIcon('📁'); setError(null); };

  const icons = ['📁', '🌾', '🍚', '🫘', '🌶️', '🧂', '🫗', '🧹', '🥜', '🍪', '☕', '🥤'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('manageCategories.title')}</h1>
        <button onClick={() => { setError(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">
          <Plus size={16} /> {t('manageCategories.addCategory')}
        </button>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{t('manageCategories.noCategoriesYet')}</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {categories.map((cat) => (
              <div key={cat.id} className="px-5 py-3 flex items-center gap-4">
                <span className="text-2xl">{cat.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{cat.name}</p>
                  {cat.trackInventory && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{t('more.inventory')}</span>}
                </div>
                <button onClick={() => handleEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={resetForm}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editId ? t('manageCategories.editCategory') : t('manageCategories.addCategory')}</h3>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('manageCategories.enterCategoryName')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3" autoFocus />
            <p className="text-sm font-medium mb-2">{t('manageCategories.icon')}</p>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {icons.map((i) => (
                <button key={i} onClick={() => setIcon(i)}
                  className={`p-2 rounded-lg text-xl ${icon === i ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-gray-100'}`}>{i}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={resetForm} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium" disabled={saving}>{t('cancel')}</button>
              <button onClick={handleSave} disabled={!name.trim() || name.trim().length < 2 || saving}
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

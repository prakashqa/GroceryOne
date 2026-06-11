'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectCategories,
  selectItems,
  selectIsAdmin,
  selectTenant,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetDeletedCategoriesQuery,
  useRestoreCategoryMutation,
  useSeedSampleDataMutation,
  StoreUtils,
} from '@groceryone/store';
import { Plus, Edit2, Trash2, Loader2, Sparkles, FolderPlus, RotateCcw } from 'lucide-react';

export default function CategoryManagementPage() {
  const { t, i18n } = useTranslation('common');
  const categories = useAppSelector(selectCategories);
  const items = useAppSelector(selectItems);
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategoryMut] = useUpdateCategoryMutation();
  const [deleteCategoryMut] = useDeleteCategoryMutation();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = useAppSelector(selectIsAdmin);
  const tenant = useAppSelector(selectTenant);
  const [seedSample, { isLoading: seeding }] = useSeedSampleDataMutation();
  const [seedError, setSeedError] = useState<string | null>(null);

  // Recoverable (soft-deleted) categories — restoring one re-links its orphaned items.
  const { data: deletedCategories = [] } = useGetDeletedCategoriesQuery(
    { tenantSlug: tenant?.slug },
    { skip: !tenant?.slug },
  );
  const [restoreCategoryMut, { isLoading: restoring }] = useRestoreCategoryMutation();

  const handleRestore = async (id: string) => {
    try {
      await restoreCategoryMut(id).unwrap();
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.error?.message || t('error');
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleRestoreAll = async () => {
    for (const c of deletedCategories) {
      try {
        await restoreCategoryMut(c.id).unwrap();
      } catch {
        /* keep going; a slug clash on one shouldn't block the rest */
      }
    }
  };

  const handleSeedSample = async () => {
    setSeedError(null);
    try {
      const res = await seedSample().unwrap();
      if (res.alreadySeeded) {
        setSeedError(t('manageCategories.alreadySeeded', 'Sample data is already loaded.'));
      }
      // On success RTK Query invalidates Product/Category LIST → the catalog
      // re-fetches and re-hydrates automatically (no full reload needed).
    } catch (e: any) {
      const msg = e?.data?.message || e?.data?.error?.message || (e as Error)?.message;
      setSeedError(typeof msg === 'string' ? msg : t('error', 'Something went wrong'));
    }
  };

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

    // Block deletion while items still reference this category — otherwise those
    // items are left orphaned with no category. Pre-check the local catalog for
    // instant feedback; the backend enforces the same rule as a safety net.
    const itemCount = items.filter((i) => i.categoryId === cat.id).length;
    if (itemCount > 0) {
      alert(
        t('manageCategories.hasItems', {
          count: itemCount,
          defaultValue: 'This category has {{count}} item(s). Reassign or delete them first.',
        }),
      );
      return;
    }

    if (!confirm(t('manageCategories.deleteConfirm', { name: cat.name }))) return;

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
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('manageCategories.title')}</h1>
          <p className="page-subtitle">
            {t('manageCategories.subtitle', 'Organize your products into categories.')}
          </p>
        </div>
        <button
          onClick={() => { setError(null); setShowForm(true); }}
          className="btn-primary"
        >
          <Plus size={16} /> {t('manageCategories.addCategory')}
        </button>
      </div>

      {deletedCategories.length > 0 && (
        <div className="card border-warning/30 bg-warning-bg/40 dark:bg-warning/[0.06] mb-4" data-testid="recover-deleted">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {t('manageCategories.recoverTitle', 'Recover deleted categories')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t('manageCategories.recoverHint', 'These categories were deleted but their items are still here. Restore one to bring its items back under it.')}
              </p>
            </div>
            <button onClick={handleRestoreAll} disabled={restoring} className="btn-secondary btn-sm flex-shrink-0">
              {restoring ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              {t('manageCategories.restoreAll', 'Restore all')}
            </button>
          </div>
          <ul className="row-divider">
            {deletedCategories.map((cat) => {
              const itemCount = items.filter((i) => i.categoryId === cat.id).length;
              return (
                <li key={cat.id} className="row group">
                  <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/60 dark:bg-white/[0.04] flex items-center justify-center text-lg">
                    {cat.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {StoreUtils.getLocalizedName(cat, i18n.language)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('manageItems.itemsCount', { count: itemCount })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(cat.id)}
                    disabled={restoring}
                    className="btn-secondary btn-sm flex-shrink-0"
                    aria-label={t('manageCategories.restore', 'Restore')}
                  >
                    <RotateCcw size={14} /> {t('manageCategories.restore', 'Restore')}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="card">
        {categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FolderPlus size={26} strokeWidth={1.8} />
            </div>
            <h3 className="empty-state-title">{t('manageCategories.noCategoriesYet')}</h3>
            <p className="empty-state-hint">
              {t(
                'manageCategories.emptyHint',
                'Start organising your shop. Add your first category, or load a sample catalog to explore the app.',
              )}
            </p>
            {isAdmin && tenant?.slug && (
              <div className="flex flex-col items-center gap-2 mt-2">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    onClick={() => { setError(null); setShowForm(true); }}
                    className="btn-primary"
                  >
                    <Plus size={16} /> {t('manageCategories.addCategory')}
                  </button>
                  <button
                    onClick={handleSeedSample}
                    disabled={seeding}
                    className="btn-secondary"
                    data-testid="seed-sample-data"
                  >
                    {seeding ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {seeding
                      ? t('manageCategories.loadingSample', 'Loading sample data…')
                      : t('manageCategories.loadSample', 'Load sample data')}
                  </button>
                </div>
                <p className="hint text-center max-w-md">
                  {t(
                    'manageCategories.loadSampleHint',
                    'Sample data: 9 starter categories and ~113 items with Telugu names. You can edit or delete anything later.',
                  )}
                </p>
                {seedError && <p className="error-text">{seedError}</p>}
              </div>
            )}
          </div>
        ) : (
          <ul className="row-divider">
            {categories.map((cat) => (
              <li key={cat.id} className="row group">
                <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center text-xl">
                  {cat.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {StoreUtils.getLocalizedName(cat, i18n.language)}
                  </p>
                  {cat.trackInventory && (
                    <span className="badge-info mt-1">{t('more.inventory')}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="btn-icon"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={resetForm}>
          <div className="card bg-white dark:bg-card-dark p-6 w-full max-w-sm mx-4 shadow-card-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">
              {editId ? t('manageCategories.editCategory') : t('manageCategories.addCategory')}
            </h3>
            {error && <p className="text-sm text-error bg-error/10 dark:bg-error/15 rounded-lg px-3 py-2 mb-3">{error}</p>}
            <label className="label">{t('manageCategories.enterCategoryName')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('manageCategories.enterCategoryName')}
              className="input mb-4"
              autoFocus
            />
            <p className="label">{t('manageCategories.icon')}</p>
            <div className="grid grid-cols-6 gap-2 mb-5">
              {icons.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`h-10 rounded-lg text-xl transition-all ${
                    icon === i
                      ? 'bg-primary/15 ring-2 ring-primary scale-105'
                      : 'bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={resetForm} className="btn-secondary flex-1" disabled={saving}>
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || name.trim().length < 2 || saving}
                className="btn-primary flex-1"
              >
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

'use client';

/**
 * Employees management page (web)
 *
 * Owner-only screen. Lists employees, allows adding new cashiers, and
 * deactivating existing ones. The page itself is wrapped in RoleGate so
 * cashiers reaching this URL directly see the "Access restricted" panel;
 * backend additionally enforces role='admin' on the endpoints.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  selectTenant,
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useDeactivateEmployeeMutation,
  type Employee,
} from '@groceryone/store';
import { Plus, Loader2, AlertCircle, Users } from 'lucide-react';
import { RoleGate } from '@/components/common/RoleGate';
import { EmptyState } from '@/components/common/EmptyState';

export default function EmployeesPage() {
  return (
    <RoleGate roles={['admin']}>
      <EmployeesPageContent />
    </RoleGate>
  );
}

function EmployeesPageContent() {
  const { t } = useTranslation('common');
  const tenant = useSelector(selectTenant);
  const tenantSlug = tenant?.slug;

  // Route through baseApi (RTK Query) so the request carries the in-memory access
  // token and auto-refreshes on 401 — unlike the old localStorage-based client,
  // which 401'd on desktop (tokens live only in Redux there).
  const { data: employees, isLoading: loading, error: loadErrorRaw } =
    useGetEmployeesQuery(undefined, { skip: !tenantSlug });
  const [createEmployeeMut, { isLoading: submitting }] = useCreateEmployeeMutation();
  const [deactivateEmployeeMut] = useDeactivateEmployeeMutation();

  const loadError = loadErrorRaw
    ? ((loadErrorRaw as any)?.data?.message ||
        t('employees.errors.loadFailed', 'Could not load employees.'))
    : null;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    pin: '',
    confirmPin: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError(null);
    if (!form.firstName.trim()) {
      setFormError(t('employees.errors.firstNameRequired', 'First name is required'));
      return;
    }
    if (!/^\+?[0-9]{10,15}$/.test(form.phone.trim())) {
      setFormError(
        t('employees.errors.invalidPhone', 'Enter a valid phone number (10–15 digits).'),
      );
      return;
    }
    if (!/^\d{4}$/.test(form.pin)) {
      setFormError(t('employees.errors.invalidPin', 'PIN must be exactly 4 digits.'));
      return;
    }
    if (form.pin !== form.confirmPin) {
      setFormError(
        t('employees.errors.pinMismatch', 'PIN and confirmation do not match.'),
      );
      return;
    }

    try {
      await createEmployeeMut({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        phone: form.phone.trim(),
        pin: form.pin,
      }).unwrap();
      setForm({ firstName: '', lastName: '', phone: '', pin: '', confirmPin: '' });
      setShowForm(false);
      // The list refreshes automatically via RTK tag invalidation.
    } catch (e: any) {
      if (e?.status === 409) {
        setFormError(
          t(
            'employees.errors.duplicatePhone',
            'An employee with this phone number already exists.',
          ),
        );
      } else {
        setFormError(
          e?.data?.message ||
            t('employees.errors.createFailed', 'Could not create employee.'),
        );
      }
    }
  };

  const handleDeactivate = async (emp: Employee) => {
    const label = `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || emp.phone;
    if (
      !window.confirm(
        t(
          'employees.confirmDeactivate',
          `Deactivate ${label}? They will no longer be able to log in.`,
        ),
      )
    ) {
      return;
    }
    try {
      await deactivateEmployeeMut(emp.id).unwrap();
    } catch (e: any) {
      alert(e?.data?.message || t('employees.errors.deactivate', 'Could not deactivate.'));
    }
  };

  return (
    <div className="page page-container-wide">
      <div className="page-header">
        <h1 className="page-title">{t('employees.title', 'Employees')}</h1>
        <button onClick={() => setShowForm((v) => !v)} className={showForm ? 'btn-secondary' : 'btn-primary'}>
          {!showForm && <Plus size={16} />}
          {showForm ? t('cancel', 'Cancel') : t('employees.add', 'Add employee')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-3 mb-6 animate-scale-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t('employees.firstName', 'First name') + ' *'}
              value={form.firstName}
              onChange={(v) => setForm({ ...form, firstName: v })}
              testid="emp-firstName"
            />
            <Input
              label={t('employees.lastName', 'Last name')}
              value={form.lastName}
              onChange={(v) => setForm({ ...form, lastName: v })}
              testid="emp-lastName"
            />
            <Input
              label={t('employees.phone', 'Phone') + ' *'}
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="+919999000001"
              testid="emp-phone"
            />
            <div /> {/* spacer */}
            <Input
              label={t('employees.pin', 'PIN') + ' *'}
              value={form.pin}
              type="password"
              onChange={(v) =>
                setForm({ ...form, pin: v.replace(/\D/g, '').slice(0, 4) })
              }
              maxLength={4}
              testid="emp-pin"
            />
            <Input
              label={t('employees.confirmPin', 'Confirm PIN') + ' *'}
              value={form.confirmPin}
              type="password"
              onChange={(v) =>
                setForm({ ...form, confirmPin: v.replace(/\D/g, '').slice(0, 4) })
              }
              maxLength={4}
              testid="emp-confirmPin"
            />
          </div>

          {formError && (
            <div className="flex items-start gap-2 error-text" role="alert">
              <AlertCircle size={16} className="mt-px flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="btn-primary" data-testid="emp-submit">
              {submitting && <Loader2 className="animate-spin" size={16} />}
              {t('employees.create', 'Create employee')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="animate-spin" size={20} />
        </div>
      ) : loadError ? (
        <div className="card p-4 border-error/40 bg-error-bg dark:bg-error/10 text-error text-sm">
          {loadError}
        </div>
      ) : !employees || employees.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users size={26} strokeWidth={1.8} />}
            title={t('employees.emptyTitle', 'No employees yet')}
            hint={t('employees.empty', 'No employees yet. Click "Add" to create your first one.')}
          />
        </div>
      ) : (
        <ul className="card row-divider">
          {employees.map((emp) => {
            const name = `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();
            const isInactive = emp.status !== 'active';
            const isOwner = emp.role === 'admin';
            return (
              <li key={emp.id} className={`row ${isInactive ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {name || emp.phone}
                    {isOwner && (
                      <span className="badge-primary ml-2">{t('employees.ownerTag', 'Owner')}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {emp.phone}
                    {isInactive && <span className="ml-2">· {t('employees.inactive', 'Inactive')}</span>}
                  </div>
                </div>
                {!isOwner && !isInactive && (
                  <button onClick={() => handleDeactivate(emp)} className="btn-danger btn-sm">
                    {t('employees.deactivate', 'Deactivate')}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  maxLength,
  testid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  testid?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
        className="input"
      />
    </div>
  );
}

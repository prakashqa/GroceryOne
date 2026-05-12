'use client';

/**
 * Employees management page (web)
 *
 * Owner-only screen. Lists employees, allows adding new cashiers, and
 * deactivating existing ones. The page itself is wrapped in RoleGate so
 * cashiers reaching this URL directly see the "Access restricted" panel;
 * backend additionally enforces role='admin' on the endpoints.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectTenant } from '@groceryone/store';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { RoleGate } from '@/components/common/RoleGate';
import {
  Employee,
  EmployeesApiError,
  createEmployee,
  deactivateEmployee,
  listEmployees,
} from '@/lib/api/employees';

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

  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    pin: '',
    confirmPin: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!tenantSlug) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listEmployees(tenantSlug);
      setEmployees(data);
    } catch (e: any) {
      setLoadError(
        e?.message ||
          t('employees.errors.loadFailed', 'Could not load employees.'),
      );
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantSlug) return;

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

    setSubmitting(true);
    try {
      await createEmployee(tenantSlug, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        phone: form.phone.trim(),
        pin: form.pin,
      });
      setForm({ firstName: '', lastName: '', phone: '', pin: '', confirmPin: '' });
      setShowForm(false);
      await refresh();
    } catch (e: any) {
      if (e instanceof EmployeesApiError && e.status === 409) {
        setFormError(
          t(
            'employees.errors.duplicatePhone',
            'An employee with this phone number already exists.',
          ),
        );
      } else {
        setFormError(
          e?.message ||
            t('employees.errors.createFailed', 'Could not create employee.'),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (emp: Employee) => {
    if (!tenantSlug) return;
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
      await deactivateEmployee(tenantSlug, emp.id);
      await refresh();
    } catch (e: any) {
      alert(e?.message || t('employees.errors.deactivate', 'Could not deactivate.'));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {t('employees.title', 'Employees')}
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          {showForm
            ? t('cancel', 'Cancel')
            : t('employees.add', 'Add employee')}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3"
        >
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
            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              data-testid="emp-submit"
            >
              {submitting && <Loader2 className="animate-spin" size={16} />}
              {t('employees.create', 'Create employee')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="animate-spin" size={20} />
        </div>
      ) : loadError ? (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          {loadError}
        </div>
      ) : !employees || employees.length === 0 ? (
        <div className="p-8 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center text-gray-500">
          {t(
            'employees.empty',
            'No employees yet. Click "Add" to create your first one.',
          )}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          {employees.map((emp) => {
            const name = `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();
            const isInactive = emp.status !== 'active';
            const isOwner = emp.role === 'admin';
            return (
              <li
                key={emp.id}
                className={`flex items-center justify-between p-4 ${isInactive ? 'opacity-60' : ''}`}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {name || emp.phone}
                    {isOwner && (
                      <span className="ml-2 text-xs uppercase text-primary">
                        {t('employees.ownerTag', 'Owner')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {emp.phone}
                    {isInactive && (
                      <span className="ml-2">
                        · {t('employees.inactive', 'Inactive')}
                      </span>
                    )}
                  </div>
                </div>
                {!isOwner && !isInactive && (
                  <button
                    onClick={() => handleDeactivate(emp)}
                    className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
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
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-gray-500 dark:text-gray-400">{label}</span>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
        className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}

'use client';

/**
 * Admin — Desktop license keys
 *
 * Owner-only screen for the manual-payment flow: a customer pays ₹2,000
 * via UPI / bank, then support mints a desktop_yearly license key here and
 * emails it to them. The generated key is shown ONCE (copy it before
 * leaving the page).
 *
 * Wrapped in RoleGate so cashiers hitting this URL see the "Access
 * restricted" panel; the backend additionally enforces role='admin' on
 * POST /licenses/generate AND cross-checks that the tenantSlug equals the
 * admin's own tenant.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectTenant } from '@groceryone/store';
import { Loader2, AlertCircle, Copy, Check, KeyRound } from 'lucide-react';
import { RoleGate } from '@/components/common/RoleGate';
import {
  GeneratedLicense,
  LicensesApiError,
  generateLicense,
} from '@/lib/api/licenses';

export default function AdminLicensesPage() {
  return (
    <RoleGate roles={['admin']}>
      <AdminLicensesContent />
    </RoleGate>
  );
}

function AdminLicensesContent() {
  const { t } = useTranslation('common');
  const tenant = useSelector(selectTenant);
  const tenantSlug = tenant?.slug;

  const [paymentRef, setPaymentRef] = useState('');
  const [expiresAt, setExpiresAt] = useState(''); // yyyy-mm-dd, optional
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [minted, setMinted] = useState<GeneratedLicense | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantSlug) return;
    setFormError(null);
    setMinted(null);

    setSubmitting(true);
    try {
      const result = await generateLicense(tenantSlug, {
        tenantSlug,
        plan: 'desktop_yearly',
        paymentRef: paymentRef.trim() || undefined,
        // Convert the date-only input to an end-of-day ISO timestamp.
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59.000Z`).toISOString() : undefined,
      });
      setMinted(result);
      setPaymentRef('');
      setExpiresAt('');
    } catch (e: any) {
      if (e instanceof LicensesApiError && e.status === 403) {
        setFormError(
          t(
            'licenses.errors.forbidden',
            'You can only mint license keys for your own business.',
          ),
        );
      } else {
        setFormError(
          e?.message ||
            t('licenses.errors.generateFailed', 'Could not generate a license key.'),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyKey = async () => {
    if (!minted) return;
    try {
      await navigator.clipboard.writeText(minted.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound size={22} className="text-primary" />
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {t('licenses.title', 'Desktop license keys')}
        </h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t(
          'licenses.subtitle',
          'Mint a yearly desktop license (₹2,000) after a customer pays. The key is shown once — copy it before leaving.',
        )}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label={t('licenses.plan', 'Plan')}
            value="desktop_yearly · ₹2,000 / year"
            readOnly
          />
          <Field
            label={t('licenses.business', 'Business')}
            value={tenant?.name ? `${tenant.name} (${tenantSlug})` : (tenantSlug ?? '')}
            readOnly
          />
          <EditableField
            label={t('licenses.paymentRef', 'Payment reference')}
            value={paymentRef}
            onChange={setPaymentRef}
            placeholder="manual-UPI-2026-05-15"
            testid="lic-paymentRef"
          />
          <EditableField
            label={t('licenses.expiresAt', 'Expires on (optional)')}
            value={expiresAt}
            onChange={setExpiresAt}
            type="date"
            testid="lic-expiresAt"
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
            disabled={submitting || !tenantSlug}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
            data-testid="lic-submit"
          >
            {submitting && <Loader2 className="animate-spin" size={16} />}
            {t('licenses.generate', 'Generate license key')}
          </button>
        </div>
      </form>

      {minted && (
        <div className="p-4 rounded-lg border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
            {t('licenses.minted', 'Key generated — copy it now and email it to the customer:')}
          </div>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-green-300 dark:border-green-700 font-mono text-base tracking-wider text-gray-900 dark:text-gray-100 select-all"
              data-testid="lic-key"
            >
              {minted.key}
            </code>
            <button
              onClick={copyKey}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-green-300 dark:border-green-700 text-sm text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? t('licenses.copied', 'Copied') : t('licenses.copy', 'Copy')}
            </button>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
            <Meta label={t('licenses.status', 'Status')} value={minted.status} />
            <Meta
              label={t('licenses.validUntil', 'Valid until')}
              value={new Date(minted.expiresAt).toLocaleDateString()}
            />
            {minted.paymentRef && (
              <Meta label={t('licenses.paymentRef', 'Payment ref')} value={minted.paymentRef} />
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  readOnly,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
}) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-gray-500 dark:text-gray-400">{label}</span>
      <input
        value={value}
        readOnly={readOnly}
        className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
      />
    </label>
  );
}

function EditableField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  testid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  testid?: string;
}) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-gray-500 dark:text-gray-400">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
        className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

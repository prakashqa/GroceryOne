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
import { LicensePaymentQr } from '@/components/payment/LicensePaymentQr';
import {
  GeneratedLicense,
  LicensesApiError,
  generateLicense,
} from '@/lib/api/licenses';

// GroOne's collection VPA for the ₹2,000/year desktop license. This is the
// SOFTWARE VENDOR's account (money paid TO GroOne), NOT a tenant/store merchant
// VPA (that one, in Payment Settings, collects grocery sales for the shop).
// Baked-in default works in every build; override via env if it ever changes.
const DEFAULT_LICENSE_UPI_ID = '8523045933@ibl';
const LICENSE_UPI_ID = process.env.NEXT_PUBLIC_GROONE_LICENSE_UPI_ID || DEFAULT_LICENSE_UPI_ID;
const LICENSE_PAYEE = process.env.NEXT_PUBLIC_GROONE_LICENSE_PAYEE || 'GroOne';
const LICENSE_PRICE_INR = 2000;

export default function AdminLicensesPage() {
  // Vendor tool only — the desktop build hides minting entirely (the local
  // backend also refuses, having no signing key). Customers contact support.
  if (process.env.NEXT_PUBLIC_DESKTOP_BUILD === '1') {
    return (
      <div className="page page-container">
        <div className="card p-8 text-center">
          <KeyRound size={28} className="mx-auto text-primary dark:text-primary-light mb-3" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            License keys are issued by GroOne
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            To purchase or renew a desktop license, contact support on WhatsApp: 9010888871
          </p>
        </div>
      </div>
    );
  }
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

  // Payment gate (mirrors the backend): a key may only be minted against a
  // non-trivial payment reference — the UPI transaction id.
  const refValid = paymentRef.trim().length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantSlug) return;
    setFormError(null);
    setMinted(null);

    const ref = paymentRef.trim();
    if (ref.length < 6) {
      setFormError(
        t('licenses.errors.refRequired', 'Enter the UPI transaction ID (payment reference) first.'),
      );
      return;
    }
    // Human gate — staff confirm the money actually landed before minting.
    if (
      !window.confirm(
        t(
          'licenses.confirmMint',
          `Confirm ₹2,000 was received (ref: ${ref})? A license key will be minted.`,
        ),
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await generateLicense(tenantSlug, {
        tenantSlug,
        plan: 'desktop_yearly',
        paymentRef: ref,
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
      } else if (e instanceof LicensesApiError && e.status === 409) {
        setFormError(
          t(
            'licenses.errors.refUsed',
            'This payment reference was already used for another key.',
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
    <div className="page page-container">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound size={22} className="text-primary dark:text-primary-light" />
        <h1 className="page-title">{t('licenses.title', 'Desktop license keys')}</h1>
      </div>
      <p className="page-subtitle mb-6">
        {t(
          'licenses.subtitle',
          'Mint a yearly desktop license (₹2,000) after a customer pays. The key is shown once — copy it before leaving.',
        )}
      </p>

      {/* Step 1 — collect payment by UPI. Static QR: it pre-fills payee +
          amount but does NOT confirm payment; verify receipt before minting. */}
      <LicensePaymentQr
        upiId={LICENSE_UPI_ID}
        payeeName={LICENSE_PAYEE}
        amount={LICENSE_PRICE_INR}
        note={`GroOne license ${tenantSlug ?? ''}`.trim()}
      />

      <form onSubmit={handleSubmit} className="card p-5 space-y-3 mb-6">
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
            label={`${t('licenses.paymentRef', 'Payment reference')} *`}
            value={paymentRef}
            onChange={setPaymentRef}
            placeholder="UPI-TXN-425912345678"
            testid="lic-paymentRef"
            hint={t('licenses.paymentRefHint', 'Enter the UPI transaction ID after the payment is received.')}
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
          <div className="flex items-start gap-2 error-text" role="alert">
            <AlertCircle size={16} className="mt-px flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !tenantSlug || !refValid}
            className="btn-primary"
            data-testid="lic-submit"
          >
            {submitting && <Loader2 className="animate-spin" size={16} />}
            {t('licenses.generate', 'Generate license key')}
          </button>
        </div>
      </form>

      {minted && (
        <div className="card p-4 border-success/40 bg-success-bg dark:bg-success/10 animate-scale-in">
          <div className="text-sm font-medium text-success dark:text-green-300 mb-2">
            {t('licenses.minted', 'Key generated — copy it now and email it to the customer:')}
          </div>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 px-3 py-2 rounded-md bg-white dark:bg-card-dark border border-success/30 dark:border-success/40 font-mono text-xs break-all text-gray-900 dark:text-gray-100 select-all"
              data-testid="lic-key"
            >
              {minted.key}
            </code>
            <button onClick={copyKey} className="btn-secondary btn-sm">
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
    <div>
      <label className="label">{label}</label>
      <input value={value} readOnly={readOnly} className="input bg-gray-50 dark:bg-surface-dark" />
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  testid,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  testid?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
        className="input"
      />
      {hint && <p className="hint">{hint}</p>}
    </div>
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

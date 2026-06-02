'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { selectTenant, setCredentials, setTenant } from '@groceryone/store';
import {
  savePersistedTokens,
  saveLastIdentifier,
  loadLastIdentifier,
} from '@/lib/auth/authStorage';
import { loadLastLogin, saveLastLogin } from '@/lib/auth/lastLogin';

/**
 * PIN login: POST /auth/login/pin with `{ identifier, pin }` and
 * X-Tenant-ID header. On success, persist tokens (tenant-namespaced) and
 * route to /dashboard. On failure, surface inline error and clear PIN.
 *
 * The identifier (email or phone) is remembered per tenant in
 * localStorage so the user only types it once per browser/tenant pair.
 */
/**
 * POST /auth/resolve-tenant for a given identifier and write the result into
 * Redux + localStorage. Returns the resolved slug, or null when the backend
 * has no account for that identifier.
 *
 * Shared between the auto-resolve-on-mount effect and the submit-time
 * fallback so the behavior is identical in both places.
 */
async function resolveTenantFor(identifier: string, dispatch: ReturnType<typeof useAppDispatch>): Promise<string | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const res = await fetch(`${apiUrl}/auth/resolve-tenant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Version': '1.0' },
      body: JSON.stringify({ identifier }),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    const data = json.data || json;
    if (!data?.tenantSlug) return null;

    const tenantObj = {
      id: data.tenantSlug,
      slug: data.tenantSlug,
      name: data.tenantName || data.tenantSlug,
      status: 'active' as const,
      subscriptionPlan: 'basic',
      branding: { primaryColor: '#2E7D32', secondaryColor: '#66BB6A', fontFamily: 'system' },
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'te'],
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      config: { features: {}, limits: {}, paymentGateways: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('@tenant_id', data.tenantSlug);
      localStorage.setItem('@tenant_data', JSON.stringify(tenantObj));
    }
    dispatch(setTenant(tenantObj as any));
    return data.tenantSlug;
  } catch {
    return null;
  }
}

export default function PinLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { t } = useTranslation('auth');
  const dispatch = useAppDispatch();
  const tenant = useAppSelector(selectTenant);
  const tenantSlug = tenant?.slug || '';

  // Auto-resolve guard so the mount-effect only fires once per page.
  const autoResolveAttempted = useRef(false);

  // Pre-fill identifier from a previous successful login on this device.
  useEffect(() => {
    if (!tenantSlug) return;
    const remembered = loadLastIdentifier(tenantSlug);
    if (remembered && !identifier) setIdentifier(remembered);
    // identifier is intentionally excluded from deps — we only prefill once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

  // Self-heal: if the page is mounted without a Redux tenant (e.g. after a
  // logout that cleared session state), look up the last-login hint and
  // auto-resolve the tenant + identifier. The user lands on a ready-to-go
  // PIN keypad without retyping their email or jumping through
  // /tenant-setup.
  useEffect(() => {
    if (tenantSlug) return; // already have a tenant
    if (autoResolveAttempted.current) return;
    autoResolveAttempted.current = true;
    const hint = loadLastLogin();
    if (!hint) return;
    setIdentifier((current) => current || hint.identifier);
    void resolveTenantFor(hint.identifier, dispatch);
  }, [tenantSlug, dispatch]);

  const submitPin = useCallback(
    async (fullPin: string) => {
      if (!identifier.trim()) {
        setError(t('error.identifierRequired', 'Enter your email or phone first.'));
        setPin('');
        return;
      }

      // Defence-in-depth: if Redux still has no tenant (auto-resolve on
      // mount may have failed or not yet completed), try one more time with
      // the identifier the user just typed. Single user action, no extra
      // navigation.
      let effectiveSlug = tenantSlug;
      if (!effectiveSlug) {
        const resolved = await resolveTenantFor(identifier.trim(), dispatch);
        if (resolved) effectiveSlug = resolved;
      }
      if (!effectiveSlug) {
        setError(
          t(
            'error.noStore',
            "This device isn't linked to a store yet. Tap \"Setup New Store\" to get started.",
          ),
        );
        setPin('');
        return;
      }

      setSubmitting(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        const res = await fetch(`${apiUrl}/auth/login/pin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Version': '1.0',
            'X-Tenant-ID': effectiveSlug,
          },
          body: JSON.stringify({ identifier: identifier.trim(), pin: fullPin }),
        });
        const json = await res.json().catch(() => ({}));
        const data = json.data || json;

        if (!res.ok) {
          // Don't leak server-side error specifics; show a friendly message
          // and let the user retry. Wipe the PIN so they re-enter cleanly.
          setError(t('error.invalidPin', 'Invalid PIN. Please try again.'));
          setPin('');
          return;
        }

        // Persist tokens (namespaced per-tenant) so reload keeps the user signed in.
        savePersistedTokens(effectiveSlug, {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tenantSlug: effectiveSlug,
        });
        saveLastIdentifier(effectiveSlug, identifier.trim());
        // Save the global last-login hint so logout → re-launch auto-fills
        // the email AND resolves the tenant without any user typing.
        saveLastLogin({ tenantSlug: effectiveSlug, identifier: identifier.trim() });

        dispatch(
          setCredentials({
            user: data.user,
            tokens: {
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              expiresIn: data.expiresIn ?? 3600,
            } as any,
            requiresPinSetup: false,
          }),
        );

        router.push('/dashboard');
      } catch {
        setError(t('error.network', 'Server unreachable. Please check your connection.'));
        setPin('');
      } finally {
        setSubmitting(false);
      }
    },
    [identifier, tenantSlug, dispatch, router, t],
  );

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (submitting) return;
      if (pin.length >= 4) return;
      const newPin = pin + digit;
      setPin(newPin);
      setError(null);
      if (newPin.length === 4) {
        // Fire and forget — submitPin manages its own state.
        void submitPin(newPin);
      }
    },
    [pin, submitting, submitPin],
  );

  const handleBackspace = useCallback(() => {
    if (submitting) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  }, [submitting]);

  return (
    <div className="card bg-white dark:bg-card-dark rounded-2xl shadow-card-lg p-7 sm:p-8 animate-fade-up">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
          <Lock size={22} className="text-primary dark:text-primary-light" strokeWidth={1.8} />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-center mb-1 text-gray-900 dark:text-gray-100 tracking-tight">
        {t('enterPin', 'Enter PIN')}
      </h2>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-6">
        {t('enterPinHint', 'Type your 4-digit PIN to sign in.')}
      </p>

      {/* Identifier (email or phone) */}
      <div className="mb-5">
        <label className="label">{t('identifier', 'Email or phone')}</label>
        <input
          type="text"
          autoComplete="username"
          inputMode="email"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            setError(null);
          }}
          disabled={submitting}
          placeholder={t('identifierPlaceholder', 'admin@yourstore.com')}
          className="input"
        />
      </div>

      {/* PIN dots */}
      <div className="flex justify-center gap-3.5 mb-7" role="status" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
              i < pin.length
                ? 'bg-primary dark:bg-primary-light scale-110 shadow-[0_0_0_4px_rgba(46,125,50,0.12)]'
                : 'bg-transparent border-2 border-gray-300 dark:border-gray-600'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-error text-center text-sm mb-4 animate-fade-in" role="alert">
          {error}
        </p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
          if (key === '') return <div key="empty" />;
          if (key === 'del') {
            return (
              <button
                key="del"
                onClick={handleBackspace}
                disabled={submitting}
                aria-label="Delete"
                className="h-14 rounded-xl text-lg font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] active:scale-95 transition-all duration-150 flex items-center justify-center disabled:opacity-50 text-gray-600 dark:text-gray-300"
              >
                &#x232B;
              </button>
            );
          }
          return (
            <button
              key={key}
              onClick={() => handleDigitPress(key)}
              disabled={submitting}
              className="h-14 rounded-xl text-xl font-semibold bg-gray-50 hover:bg-primary/10 hover:text-primary dark:bg-white/[0.03] dark:hover:bg-primary/15 dark:hover:text-primary-light active:scale-95 transition-all duration-150 disabled:opacity-50 text-gray-700 dark:text-gray-200"
            >
              {key}
            </button>
          );
        })}
      </div>

      <div className="section-divider mt-7 mb-4" />
      <div className="text-center">
        <a
          href="/tenant-setup"
          className="inline-flex items-center gap-1.5 text-sm text-primary dark:text-primary-light font-medium hover:underline underline-offset-4 transition-colors"
        >
          {t('setupNewStore', 'Setup New Store')}
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}

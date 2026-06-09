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
import {
  classifyLogin,
  looksLikeCompleteIdentifier,
  type ResolvedTenant,
} from '@/lib/auth/resolveLogin';

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
async function resolveTenantFor(
  identifier: string,
  dispatch: ReturnType<typeof useAppDispatch>,
): Promise<ResolvedTenant | null> {
  const id = identifier.trim();
  if (!id) return null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const res = await fetch(`${apiUrl}/auth/resolve-tenant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Version': '1.0' },
      body: JSON.stringify({ identifier: id }),
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
    return {
      tenantSlug: data.tenantSlug,
      tenantName: data.tenantName || data.tenantSlug,
      userFirstName: data.userFirstName,
    };
  } catch {
    return null;
  }
}

export default function PinLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // True when the identifier was auto-filled from a prior login (not typed).
  // Drives the "Use a different account" affordance so a second user on a
  // shared device can clear the previous person's identifier in one tap.
  const [prefilled, setPrefilled] = useState(false);
  // Live account confirmation as the user types their email/phone. Lets an
  // employee SEE "Signing in to <Store>" (or "No account found") BEFORE they
  // commit a 4-digit PIN — the previous flow only revealed problems after.
  const [account, setAccount] = useState<{
    state: 'idle' | 'checking' | 'found' | 'missing';
    storeName?: string;
    firstName?: string;
  }>({ state: 'idle' });
  const router = useRouter();
  const { t } = useTranslation('auth');
  const dispatch = useAppDispatch();
  const tenant = useAppSelector(selectTenant);
  const tenantSlug = tenant?.slug || '';
  const identifierInputRef = useRef<HTMLInputElement>(null);

  // Auto-resolve guard so the mount-effect only fires once per page.
  const autoResolveAttempted = useRef(false);

  // Auto-focus the identifier field when nothing is pre-filled, so the very
  // first thing an employee does is type their phone — not tap the PIN pad
  // and hit "enter your email or phone first".
  useEffect(() => {
    if (!identifier) identifierInputRef.current?.focus();
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live resolve: when the typed identifier looks complete (10+ digit phone or
  // a plausible email), debounce-resolve the tenant so the user gets immediate
  // "found / not found" feedback. This is the key employee-login fix: a cashier
  // typing their phone now sees their store name confirmed before the PIN.
  useEffect(() => {
    const id = identifier.trim();
    if (!looksLikeCompleteIdentifier(id)) {
      setAccount({ state: 'idle' });
      return;
    }
    let cancelled = false;
    setAccount({ state: 'checking' });
    const timer = setTimeout(async () => {
      const resolved = await resolveTenantFor(id, dispatch);
      if (cancelled) return;
      setAccount(
        resolved
          ? { state: 'found', storeName: resolved.tenantName, firstName: resolved.userFirstName }
          : { state: 'missing' },
      );
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [identifier, dispatch]);

  // Pre-fill identifier from a previous successful login on this device.
  useEffect(() => {
    if (!tenantSlug) return;
    const remembered = loadLastIdentifier(tenantSlug);
    if (remembered && !identifier) {
      setIdentifier(remembered);
      setPrefilled(true);
    }
    // identifier is intentionally excluded from deps — we only prefill once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

  // Clear the pre-filled identifier + PIN so a different user can sign in.
  const useDifferentAccount = useCallback(() => {
    setIdentifier('');
    setPin('');
    setError(null);
    setPrefilled(false);
    setAccount({ state: 'idle' });
    // Focus the field so the next user can type immediately.
    identifierInputRef.current?.focus();
  }, []);

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
      const typedId = identifier.trim();
      if (!typedId) {
        setError(t('error.identifierRequired', 'Enter your email or phone first.'));
        setPin('');
        return;
      }

      setSubmitting(true);
      setError(null);

      // Authoritative on the TYPED identifier: on a shared shop device the
      // Redux/localStorage tenant belongs to whoever logged in last (often
      // the owner). Resolving fresh from what the user actually typed ensures
      // a cashier is logged into THEIR account/tenant — never the owner's
      // stale one. resolveTenantFor also writes @tenant_data so the rest of
      // the app sees the right store.
      let resolved = await resolveTenantFor(typedId, dispatch);

      // Offline fallback: if resolve couldn't reach the server but Redux
      // already holds a tenant for this device, use it so an offline user
      // isn't locked out. (Online, resolve is the source of truth.)
      let effectiveSlug = resolved?.tenantSlug || '';
      if (!effectiveSlug && tenantSlug) {
        effectiveSlug = tenantSlug;
        resolved = { tenantSlug, tenantName: tenant?.name || tenantSlug };
      }

      // No account anywhere for the typed identifier → say so honestly
      // (this is NOT "invalid PIN" — the identifier itself isn't recognised).
      if (!effectiveSlug) {
        setSubmitting(false);
        setError(
          t(
            'error.noAccount',
            'No account found for that email or phone. Check it and try again.',
          ),
        );
        setPin('');
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        const res = await fetch(`${apiUrl}/auth/login/pin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Version': '1.0',
            'X-Tenant-ID': effectiveSlug,
          },
          body: JSON.stringify({ identifier: typedId, pin: fullPin }),
        });
        const json = await res.json().catch(() => ({}));
        const data = json.data || json;

        const outcome = classifyLogin({ resolved, loginStatus: res.status });
        if (outcome !== 'SUCCESS') {
          // The account exists (resolve succeeded) but the PIN was wrong →
          // honest "Incorrect PIN", not the old blanket "Invalid PIN" that
          // also fired for wrong-identifier. Wipe the PIN to re-enter cleanly.
          setError(
            outcome === 'INVALID_PIN'
              ? t('error.incorrectPin', 'Incorrect PIN. Please try again.')
              : t('error.generic', 'Could not sign you in. Please try again.'),
          );
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
    [identifier, tenantSlug, tenant?.name, dispatch, router, t],
  );

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (submitting) return;
      // Employees often tap the PIN pad first. Instead of letting them enter a
      // full PIN and only then erroring, steer them to the identifier the
      // moment they start: focus the field + show the inline hint.
      if (!identifier.trim()) {
        setError(t('error.identifierRequired', 'Enter your phone number or email first.'));
        identifierInputRef.current?.focus();
        return;
      }
      if (pin.length >= 4) return;
      const newPin = pin + digit;
      setPin(newPin);
      setError(null);
      if (newPin.length === 4) {
        // Fire and forget — submitPin manages its own state.
        void submitPin(newPin);
      }
    },
    [pin, submitting, submitPin, identifier, t],
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
        <div className="flex items-baseline justify-between">
          <label className="label">{t('identifier', 'Phone number or email')}</label>
          {prefilled && identifier && (
            <button
              type="button"
              onClick={useDifferentAccount}
              disabled={submitting}
              className="text-xs text-primary dark:text-primary-light font-medium hover:underline underline-offset-2 disabled:opacity-50"
            >
              {t('useDifferentAccount', 'Use a different account')}
            </button>
          )}
        </div>
        <input
          ref={identifierInputRef}
          type="text"
          autoComplete="username"
          inputMode="email"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            setError(null);
            // The user is now typing their own identifier — it's no longer a
            // pre-fill, so hide the "different account" link.
            if (prefilled) setPrefilled(false);
          }}
          disabled={submitting}
          placeholder={t('identifierPlaceholder', 'Phone number, e.g. 9290031421')}
          className="input"
        />

        {/* Live account confirmation — tells an employee their account was
            found (and which store) BEFORE they enter a PIN, or that the
            number/email isn't recognised so they fix it early. */}
        {account.state === 'checking' && (
          <p className="hint mt-1.5 flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
            {t('checkingAccount', 'Checking…')}
          </p>
        )}
        {account.state === 'found' && (
          <p className="mt-1.5 text-xs text-primary dark:text-primary-light flex items-center gap-1.5" role="status">
            <span aria-hidden>✓</span>
            {account.firstName
              ? t('signingInToAs', 'Signing in to {{store}} as {{name}}', {
                  store: account.storeName,
                  name: account.firstName,
                })
              : t('signingInTo', 'Signing in to {{store}}', { store: account.storeName })}
          </p>
        )}
        {account.state === 'missing' && (
          <p className="mt-1.5 text-xs text-error flex items-center gap-1.5" role="alert">
            <span aria-hidden>!</span>
            {t('error.noAccountInline', "No account found for that number or email. Ask the owner to add you as an employee.")}
          </p>
        )}
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

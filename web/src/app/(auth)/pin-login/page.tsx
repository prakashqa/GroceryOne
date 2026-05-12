'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { selectTenant, setCredentials } from '@groceryone/store';
import {
  savePersistedTokens,
  saveLastIdentifier,
  loadLastIdentifier,
} from '@/lib/auth/authStorage';

/**
 * PIN login: POST /auth/login/pin with `{ identifier, pin }` and
 * X-Tenant-ID header. On success, persist tokens (tenant-namespaced) and
 * route to /dashboard. On failure, surface inline error and clear PIN.
 *
 * The identifier (email or phone) is remembered per tenant in
 * localStorage so the user only types it once per browser/tenant pair.
 */
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

  // Pre-fill identifier from a previous successful login on this device.
  useEffect(() => {
    if (!tenantSlug) return;
    const remembered = loadLastIdentifier(tenantSlug);
    if (remembered && !identifier) setIdentifier(remembered);
    // identifier is intentionally excluded from deps — we only prefill once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

  const submitPin = useCallback(
    async (fullPin: string) => {
      if (!tenantSlug) {
        setError(t('error.noTenant', 'No store selected. Please set up your store first.'));
        return;
      }
      if (!identifier.trim()) {
        setError(t('error.identifierRequired', 'Enter your email or phone first.'));
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
            'X-Tenant-ID': tenantSlug,
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
        savePersistedTokens(tenantSlug, {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tenantSlug,
        });
        saveLastIdentifier(tenantSlug, identifier.trim());

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
    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg p-8 animate-fade-in">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock size={24} className="text-primary dark:text-primary-light" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-center mb-6">
        {t('enterPin', 'Enter PIN')}
      </h2>

      {/* Identifier (email or phone) */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {t('identifier', 'Email or phone')}
        </label>
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
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* PIN dots */}
      <div className="flex justify-center gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < pin.length
                ? 'bg-primary border-primary dark:bg-primary-light dark:border-primary-light'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-error text-center text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
          if (key === '') return <div key="empty" />;
          if (key === 'del') {
            return (
              <button
                key="del"
                onClick={handleBackspace}
                disabled={submitting}
                className="h-14 rounded-xl text-lg font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
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
              className="h-14 rounded-xl text-xl font-medium bg-gray-50 dark:bg-gray-800 hover:bg-primary/10 dark:hover:bg-primary-light/10 transition-colors disabled:opacity-50"
            >
              {key}
            </button>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <a
          href="/tenant-setup"
          className="text-sm text-primary dark:text-primary-light hover:underline"
        >
          {t('setupNewStore', 'Setup New Store')}
        </a>
      </div>
    </div>
  );
}

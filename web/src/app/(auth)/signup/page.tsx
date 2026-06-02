'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setCredentials, setTenant } from '@groceryone/store';
import { useTranslation } from 'react-i18next';
import { UserPlus } from 'lucide-react';
import { savePersistedTokens, saveLastIdentifier } from '@/lib/auth/authStorage';
import { saveLastLogin } from '@/lib/auth/lastLogin';

interface FormData {
  businessName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  pin: string;
  confirmPin: string;
}

export default function SignupPage() {
  const [form, setForm] = useState<FormData>({
    businessName: '', firstName: '', lastName: '',
    email: '', phone: '', password: '', confirmPassword: '',
    pin: '', confirmPin: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation('auth');

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setApiError(null);
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (form.businessName.trim().length < 2) e.businessName = 'Min 2 characters';
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Invalid email';
    if (!/^\+?\d{10,15}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Invalid phone';
    if (form.password.length < 8) e.password = 'Min 8 characters';
    else if (!/[A-Z]/.test(form.password) || !/\d/.test(form.password)) e.password = 'Need 1 uppercase + 1 number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords don\'t match';
    if (!/^\d{4}$/.test(form.pin)) e.pin = 'Enter a 4-digit PIN';
    if (form.pin !== form.confirmPin) e.confirmPin = 'PINs don\'t match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Version': '1.0' },
        body: JSON.stringify({
          businessName: form.businessName.trim(),
          // Backend DTO field names — NOT firstName/lastName.
          ownerFirstName: form.firstName.trim(),
          ownerLastName: form.lastName.trim() || undefined,
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          // Optional on the backend — sending it here means PIN-login works
          // on the next launch without a separate "set PIN" step.
          pin: form.pin || undefined,
        }),
      });

      const json = await res.json();
      const data = json.data || json;

      if (!res.ok) {
        // Backend validation errors come as `message: string | string[]`
        // (Nest's default exception filter). Surface them instead of a
        // useless generic "Signup failed".
        const raw = json?.message ?? data?.message ?? data?.error?.message;
        const msg = Array.isArray(raw) ? raw.join('; ') : raw;
        setApiError(msg || 'Signup failed');
        return;
      }

      dispatch(setCredentials({
        user: data.user,
        tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken, expiresIn: 3600 },
        requiresPinSetup: true,
      }));

      const tenantSlug = data.tenantSlug || form.businessName.toLowerCase().replace(/\s+/g, '-');
      localStorage.setItem('@tenant_id', tenantSlug);

      // Persist tokens + last identifier so a hard reload keeps the user
      // signed in (matches the pin-login flow).
      savePersistedTokens(tenantSlug, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tenantSlug,
      });
      saveLastIdentifier(tenantSlug, form.email.trim().toLowerCase());
      // Global last-login hint — lets logout → re-launch auto-fill the email
      // and resolve the tenant without any user typing.
      saveLastLogin({ tenantSlug, identifier: form.email.trim().toLowerCase() });

      dispatch(setTenant({
        id: tenantSlug, slug: tenantSlug, name: form.businessName.trim(),
        status: 'active', subscriptionPlan: 'basic',
        branding: { primaryColor: '#2E7D32', secondaryColor: '#66BB6A', fontFamily: 'system' },
        defaultLanguage: 'en', supportedLanguages: ['en', 'te'],
        currency: 'INR', timezone: 'Asia/Kolkata',
        config: { features: {}, limits: {}, paymentGateways: [] },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } as any));

      router.push('/subscription-plan');
    } catch {
      setApiError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: keyof FormData) =>
    `input ${errors[field] ? 'input-error' : ''}`;

  return (
    <div className="card bg-white dark:bg-card-dark rounded-2xl shadow-card-lg p-7 sm:p-8 animate-fade-up">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
          <UserPlus size={22} className="text-primary dark:text-primary-light" strokeWidth={1.8} />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-gray-100 tracking-tight">
        {t('registerBusiness', 'Register Your Business')}
      </h2>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6">
        {t('registerBusinessHint', 'Create your shop in seconds. You can change everything later.')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Business Name *</label>
          <input value={form.businessName} onChange={(e) => updateField('businessName', e.target.value)} className={inputClass('businessName')} placeholder="My Grocery Store" disabled={loading} />
          {errors.businessName && <p className="error-text">{errors.businessName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First Name *</label>
            <input value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} className={inputClass('firstName')} disabled={loading} />
            {errors.firstName && <p className="error-text">{errors.firstName}</p>}
          </div>
          <div>
            <label className="label">Last Name</label>
            <input value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} className={inputClass('lastName')} disabled={loading} />
          </div>
        </div>

        <div>
          <label className="label">Email *</label>
          <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className={inputClass('email')} placeholder="owner@store.com" disabled={loading} />
          {errors.email && <p className="error-text">{errors.email}</p>}
        </div>

        <div>
          <label className="label">Phone *</label>
          <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className={inputClass('phone')} placeholder="+91 9876543210" disabled={loading} />
          {errors.phone && <p className="error-text">{errors.phone}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Password *</label>
            <input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} className={inputClass('password')} placeholder="Min 8 chars" disabled={loading} />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>
          <div>
            <label className="label">Confirm Password *</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} className={inputClass('confirmPassword')} disabled={loading} />
            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
          </div>
        </div>

        <div className="section-divider !my-4" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">4-digit PIN *</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={form.pin}
              onChange={(e) => updateField('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={`${inputClass('pin')} text-center tracking-[0.4em] font-mono`}
              placeholder="••••"
              disabled={loading}
            />
            {errors.pin && <p className="error-text">{errors.pin}</p>}
          </div>
          <div>
            <label className="label">Confirm PIN *</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={form.confirmPin}
              onChange={(e) => updateField('confirmPin', e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={`${inputClass('confirmPin')} text-center tracking-[0.4em] font-mono`}
              placeholder="••••"
              disabled={loading}
            />
            {errors.confirmPin && <p className="error-text">{errors.confirmPin}</p>}
          </div>
        </div>
        <p className="hint -mt-1">Used to log in on subsequent launches.</p>

        {apiError && (
          <p className="text-sm text-error bg-error/10 dark:bg-error/15 rounded-lg px-3 py-2.5 animate-fade-in">
            {apiError}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary btn-lg w-full mt-2">
          {loading ? 'Creating Account…' : 'Create Account'}
        </button>
      </form>

      <div className="section-divider mt-7 mb-4" />
      <div className="text-center">
        <a
          href="/tenant-setup"
          className="inline-flex items-center gap-1.5 text-sm text-primary dark:text-primary-light font-medium hover:underline underline-offset-4"
        >
          Already have an account? Sign in
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}

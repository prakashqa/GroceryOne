'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setTenant } from '@groceryone/store';
import { useTranslation } from 'react-i18next';
import { Store } from 'lucide-react';

export default function TenantSetupPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/auth/resolve-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Version': '1.0' },
        body: JSON.stringify({ identifier: trimmed }),
      });

      const json = await res.json();
      const data = json.data || json;

      if (!res.ok || !data.tenantSlug) {
        setError(data.error?.message || 'No store found for this email');
        return;
      }

      const tenantObj = {
        id: data.tenantSlug,
        slug: data.tenantSlug,
        name: data.tenantName || data.tenantSlug,
        status: 'active',
        subscriptionPlan: 'premium',
        branding: { primaryColor: '#2E7D32', secondaryColor: '#66BB6A', fontFamily: 'system' },
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'te'],
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        config: { features: {}, limits: {}, paymentGateways: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('@tenant_id', data.tenantSlug);
      localStorage.setItem('@tenant_data', JSON.stringify(tenantObj));
      dispatch(setTenant(tenantObj as any));

      router.push('/pin-login');
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-white dark:bg-card-dark rounded-2xl shadow-card-lg p-7 sm:p-8 animate-fade-up">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
          <Store size={22} className="text-primary dark:text-primary-light" strokeWidth={1.8} />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-gray-100 tracking-tight">
        {t('welcomeBack', 'Welcome Back')}
      </h2>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6">
        {t('enterEmailToFindStore', 'Enter your email to find your store')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            className={`input ${error ? 'input-error' : ''}`}
            placeholder="owner@store.com"
            disabled={loading}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading || !email.trim()} className="btn-primary btn-lg w-full mt-2">
          {loading ? 'Finding store…' : 'Find My Store'}
        </button>
      </form>

      <div className="section-divider mt-7 mb-4" />
      <div className="text-center">
        <a
          href="/signup"
          className="inline-flex items-center gap-1.5 text-sm text-primary dark:text-primary-light font-medium hover:underline underline-offset-4"
        >
          {t('registerNewBusiness', 'Register a new business')}
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}

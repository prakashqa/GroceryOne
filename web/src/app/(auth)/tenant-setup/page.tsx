'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setTenant } from '@groceryone/store';
import { useTranslation } from 'react-i18next';

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
    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg p-8">
      <h2 className="text-xl font-semibold text-center mb-2">
        {t('welcomeBack', 'Welcome Back')}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
        {t('enterEmailToFindStore', 'Enter your email to find your store')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="owner@store.com"
            disabled={loading}
          />
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Finding store...' : 'Find My Store'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <a href="/signup" className="text-sm text-primary dark:text-primary-light hover:underline">
          {t('registerNewBusiness', 'Register a new business')}
        </a>
      </div>
    </div>
  );
}

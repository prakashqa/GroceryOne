'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

const plan = {
  id: 'yearly',
  name: 'Yearly',
  price: '₹2,999',
  period: '/year',
  features: [
    'Unlimited items',
    'Multi-cart management',
    'Receipt printing',
    'Sales reports',
    'Inventory tracking',
    'Priority support',
  ],
};

export default function SubscriptionPlanPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  useTranslation('auth');

  const handleContinue = () => {
    setLoading(true);
    router.push('/pin-setup');
  };

  return (
    <div className="card bg-white dark:bg-card-dark rounded-2xl shadow-card-lg p-7 sm:p-8 animate-fade-up">
      <h2 className="text-xl font-semibold text-center tracking-tight text-gray-900 dark:text-gray-100">Your Plan</h2>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6">Yearly licence — renews every year</p>

      <div className="p-5 rounded-xl border border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/40">
        <div className="flex items-baseline gap-1 mb-3">
          <span className="font-semibold text-2xl text-gray-900 dark:text-gray-100">{plan.price}</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm">{plan.period}</span>
        </div>
        <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">{plan.name}</p>
        <ul className="space-y-1.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Check size={14} className="text-primary dark:text-primary-light flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <button onClick={handleContinue} disabled={loading} className="btn-primary btn-lg w-full mt-5">
        Continue
      </button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '₹499',
    period: '/month',
    features: ['Unlimited items', 'Multi-cart management', 'Receipt printing', 'Sales reports', 'Inventory tracking'],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '₹4,499',
    period: '/year',
    badge: 'Save 25%',
    features: ['Everything in Monthly', 'Priority support', 'Advanced analytics', 'Multi-user access', 'Custom branding'],
  },
];

export default function SubscriptionPlanPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation('auth');

  const handleSelectPlan = async (planId: string) => {
    setSelected(planId);
    setLoading(true);
    // TODO: Call createSubscription API
    setTimeout(() => {
      setLoading(false);
      router.push('/pin-setup');
    }, 500);
  };

  const handleSkip = () => {
    router.push('/pin-setup');
  };

  return (
    <div className="card bg-white dark:bg-card-dark rounded-2xl shadow-card-lg p-7 sm:p-8 animate-fade-up">
      <h2 className="text-xl font-semibold text-center tracking-tight text-gray-900 dark:text-gray-100">Choose Your Plan</h2>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6">Start with a 14-day free trial</p>

      <div className="space-y-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => handleSelectPlan(plan.id)}
            disabled={loading}
            className={`w-full text-left p-5 rounded-xl border transition-all duration-200 disabled:opacity-50 ${
              selected === plan.id
                ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/40'
                : 'border-line dark:border-line-dark hover:border-primary/50 hover:shadow-card-hover'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">{plan.price}</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">{plan.period}</span>
              </div>
              {plan.badge && <span className="badge-primary">{plan.badge}</span>}
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
          </button>
        ))}
      </div>

      <button
        onClick={handleSkip}
        disabled={loading}
        className="w-full mt-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors"
      >
        Skip — Start 14-day trial
      </button>
    </div>
  );
}

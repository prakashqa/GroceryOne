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
    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg p-8">
      <h2 className="text-xl font-semibold text-center mb-2">Choose Your Plan</h2>
      <p className="text-gray-500 text-center text-sm mb-6">Start with a 14-day free trial</p>

      <div className="space-y-4">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => handleSelectPlan(plan.id)}
            disabled={loading}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
              selected === plan.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
            } disabled:opacity-50`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-semibold text-lg">{plan.price}</span>
                <span className="text-gray-500 text-sm">{plan.period}</span>
              </div>
              {plan.badge && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {plan.badge}
                </span>
              )}
            </div>
            <p className="font-medium mb-2">{plan.name}</p>
            <ul className="space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check size={14} className="text-primary flex-shrink-0" />
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
        className="w-full mt-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        Skip - Start 14-day trial
      </button>
    </div>
  );
}

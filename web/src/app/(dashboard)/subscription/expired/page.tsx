'use client';

import { AlertTriangle } from 'lucide-react';

export default function SubscriptionExpiredPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-orange-600" />
        </div>
        <h1 className="text-xl font-bold mb-2">Subscription Expired</h1>
        <p className="text-gray-500 mb-6">
          Your subscription has expired. Please renew to continue using GroOne.
        </p>
        <button className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors">
          Renew Subscription
        </button>
        <a href="/pin-login" className="block mt-4 text-sm text-gray-500 hover:text-gray-700">
          Sign in with a different account
        </a>
      </div>
    </div>
  );
}

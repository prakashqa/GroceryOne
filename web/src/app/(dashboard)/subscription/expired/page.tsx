'use client';

import { AlertTriangle } from 'lucide-react';

export default function SubscriptionExpiredPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card bg-white dark:bg-card-dark rounded-2xl shadow-card-lg p-8 max-w-md text-center animate-fade-up">
        <div className="w-16 h-16 bg-warning-bg dark:bg-warning/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={30} className="text-warning" strokeWidth={1.8} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-2">Subscription Expired</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Your subscription has expired. Please renew to continue using GroOne.
        </p>
        <button className="btn-primary btn-lg w-full">
          Renew Subscription
        </button>
        <a href="/pin-login" className="block mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors">
          Sign in with a different account
        </a>
      </div>
    </div>
  );
}

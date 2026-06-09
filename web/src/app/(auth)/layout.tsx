'use client';

import '@/lib/i18n/config';
import { AuthHydration } from '@/components/common/AuthHydration';
import { Wordmark } from '@/components/common/Wordmark';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthHydration>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] right-[-5%] w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl" />

        <div className="w-full max-w-md relative z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <Wordmark size="lg" className="mb-2" />
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Smart Store Management
            </p>
          </div>
          {children}
        </div>
      </div>
    </AuthHydration>
  );
}

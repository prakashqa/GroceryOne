'use client';

import '@/lib/i18n/config';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <span className="text-3xl font-bold text-primary dark:text-primary-light">G</span>
          </div>
          <h1 className="text-3xl font-bold text-primary dark:text-primary-light">
            GroOne
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Smart Store Management
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

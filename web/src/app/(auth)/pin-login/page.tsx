'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';

export default function PinLoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useTranslation('auth');

  const handleDigitPress = useCallback((digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(null);

      if (newPin.length === 4) {
        // TODO: Verify PIN via API
        // For now, navigate to dashboard
        router.push('/dashboard');
      }
    }
  }, [pin, router]);

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  }, []);

  return (
    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg p-8 animate-fade-in">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock size={24} className="text-primary dark:text-primary-light" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-center mb-6">
        {t('enterPin', 'Enter PIN')}
      </h2>

      {/* PIN dots */}
      <div className="flex justify-center gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < pin.length
                ? 'bg-primary border-primary dark:bg-primary-light dark:border-primary-light'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-error text-center text-sm mb-4">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(
          (key) => {
            if (key === '') return <div key="empty" />;
            if (key === 'del') {
              return (
                <button
                  key="del"
                  onClick={handleBackspace}
                  className="h-14 rounded-xl text-lg font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                >
                  &#x232B;
                </button>
              );
            }
            return (
              <button
                key={key}
                onClick={() => handleDigitPress(key)}
                className="h-14 rounded-xl text-xl font-medium bg-gray-50 dark:bg-gray-800 hover:bg-primary/10 dark:hover:bg-primary-light/10 transition-colors"
              >
                {key}
              </button>
            );
          }
        )}
      </div>

      <div className="mt-6 text-center">
        <a
          href="/tenant-setup"
          className="text-sm text-primary dark:text-primary-light hover:underline"
        >
          {t('setupNewStore', 'Setup New Store')}
        </a>
      </div>
    </div>
  );
}

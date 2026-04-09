'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function PinSetupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const currentPin = step === 1 ? pin : confirmPin;
  const setCurrentPin = step === 1 ? setPin : setConfirmPin;

  const handleDigitPress = useCallback((digit: string) => {
    if (currentPin.length < 4) {
      const newPin = currentPin + digit;
      setCurrentPin(newPin);
      setError(null);

      if (newPin.length === 4) {
        if (step === 1) {
          setTimeout(() => setStep(2), 200);
        } else {
          if (newPin === pin) {
            // PIN confirmed - store hash in localStorage
            const pinHash = btoa(newPin); // Simple encoding for demo; use Web Crypto in prod
            const tenantSlug = localStorage.getItem('@tenant_id') || 'default';
            localStorage.setItem(`@pin_hash_${tenantSlug}`, pinHash);
            router.push('/pin-login');
          } else {
            setError('PINs do not match. Try again.');
            setConfirmPin('');
          }
        }
      }
    }
  }, [currentPin, setCurrentPin, step, pin, router]);

  const handleBackspace = useCallback(() => {
    setCurrentPin((prev) => prev.slice(0, -1));
    setError(null);
  }, [setCurrentPin]);

  return (
    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg p-8">
      <h2 className="text-xl font-semibold text-center mb-1">
        {step === 1 ? 'Set Your PIN' : 'Confirm Your PIN'}
      </h2>
      <p className="text-gray-500 text-center text-sm mb-6">
        Step {step} / 2
      </p>

      <div className="flex justify-center gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < currentPin.length
                ? 'bg-primary border-primary dark:bg-primary-light dark:border-primary-light'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-error text-center text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {['1','2','3','4','5','6','7','8','9','','0','del'].map((key) => {
          if (key === '') return <div key="empty" />;
          if (key === 'del') {
            return (
              <button key="del" onClick={handleBackspace}
                className="h-14 rounded-xl text-lg font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">
                &#x232B;
              </button>
            );
          }
          return (
            <button key={key} onClick={() => handleDigitPress(key)}
              className="h-14 rounded-xl text-xl font-medium bg-gray-50 dark:bg-gray-800 hover:bg-primary/10 dark:hover:bg-primary-light/10 transition-colors">
              {key}
            </button>
          );
        })}
      </div>

      {step === 2 && (
        <button onClick={() => { setStep(1); setPin(''); setConfirmPin(''); setError(null); }}
          className="w-full mt-6 text-sm text-gray-500 hover:text-gray-700">
          Start over
        </button>
      )}
    </div>
  );
}

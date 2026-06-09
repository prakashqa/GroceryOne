'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';

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
    <div className="card bg-white dark:bg-card-dark rounded-2xl shadow-card-lg p-7 sm:p-8 animate-fade-up">
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
          <KeyRound size={22} className="text-primary dark:text-primary-light" strokeWidth={1.8} />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-gray-100 tracking-tight">
        {step === 1 ? 'Set Your PIN' : 'Confirm Your PIN'}
      </h2>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1 mb-6">
        Step {step} of 2
      </p>

      <div className="flex justify-center gap-3.5 mb-7" role="status" aria-label={`${currentPin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
              i < currentPin.length
                ? 'bg-primary dark:bg-primary-light scale-110 shadow-[0_0_0_4px_rgba(46,125,50,0.12)]'
                : 'bg-transparent border-2 border-gray-300 dark:border-gray-600'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-error text-center text-sm mb-4 animate-fade-in" role="alert">{error}</p>}

      <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
        {['1','2','3','4','5','6','7','8','9','','0','del'].map((key) => {
          if (key === '') return <div key="empty" />;
          if (key === 'del') {
            return (
              <button key="del" onClick={handleBackspace} aria-label="Delete"
                className="h-14 rounded-xl text-lg font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] active:scale-95 transition-all duration-150 flex items-center justify-center text-gray-600 dark:text-gray-300">
                &#x232B;
              </button>
            );
          }
          return (
            <button key={key} onClick={() => handleDigitPress(key)}
              className="h-14 rounded-xl text-xl font-semibold bg-gray-50 hover:bg-primary/10 hover:text-primary dark:bg-white/[0.03] dark:hover:bg-primary/15 dark:hover:text-primary-light active:scale-95 transition-all duration-150 text-gray-700 dark:text-gray-200">
              {key}
            </button>
          );
        })}
      </div>

      {step === 2 && (
        <button onClick={() => { setStep(1); setPin(''); setConfirmPin(''); setError(null); }}
          className="w-full mt-6 text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors">
          Start over
        </button>
      )}
    </div>
  );
}

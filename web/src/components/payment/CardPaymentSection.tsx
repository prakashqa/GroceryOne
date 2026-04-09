'use client';

import { useTranslation } from 'react-i18next';

interface CardPaymentSectionProps {
  lastFourDigits: string;
  onLastFourDigitsChange: (value: string) => void;
}

export function CardPaymentSection({ lastFourDigits, onLastFourDigitsChange }: CardPaymentSectionProps) {
  const { t } = useTranslation('common');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filtered = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    onLastFourDigitsChange(filtered);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{t('payment.lastFourDigits')}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono tracking-widest">****</span>
        <input
          type="text"
          inputMode="numeric"
          value={lastFourDigits}
          onChange={handleChange}
          placeholder="1234"
          maxLength={4}
          className="w-full pl-16 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{t('payment.lastFourHelper')}</p>
    </div>
  );
}

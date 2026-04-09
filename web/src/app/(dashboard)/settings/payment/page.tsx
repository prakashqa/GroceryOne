'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { selectPaymentSettings, setMerchantUpiId, setMerchantName } from '@groceryone/store';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function PaymentSettingsPage() {
  const dispatch = useAppDispatch();
  const payment = useAppSelector(selectPaymentSettings);
  const { t } = useTranslation('profile');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold">{t('settings.payment.title')}</h1>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('settings.payment.merchantName')}</label>
          <input value={payment.merchantName} onChange={(e) => dispatch(setMerchantName(e.target.value))} placeholder={t('settings.payment.merchantNamePlaceholder')}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('settings.payment.merchantUpiId')}</label>
          <input value={payment.merchantUpiId} onChange={(e) => dispatch(setMerchantUpiId(e.target.value))} placeholder={t('settings.payment.upiIdPlaceholder')}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <p className="text-xs text-gray-400 mt-1">{t('settings.payment.upiIdHelper')}</p>
        </div>
      </div>
    </div>
  );
}

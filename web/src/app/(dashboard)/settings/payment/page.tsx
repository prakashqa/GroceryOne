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
    <div className="page page-container">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="btn-icon" aria-label="Back"><ArrowLeft size={18} /></Link>
        <h1 className="page-title">{t('settings.payment.title')}</h1>
      </div>
      <div className="card p-5 space-y-4">
        <div>
          <label className="label">{t('settings.payment.merchantName')}</label>
          <input value={payment.merchantName} onChange={(e) => dispatch(setMerchantName(e.target.value))} placeholder={t('settings.payment.merchantNamePlaceholder')} className="input" />
        </div>
        <div>
          <label className="label">{t('settings.payment.merchantUpiId')}</label>
          <input value={payment.merchantUpiId} onChange={(e) => dispatch(setMerchantUpiId(e.target.value))} placeholder={t('settings.payment.upiIdPlaceholder')} className="input" />
          <p className="hint">{t('settings.payment.upiIdHelper')}</p>
        </div>
      </div>
    </div>
  );
}

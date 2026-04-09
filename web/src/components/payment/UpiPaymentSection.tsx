'use client';

import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { DomainTypes } from '@groceryone/store';
import { AlertTriangle } from 'lucide-react';

interface UpiPaymentSectionProps {
  grandTotal: number;
  merchantUpiId: string;
  merchantName: string;
  transactionRef: string;
  onTransactionRefChange: (value: string) => void;
}

export function UpiPaymentSection({
  grandTotal, merchantUpiId, merchantName, transactionRef, onTransactionRefChange,
}: UpiPaymentSectionProps) {
  const { t } = useTranslation('common');

  if (!merchantUpiId) {
    return (
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5 text-center">
        <AlertTriangle size={32} className="mx-auto text-orange-500 mb-2" />
        <p className="font-medium text-orange-700 dark:text-orange-400 mb-1">{t('payment.upiNotConfigured')}</p>
        <p className="text-sm text-orange-600 dark:text-orange-400/80">
          {t('payment.upiNotConfiguredDesc')}
        </p>
      </div>
    );
  }

  const upiLink = DomainTypes.generateUpiDeepLink(merchantUpiId, merchantName || 'GroOne Store', grandTotal);

  return (
    <div className="space-y-4">
      {/* QR Code */}
      <div className="flex flex-col items-center">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <QRCodeSVG value={upiLink} size={180} level="M" />
        </div>
        <p className="text-sm text-gray-500 mt-2">{t('payment.scanToPay')}</p>
        <p className="text-sm font-medium text-primary mt-1">{merchantUpiId}</p>
      </div>

      {/* Transaction Reference */}
      <div>
        <label className="block text-sm font-medium mb-1.5">{t('payment.transactionRef')}</label>
        <input
          type="text"
          value={transactionRef}
          onChange={(e) => onTransactionRefChange(e.target.value)}
          placeholder={t('payment.transactionRefPlaceholder')}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-xs text-gray-400 mt-1">Optional — enter after customer completes payment</p>
      </div>
    </div>
  );
}

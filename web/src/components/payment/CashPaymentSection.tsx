'use client';

import { useTranslation } from 'react-i18next';

interface CashPaymentSectionProps {
  grandTotal: number;
  receivedAmount: string;
  onReceivedAmountChange: (value: string) => void;
}

export function CashPaymentSection({ grandTotal, receivedAmount, onReceivedAmountChange }: CashPaymentSectionProps) {
  const { t } = useTranslation('common');
  const receivedNum = parseFloat(receivedAmount) || 0;
  const change = receivedNum - grandTotal;
  const hasChange = receivedNum > 0 && change >= 0;
  const isInsufficient = receivedNum > 0 && change < 0;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1.5">{t('payment.receivedAmount')}</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
          <input
            type="number"
            inputMode="decimal"
            value={receivedAmount}
            onChange={(e) => onReceivedAmountChange(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{t('payment.receivedAmountHelper')}</p>
      </div>

      {hasChange && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700 dark:text-green-400">{t('payment.changeToReturn', { amount: change.toFixed(2) })}</span>
          </div>
        </div>
      )}

      {isInsufficient && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <p className="text-sm text-red-600 dark:text-red-400">
            {t('payment.insufficientAmount')} (short ₹{Math.abs(change).toFixed(2)})
          </p>
        </div>
      )}
    </div>
  );
}

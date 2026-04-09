'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectMerchantUpiId, selectMerchantName, DomainTypes } from '@groceryone/store';
import { CashPaymentSection } from './CashPaymentSection';
import { UpiPaymentSection } from './UpiPaymentSection';
import { CardPaymentSection } from './CardPaymentSection';
import { CheckCircle2 } from 'lucide-react';

type PaymentMethod = 'cash' | 'upi' | 'card';

interface PaymentInlineProps {
  grandTotal: number;
  onConfirm: (paymentInfo: DomainTypes.PaymentInfo) => void;
  onCancel?: () => void;
}

export function PaymentInline({ grandTotal, onConfirm, onCancel }: PaymentInlineProps) {
  const { t } = useTranslation('common');
  const merchantUpiId = useAppSelector(selectMerchantUpiId);
  const merchantName = useAppSelector(selectMerchantName);

  const tabs: { value: PaymentMethod; icon: string; label: string }[] = [
    { value: 'cash', icon: '💵', label: t('payment.cash') },
    { value: 'upi', icon: '📱', label: t('payment.upi') },
    { value: 'card', icon: '💳', label: t('payment.card') },
  ];

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [showSuccess, setShowSuccess] = useState(false);

  const [receivedAmount, setReceivedAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);

  const isUpiDisabled = selectedMethod === 'upi' && !merchantUpiId;

  const handleConfirm = useCallback(() => {
    let paymentInfo: DomainTypes.PaymentInfo;

    switch (selectedMethod) {
      case 'cash': {
        const received = parseFloat(receivedAmount) || 0;
        const change = received > 0 ? Math.max(0, received - grandTotal) : 0;
        paymentInfo = DomainTypes.createCashPaymentInfo(
          received > 0 ? received : undefined,
          change > 0 ? change : undefined
        );
        if (received > 0 && change > 0) {
          setChangeAmount(change);
        }
        break;
      }
      case 'upi':
        paymentInfo = DomainTypes.createUpiPaymentInfo(merchantUpiId || undefined, transactionRef || undefined);
        break;
      case 'card':
        paymentInfo = DomainTypes.createCardPaymentInfo(lastFourDigits || undefined);
        break;
      default:
        return;
    }

    onConfirm(paymentInfo);
    setShowSuccess(true);
  }, [selectedMethod, receivedAmount, grandTotal, merchantUpiId, transactionRef, lastFourDigits, onConfirm]);

  // Success banner
  if (showSuccess) {
    const received = parseFloat(receivedAmount) || 0;
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 size={24} className="text-green-600" />
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">{t('payment.paymentSuccessful')}</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">{t('reports.total')}</p>
            <p className="font-semibold">₹{grandTotal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">{t('payment.selectMethod')}</p>
            <p className="font-semibold capitalize">{selectedMethod}</p>
          </div>
          {selectedMethod === 'cash' && received > 0 && changeAmount > 0 && (
            <div>
              <p className="text-gray-500 mb-1">{t('payment.change')}</p>
              <p className="font-bold text-green-700 dark:text-green-400 text-lg">₹{changeAmount.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('picking.payment')}</h3>
        <p className="text-xl font-bold text-primary">₹{grandTotal.toFixed(2)}</p>
      </div>

      {/* Horizontal Tab Bar */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedMethod(tab.value)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors relative ${
              selectedMethod === tab.value
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {selectedMethod === tab.value && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Method-specific content */}
      <div className="p-6">
        {selectedMethod === 'cash' && (
          <CashPaymentSection grandTotal={grandTotal} receivedAmount={receivedAmount} onReceivedAmountChange={setReceivedAmount} />
        )}
        {selectedMethod === 'upi' && (
          <UpiPaymentSection grandTotal={grandTotal} merchantUpiId={merchantUpiId} merchantName={merchantName} transactionRef={transactionRef} onTransactionRefChange={setTransactionRef} />
        )}
        {selectedMethod === 'card' && (
          <CardPaymentSection lastFourDigits={lastFourDigits} onLastFourDigitsChange={setLastFourDigits} />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
        {onCancel && (
          <button onClick={onCancel} className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-white dark:hover:bg-gray-800 transition-colors">
            {t('cancel')}
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={isUpiDisabled}
          className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('payment.confirmPayment')} &middot; ₹{grandTotal.toFixed(0)}
        </button>
      </div>
    </div>
  );
}

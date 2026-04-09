'use client';

import { useState, useCallback } from 'react';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectMerchantUpiId, selectMerchantName, DomainTypes } from '@groceryone/store';
import { CashPaymentSection } from './CashPaymentSection';
import { UpiPaymentSection } from './UpiPaymentSection';
import { CardPaymentSection } from './CardPaymentSection';
import { CheckCircle2, X } from 'lucide-react';

type PaymentMethod = 'cash' | 'upi' | 'card';
type Phase = 'input' | 'success';

interface PaymentModalProps {
  grandTotal: number;
  onConfirm: (paymentInfo: DomainTypes.PaymentInfo) => void;
  onClose: () => void;
}

const methods: { value: PaymentMethod; icon: string; label: string; desc: string }[] = [
  { value: 'cash', icon: '💵', label: 'Cash', desc: 'Pay with cash' },
  { value: 'upi', icon: '📱', label: 'UPI', desc: 'Scan QR code to pay' },
  { value: 'card', icon: '💳', label: 'Card', desc: 'Debit or credit card' },
];

export function PaymentModal({ grandTotal, onConfirm, onClose }: PaymentModalProps) {
  const merchantUpiId = useAppSelector(selectMerchantUpiId);
  const merchantName = useAppSelector(selectMerchantName);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [phase, setPhase] = useState<Phase>('input');

  // Cash state
  const [receivedAmount, setReceivedAmount] = useState('');

  // UPI state
  const [transactionRef, setTransactionRef] = useState('');

  // Card state
  const [lastFourDigits, setLastFourDigits] = useState('');

  // Change calculation for success screen
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
          setPhase('success');
          // Don't call onConfirm yet — wait for "Done" on success screen
          // But we still need to dispatch the payment
          onConfirm(paymentInfo);
          return;
        }
        break;
      }
      case 'upi':
        paymentInfo = DomainTypes.createUpiPaymentInfo(
          merchantUpiId || undefined,
          transactionRef || undefined
        );
        break;
      case 'card':
        paymentInfo = DomainTypes.createCardPaymentInfo(
          lastFourDigits || undefined
        );
        break;
      default:
        return;
    }

    onConfirm(paymentInfo);
  }, [selectedMethod, receivedAmount, grandTotal, merchantUpiId, transactionRef, lastFourDigits, onConfirm]);

  // Success screen (cash with change)
  if (phase === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 w-full max-w-md mx-4 shadow-xl text-center animate-slide-up">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold mb-6">Payment Received</h3>

          <div className="space-y-3 text-left mb-6">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-semibold">₹{grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">Received</span>
              <span className="font-semibold">₹{(parseFloat(receivedAmount) || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 bg-green-50 dark:bg-green-900/20 rounded-xl px-4">
              <span className="font-medium text-green-700 dark:text-green-400">Return Change</span>
              <span className="text-xl font-bold text-green-700 dark:text-green-400">₹{changeAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Input screen
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold">Payment</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Amount */}
        <div className="mx-5 mt-5 p-4 bg-primary/10 rounded-xl text-center">
          <p className="text-sm text-primary font-medium">Total Amount</p>
          <p className="text-3xl font-bold text-primary mt-1">₹{grandTotal.toFixed(2)}</p>
        </div>

        {/* Method Selector */}
        <div className="p-5 space-y-2">
          <p className="text-sm font-medium mb-2">Payment Method</p>
          {methods.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMethod(m.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                selectedMethod === m.value
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{m.icon}</span>
              <div>
                <p className="font-medium text-sm">{m.label}</p>
                <p className="text-xs text-gray-500">{m.desc}</p>
              </div>
              {selectedMethod === m.value && (
                <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Method-specific section */}
        <div className="px-5 pb-5">
          {selectedMethod === 'cash' && (
            <CashPaymentSection
              grandTotal={grandTotal}
              receivedAmount={receivedAmount}
              onReceivedAmountChange={setReceivedAmount}
            />
          )}
          {selectedMethod === 'upi' && (
            <UpiPaymentSection
              grandTotal={grandTotal}
              merchantUpiId={merchantUpiId}
              merchantName={merchantName}
              transactionRef={transactionRef}
              onTransactionRefChange={setTransactionRef}
            />
          )}
          {selectedMethod === 'card' && (
            <CardPaymentSection
              lastFourDigits={lastFourDigits}
              onLastFourDigitsChange={setLastFourDigits}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isUpiDisabled}
            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}

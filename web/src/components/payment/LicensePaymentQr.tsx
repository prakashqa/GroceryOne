'use client';

import { QRCodeSVG } from 'qrcode.react';
import { DomainTypes } from '@groceryone/store';
import { AlertTriangle, QrCode } from 'lucide-react';

interface LicensePaymentQrProps {
  /** GroOne's collection VPA (e.g. groone@hdfcbank). Empty → shows a config hint. */
  upiId?: string;
  /** Payee display name shown in the customer's UPI app. */
  payeeName?: string;
  /** Amount in INR (the desktop_yearly plan price). */
  amount: number;
  /** Optional UPI note (e.g. tenant slug) for reconciliation. */
  note?: string;
}

/**
 * Static UPI QR for the desktop-license purchase. The customer scans it with
 * PhonePe / Google Pay / Paytm / any UPI app and pays the fixed plan price.
 *
 * NOTE: a static QR only pre-fills payee + amount — it does NOT confirm
 * payment. Staff must still verify the money landed in GroOne's account before
 * minting (paste the UPI transaction id into "Payment reference"). True
 * auto-verification would require a payment gateway + webhook.
 */
export function LicensePaymentQr({ upiId, payeeName = 'GroOne', amount, note }: LicensePaymentQrProps) {
  if (!upiId) {
    return (
      <div className="card p-4 mb-4 flex items-start gap-3 border-warning/40 bg-warning-bg dark:bg-warning/10">
        <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
        <div className="text-sm text-warning">
          <p className="font-medium">UPI collection ID not configured</p>
          <p className="opacity-90">
            Set <code className="font-mono">NEXT_PUBLIC_GROONE_LICENSE_UPI_ID</code> to show a payment QR here.
          </p>
        </div>
      </div>
    );
  }

  const link = DomainTypes.generateUpiDeepLink(upiId, payeeName, amount, note);

  return (
    <div className="card p-5 mb-4 flex flex-col sm:flex-row items-center gap-5">
      <div data-testid="license-upi-qr" className="bg-white p-3 rounded-xl border border-line shrink-0">
        <QRCodeSVG value={link} size={148} level="M" />
      </div>
      <div className="text-sm min-w-0">
        <p className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-100 mb-1">
          <QrCode size={16} className="text-primary dark:text-primary-light" />
          Pay ₹{amount.toLocaleString('en-IN')} by UPI
        </p>
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          Ask the customer to scan with PhonePe, Google Pay, Paytm or any UPI app.
        </p>
        <p className="text-primary dark:text-primary-light font-mono break-all">{upiId}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          After payment clears, paste the UPI transaction ID into “Payment reference”, then Generate license key.
        </p>
      </div>
    </div>
  );
}

export default LicensePaymentQr;

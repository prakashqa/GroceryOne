'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, KeyRound, Copy, Check } from 'lucide-react';
import { getDesktopBridge, friendlyLicenseError } from '@/lib/desktopLicense';
import { SUPPORT_WHATSAPP_NUMBER } from '@/components/common/WhatsappSupport';

export default function SubscriptionExpiredPage() {
  const router = useRouter();
  const bridge = getDesktopBridge();
  const [machine, setMachine] = useState<{ full: string; short: string } | null>(null);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!bridge) return;
    bridge.machineId().then(setMachine).catch(() => {});
  }, [bridge]);

  // Cloud build → keep the simple placeholder.
  if (!bridge) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card bg-white dark:bg-card-dark rounded-2xl shadow-card-lg p-8 max-w-md text-center animate-fade-up">
          <div className="w-16 h-16 bg-warning-bg dark:bg-warning/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={30} className="text-warning" strokeWidth={1.8} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-2">Subscription Expired</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your subscription has expired. Please renew to continue using GroOne.</p>
          <button className="btn-primary btn-lg w-full">Renew Subscription</button>
        </div>
      </div>
    );
  }

  const copyMachine = async () => {
    if (!machine) return;
    try { await navigator.clipboard.writeText(machine.full); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  const handleRenew = async () => {
    setError(null);
    if (!key.trim()) { setError('Enter your renewal license key.'); return; }
    setBusy(true);
    try {
      const r = await bridge.license.activate(key.trim());
      if (r.ok) { router.replace('/pin-login'); return; }
      setError(friendlyLicenseError(r.code));
    } finally {
      setBusy(false);
    }
  };

  const importLic = async () => {
    const text = await bridge.license.importFile();
    if (text) setKey(text.trim());
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card bg-white dark:bg-card-dark rounded-2xl shadow-card-lg p-8 max-w-md w-full animate-fade-up">
        <div className="w-14 h-14 bg-warning-bg dark:bg-warning/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={26} className="text-warning" strokeWidth={1.8} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-center text-gray-900 dark:text-gray-100 mb-1">License renewal needed</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
          Send your Machine ID to GroOne support on WhatsApp <span className="font-semibold">{SUPPORT_WHATSAPP_NUMBER}</span> to get a renewal key, then paste it below.
        </p>

        <div className="mb-4">
          <label className="label">Your Machine ID</label>
          <div className="flex items-center gap-2">
            <code className="input font-mono text-sm flex-1 select-all">{machine?.short || '…'}</code>
            <button onClick={copyMachine} className="btn-secondary btn-sm" type="button" aria-label="Copy Machine ID">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="label" htmlFor="renewal-key">Renewal license key</label>
          <textarea
            id="renewal-key"
            data-testid="renewal-license-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            rows={3}
            className="input font-mono text-xs break-all"
            placeholder="Paste the license key from GroOne support"
          />
          <button onClick={importLic} type="button" className="hint hover:text-primary mt-1">…or import a .lic file</button>
        </div>

        {error && <p className="error-text mb-3" role="alert">{error}</p>}

        <button onClick={handleRenew} disabled={busy} className="btn-primary btn-lg w-full">
          <KeyRound size={16} /> {busy ? 'Activating…' : 'Renew license'}
        </button>
      </div>
    </div>
  );
}

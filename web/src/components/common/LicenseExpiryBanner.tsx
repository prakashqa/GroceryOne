'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { licenseWarning, type DesktopLicenseInfo } from '@/lib/licenseExpiry';
import { SUPPORT_WHATSAPP_NUMBER } from '@/components/common/WhatsappSupport';

interface GrooneBridge {
  license?: { info?: () => Promise<DesktopLicenseInfo | null> };
}

/**
 * In-app renewal reminder for the desktop app. Reads the stored license's
 * expiry from the Electron bridge and shows a banner when it's within ~14 days
 * of expiry (or expired). Renders nothing on the cloud web app (no bridge).
 */
export function LicenseExpiryBanner() {
  const [state, setState] = useState<{ days: number; expired: boolean } | null>(null);

  useEffect(() => {
    const bridge = (typeof window !== 'undefined' ? (window as unknown as { groone?: GrooneBridge }).groone : undefined);
    const info = bridge?.license?.info;
    if (!info) return; // cloud build / not desktop
    let active = true;
    info()
      .then((lic) => {
        if (!active || !lic?.expiresAt) return;
        const w = licenseWarning(lic.expiresAt, Date.now());
        if (w.show) setState({ days: w.days, expired: w.expired });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!state) return null;

  const tone = state.expired
    ? 'border-error/40 bg-error-bg text-error dark:bg-error/10'
    : 'border-warning/40 bg-warning-bg text-warning dark:bg-warning/10';

  return (
    <div role="status" className={`mb-4 flex items-start gap-2 rounded-xl border px-4 py-2.5 text-sm ${tone}`}>
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <span>
        {state.expired
          ? 'Your GroOne license has expired.'
          : `Your GroOne license expires in ${state.days} day${state.days === 1 ? '' : 's'}.`}{' '}
        To renew, contact GroOne support on WhatsApp <span className="font-semibold">{SUPPORT_WHATSAPP_NUMBER}</span>.
      </span>
    </div>
  );
}

export default LicenseExpiryBanner;

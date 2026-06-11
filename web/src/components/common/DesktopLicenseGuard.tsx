'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { licenseGuardAction, type DesktopLicenseStatus } from '@/lib/licenseExpiry';

interface GrooneBridge {
  license?: { status?: () => Promise<DesktopLicenseStatus> };
}

/**
 * Desktop-only runtime license guard. On the desktop build it asks the Electron
 * shell to re-verify the stored license against THIS machine + expiry; if it's
 * missing/expired/wrong-machine it routes to the renewal screen. On the cloud
 * web app there is no bridge, so it renders children unchanged.
 */
export function DesktopLicenseGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const bridge = typeof window !== 'undefined' ? (window as unknown as { groone?: GrooneBridge }).groone : undefined;
    const status = bridge?.license?.status;
    if (!status) return; // cloud build → no enforcement here
    let active = true;
    status()
      .then((s) => {
        if (!active) return;
        if (licenseGuardAction(s) === 'block' && pathname !== '/subscription/expired') {
          const reason = s.state === 'invalid' ? s.code || 'invalid' : s.state;
          router.replace(`/subscription/expired?reason=${reason}`);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [router, pathname]);

  return <>{children}</>;
}

export default DesktopLicenseGuard;

/**
 * Typed accessor + helpers for the Electron license bridge (`window.groone`).
 * Present only in the desktop build; undefined on the cloud web app.
 */

import type { DesktopLicenseStatus } from '@/lib/licenseExpiry';

export type ActivateResult =
  | { ok: true; customer: string; expiresAt: string }
  | { ok: false; code: string; message: string };

export interface DesktopBridge {
  machineId(): Promise<{ full: string; short: string }>;
  license: {
    activate(key: string): Promise<ActivateResult>;
    status(): Promise<DesktopLicenseStatus>;
    info(): Promise<{ customer: string; plan: string; expiresAt: string } | null>;
    importFile(): Promise<string | null>;
  };
}

export function getDesktopBridge(): DesktopBridge | undefined {
  if (typeof window === 'undefined') return undefined;
  const g = (window as unknown as { groone?: DesktopBridge }).groone;
  return g && g.license && typeof g.machineId === 'function' ? g : undefined;
}

/** Map an activation error code to a customer-friendly message. */
export function friendlyLicenseError(code?: string): string {
  switch (code) {
    case 'WRONG_MACHINE':
      return 'This key is for a different computer. Send your Machine ID to GroOne support 9010888871 for a key for this PC.';
    case 'EXPIRED':
      return 'This license key has expired. Request a renewal key from GroOne support 9010888871.';
    case 'BAD_SIGNATURE':
      return 'This license key is not valid (signature check failed).';
    case 'MALFORMED':
      return "That doesn't look like a valid license key — check you copied all of it.";
    default:
      return 'Activation failed. Please try again or contact GroOne support 9010888871.';
  }
}

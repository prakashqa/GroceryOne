/**
 * Renderer preload — exposes a narrow `window.groone` API to the
 * license-gate page. Context isolation is on, so the renderer can't
 * reach Node directly.
 */

import { contextBridge, ipcRenderer } from 'electron';

type ActivateResult =
  | { ok: true; customer: string; expiresAt: string }
  | { ok: false; code: string; message: string };

type LicenseStatus =
  | { state: 'valid'; customer: string; expiresAt: string }
  | { state: 'missing' }
  | { state: 'invalid'; code: string };

contextBridge.exposeInMainWorld('groone', {
  /** This machine's id { full, short } for the signup / renewal Machine-ID display. */
  machineId: (): Promise<{ full: string; short: string }> =>
    ipcRenderer.invoke('groone:machineId'),
  license: {
    /** Verify a pasted machine-bound key OFFLINE and persist it. */
    activate: (key: string): Promise<ActivateResult> =>
      ipcRenderer.invoke('groone:license:activate', key),
    /** Re-verify the stored license against this machine + expiry (guard). */
    status: (): Promise<LicenseStatus> =>
      ipcRenderer.invoke('groone:license:status'),
    /** Current stored license info (for the in-app expiry banner). */
    info: (): Promise<{ customer: string; plan: string; expiresAt: string } | null> =>
      ipcRenderer.invoke('groone:license:info'),
    /** Open a file picker for a .lic file; resolves to its text (or null). */
    importFile: (): Promise<string | null> =>
      ipcRenderer.invoke('groone:license:importFile'),
  },
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('groone:app:openExternal', url),
});

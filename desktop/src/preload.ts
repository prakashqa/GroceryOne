/**
 * Renderer preload — exposes a narrow `window.groone` API to the
 * license-gate page. Context isolation is on, so the renderer can't
 * reach Node directly.
 */

import { contextBridge, ipcRenderer } from 'electron';

type SubmitResult =
  | { ok: true; customer: string; expiresAt: string }
  | { ok: false; code: string; message: string };

contextBridge.exposeInMainWorld('groone', {
  license: {
    /** Verify + store a pasted license token, then boot the app. */
    submit: (token: string): Promise<SubmitResult> =>
      ipcRenderer.invoke('groone:license:submit', token),
    /** Open a file picker for a .lic file; resolves to its text (or null). */
    importFile: (): Promise<string | null> =>
      ipcRenderer.invoke('groone:license:importFile'),
  },
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('groone:app:openExternal', url),
});

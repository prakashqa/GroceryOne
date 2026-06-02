/**
 * Renderer preload — exposes a narrow `window.groone` API to the
 * license-gate page. Context isolation is on, so the renderer can't
 * reach Node directly.
 */

import { contextBridge, ipcRenderer } from 'electron';

type ActivateResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

contextBridge.exposeInMainWorld('groone', {
  license: {
    getMachineHash: (): Promise<string> =>
      ipcRenderer.invoke('groone:license:getMachineHash'),
    activate: (key: string, tenantSlug: string): Promise<ActivateResult> =>
      ipcRenderer.invoke('groone:license:activate', { key, tenantSlug }),
  },
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('groone:app:openExternal', url),
});

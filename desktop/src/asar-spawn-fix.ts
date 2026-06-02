/**
 * Workaround for a fundamental asar limitation: `child_process.spawn` (and
 * `execFile`) cannot launch a binary that lives inside `app.asar`, because
 * the archive is a virtual filesystem and Windows `CreateProcess()` bypasses
 * Electron's fs hook. Reads work, execution doesn't.
 *
 * Embedded Postgres builds its binary path from its own `__dirname`, which
 * resolves to `…/app.asar/node_modules/@embedded-postgres/windows-x64/native/bin/initdb.exe`,
 * then spawns it → ENOENT.
 *
 * Fix: monkey-patch the public spawn entry points so any executable path
 * containing `app.asar\` (or `/`) is rewritten to the matching
 * `app.asar.unpacked\…` path. electron-builder's `asarUnpack` config puts
 * the real binaries there; this patch just steers `spawn` to them.
 *
 * Must be loaded BEFORE any code that may call `child_process.spawn` —
 * import it at the top of `main.ts`, before any other local module.
 */

import * as child_process from 'child_process';

const ASAR = `app.asar${require('path').sep}`;
const UNPACKED = `app.asar.unpacked${require('path').sep}`;

function fix(p: string): string {
  // Handle both forward + back slashes (paths can come from either via path.join).
  return p.replace(/app\.asar([\\/])/g, 'app.asar.unpacked$1');
}

/**
 * Exported for testing. Returns the rewritten command path when it looks
 * like one of our unpacked binaries; returns it unchanged otherwise.
 */
export function rewriteIfNeeded(cmd: string): string {
  if (typeof cmd !== 'string') return cmd;
  if (!cmd.includes('app.asar')) return cmd; // fast path
  // Already pointing at the unpacked location? leave it alone.
  if (cmd.includes('app.asar.unpacked')) return cmd;
  // Only rewrite when the path looks like one of OUR unpacked binaries.
  // Embedded Postgres ships .exe entries under @embedded-postgres/*; we
  // scope the rewrite to those to avoid touching unrelated spawns.
  if (
    cmd.includes(`@embedded-postgres${require('path').sep}`) ||
    cmd.includes(`@embedded-postgres/`) ||
    /\.exe$/i.test(cmd)
  ) {
    return fix(cmd);
  }
  return cmd;
}

export function installAsarSpawnFix(): void {
  void ASAR; void UNPACKED; // keep names readable for debugging
  const origSpawn = child_process.spawn;
  const origSpawnSync = child_process.spawnSync;
  const origExecFile = child_process.execFile;
  const origExecFileSync = child_process.execFileSync;

  // We have to overwrite the exported binding so dynamic imports / required
  // modules pick up the patched versions.
  (child_process as any).spawn = function patchedSpawn(cmd: string, ...rest: unknown[]) {
    return (origSpawn as any).call(this, rewriteIfNeeded(cmd), ...rest);
  };
  (child_process as any).spawnSync = function patchedSpawnSync(cmd: string, ...rest: unknown[]) {
    return (origSpawnSync as any).call(this, rewriteIfNeeded(cmd), ...rest);
  };
  (child_process as any).execFile = function patchedExecFile(cmd: string, ...rest: unknown[]) {
    return (origExecFile as any).call(this, rewriteIfNeeded(cmd), ...rest);
  };
  (child_process as any).execFileSync = function patchedExecFileSync(cmd: string, ...rest: unknown[]) {
    return (origExecFileSync as any).call(this, rewriteIfNeeded(cmd), ...rest);
  };
}

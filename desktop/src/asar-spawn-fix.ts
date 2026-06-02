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

// Use require() not `import * as`. TypeScript compiles `import * as` to a
// SYNTHETIC namespace object whose re-exports are getter-only (for ESM
// interop), and assigning into that object throws
//   "Cannot set property spawn of #<Object> which has only a getter".
// require() returns the real CJS module, which is writable.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const child_process: any = require('child_process');

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

  // Use defineProperty in case a future Node version makes these getters.
  // Functions are unwrapped via `.call(this, …)` so behaviour is identical.
  const replace = (name: string, fn: Function): void => {
    Object.defineProperty(child_process, name, {
      value: fn,
      configurable: true,
      writable: true,
    });
  };

  replace('spawn', function patchedSpawn(this: unknown, cmd: string, ...rest: unknown[]) {
    return origSpawn.call(this, rewriteIfNeeded(cmd), ...rest);
  });
  replace('spawnSync', function patchedSpawnSync(this: unknown, cmd: string, ...rest: unknown[]) {
    return origSpawnSync.call(this, rewriteIfNeeded(cmd), ...rest);
  });
  replace('execFile', function patchedExecFile(this: unknown, cmd: string, ...rest: unknown[]) {
    return origExecFile.call(this, rewriteIfNeeded(cmd), ...rest);
  });
  replace('execFileSync', function patchedExecFileSync(this: unknown, cmd: string, ...rest: unknown[]) {
    return origExecFileSync.call(this, rewriteIfNeeded(cmd), ...rest);
  });
}

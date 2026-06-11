/**
 * Tests for the asar→asar.unpacked spawn-path rewrite. Critical because the
 * embedded-postgres binaries are spawned by name from a path built using
 * the library's own __dirname (which resolves inside the asar virtual FS).
 */

import { rewriteIfNeeded, installAsarSpawnFix } from './asar-spawn-fix';
import * as child_process from 'child_process';

describe('rewriteIfNeeded', () => {
  it('rewrites embedded-postgres initdb.exe (Windows backslash)', () => {
    const before =
      'C:\\Program Files\\GroOne\\resources\\app.asar\\node_modules\\@embedded-postgres\\windows-x64\\native\\bin\\initdb.exe';
    const after =
      'C:\\Program Files\\GroOne\\resources\\app.asar.unpacked\\node_modules\\@embedded-postgres\\windows-x64\\native\\bin\\initdb.exe';
    expect(rewriteIfNeeded(before)).toBe(after);
  });

  it('rewrites embedded-postgres postgres.exe + pg_ctl.exe', () => {
    for (const exe of ['postgres.exe', 'pg_ctl.exe']) {
      const before = `D:\\Apps\\GroOne\\resources\\app.asar\\node_modules\\@embedded-postgres\\windows-x64\\native\\bin\\${exe}`;
      expect(rewriteIfNeeded(before)).toContain('app.asar.unpacked');
      expect(rewriteIfNeeded(before)).not.toContain('app.asar\\node_modules');
    }
  });

  it('handles forward-slash paths too (in case path.join differs)', () => {
    const before = '/usr/share/GroOne/resources/app.asar/node_modules/@embedded-postgres/linux-x64/native/bin/initdb';
    // .exe rule wouldn't match on Linux; the @embedded-postgres rule does.
    expect(rewriteIfNeeded(before)).toContain('app.asar.unpacked/');
    expect(rewriteIfNeeded(before)).not.toContain('app.asar/node_modules');
  });

  it('is idempotent: a path already pointing at app.asar.unpacked is left alone', () => {
    const already =
      'C:\\Program Files\\GroOne\\resources\\app.asar.unpacked\\node_modules\\@embedded-postgres\\windows-x64\\native\\bin\\initdb.exe';
    expect(rewriteIfNeeded(already)).toBe(already);
  });

  it('does not touch commands without app.asar in the path', () => {
    expect(rewriteIfNeeded('cmd.exe')).toBe('cmd.exe');
    expect(rewriteIfNeeded('C:\\Windows\\System32\\notepad.exe')).toBe('C:\\Windows\\System32\\notepad.exe');
    expect(rewriteIfNeeded('node')).toBe('node');
  });

  it('does not touch unrelated app.asar paths that are not our binaries', () => {
    // Some package's text file referenced via app.asar — not an .exe and not
    // our embedded-postgres dir. We deliberately don't touch it.
    const config = 'C:\\Apps\\GroOne\\resources\\app.asar\\node_modules\\some-pkg\\readme.txt';
    expect(rewriteIfNeeded(config)).toBe(config);
  });

  it('returns non-string inputs unchanged (defensive)', () => {
    // @ts-expect-error: deliberately wrong type
    expect(rewriteIfNeeded(undefined)).toBeUndefined();
    // @ts-expect-error: deliberately wrong type
    expect(rewriteIfNeeded(123)).toBe(123);
  });
});

describe('installAsarSpawnFix', () => {
  // The real test of the regression: just calling installAsarSpawnFix must
  // not throw. Production threw "Cannot set property spawn of #<Object>
  // which has only a getter" because tsc had compiled `import * as
  // child_process` to a getter-only namespace.
  const cp = require('child_process');
  const fs = require('fs');
  const realSpawn = cp.spawn;
  const realSpawnSync = cp.spawnSync;
  const realExecFile = cp.execFile;
  const realExecFileSync = cp.execFileSync;
  const realChmod = fs.promises.chmod;
  const realChmodSync = fs.chmodSync;

  afterEach(() => {
    // Restore the originals so a later test isn't poisoned by our patch.
    Object.defineProperty(cp, 'spawn', { value: realSpawn, configurable: true, writable: true });
    Object.defineProperty(cp, 'spawnSync', { value: realSpawnSync, configurable: true, writable: true });
    Object.defineProperty(cp, 'execFile', { value: realExecFile, configurable: true, writable: true });
    Object.defineProperty(cp, 'execFileSync', { value: realExecFileSync, configurable: true, writable: true });
    fs.promises.chmod = realChmod;
    fs.chmodSync = realChmodSync;
  });

  it('does not throw (regression for getter-only namespace bug)', () => {
    expect(() => installAsarSpawnFix()).not.toThrow();
  });

  it('replaces the spawn binding on child_process', () => {
    installAsarSpawnFix();
    expect(child_process.spawn).not.toBe(realSpawn);
    expect(cp.spawn).not.toBe(realSpawn);
  });

  it('the patched spawn forwards a REWRITTEN path to the original', () => {
    // Plant a spy as the "original" BEFORE installing the patch — the patch
    // will capture this spy as origSpawn and call it with the rewritten cmd.
    const calls: string[] = [];
    Object.defineProperty(cp, 'spawn', {
      value: (cmd: string) => {
        calls.push(cmd);
        return { on: () => {}, kill: () => {} };
      },
      configurable: true,
      writable: true,
    });
    installAsarSpawnFix();
    (cp.spawn as Function)(
      'C:\\app.asar\\node_modules\\@embedded-postgres\\windows-x64\\bin\\initdb.exe',
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('app.asar.unpacked');
    expect(calls[0]).not.toMatch(/app\.asar\\node_modules/);
  });

  it('passes unrelated commands through unchanged', () => {
    const calls: string[] = [];
    Object.defineProperty(cp, 'spawn', {
      value: (cmd: string) => {
        calls.push(cmd);
        return { on: () => {}, kill: () => {} };
      },
      configurable: true,
      writable: true,
    });
    installAsarSpawnFix();
    (cp.spawn as Function)('node');
    expect(calls[0]).toBe('node');
  });

  it('rewrites fs.promises.chmod paths to the unpacked binary (kills the ENOENT)', async () => {
    const calls: string[] = [];
    fs.promises.chmod = (p: string) => { calls.push(p); return Promise.resolve(); };
    installAsarSpawnFix();
    await (fs.promises.chmod as Function)(
      'C:\\app.asar\\node_modules\\@embedded-postgres\\windows-x64\\bin\\postgres.exe',
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('app.asar.unpacked');
    expect(calls[0]).not.toMatch(/app\.asar\\node_modules/);
  });
});

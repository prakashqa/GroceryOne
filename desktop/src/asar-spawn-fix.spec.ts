/**
 * Tests for the asar→asar.unpacked spawn-path rewrite. Critical because the
 * embedded-postgres binaries are spawned by name from a path built using
 * the library's own __dirname (which resolves inside the asar virtual FS).
 */

import { rewriteIfNeeded } from './asar-spawn-fix';

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

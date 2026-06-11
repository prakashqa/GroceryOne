// db.ts imports `electron`; mock it so the pure helper can be required.
jest.mock('electron', () => ({ app: { getPath: () => require('os').tmpdir() } }));

import { shouldRemoveStaleLock, parsePostmasterPid } from './db';

describe('shouldRemoveStaleLock', () => {
  it('removes the lock when the pid file exists but nothing is listening (stale)', () => {
    expect(shouldRemoveStaleLock(true, false)).toBe(true);
  });

  it('keeps the lock when a server is genuinely listening (live, another instance)', () => {
    expect(shouldRemoveStaleLock(true, true)).toBe(false);
  });

  it('does nothing when there is no lock file', () => {
    expect(shouldRemoveStaleLock(false, false)).toBe(false);
    expect(shouldRemoveStaleLock(false, true)).toBe(false);
  });
});

describe('parsePostmasterPid', () => {
  it('reads the PID from the first line of a real postmaster.pid', () => {
    // Postgres writes the PID on line 1, then data dir, start time, port, etc.
    const contents = '6732\nC:\\Users\\x\\AppData\\Roaming\\GroOne\\pgdata\n1700000000\n47632\n';
    expect(parsePostmasterPid(contents)).toBe(6732);
  });

  it('trims whitespace/CRLF and accepts a bare pid', () => {
    expect(parsePostmasterPid('  12345  \r\n')).toBe(12345);
  });

  it('returns null for empty, non-numeric, or non-positive content', () => {
    expect(parsePostmasterPid('')).toBeNull();
    expect(parsePostmasterPid(null)).toBeNull();
    expect(parsePostmasterPid(undefined)).toBeNull();
    expect(parsePostmasterPid('not-a-pid\n')).toBeNull();
    expect(parsePostmasterPid('0\n')).toBeNull();
    expect(parsePostmasterPid('-5\n')).toBeNull();
  });
});

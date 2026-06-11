// db.ts imports `electron`; mock it so the pure helper can be required.
jest.mock('electron', () => ({ app: { getPath: () => require('os').tmpdir() } }));

import { shouldRemoveStaleLock, parsePostmasterPid, parseNetstatListenerPids, parsePidList } from './db';

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

describe('parseNetstatListenerPids', () => {
  const sample = [
    'Active Connections',
    '',
    '  Proto  Local Address          Foreign Address        State           PID',
    '  TCP    127.0.0.1:47632        0.0.0.0:0              LISTENING       1596',
    '  TCP    127.0.0.1:47600        0.0.0.0:0              LISTENING       4242',
    '  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING       4',
    '  TCP    127.0.0.1:50312        127.0.0.1:47632        ESTABLISHED     9999',
  ].join('\r\n');

  it('returns the PID that is LISTENING on the requested port', () => {
    expect(parseNetstatListenerPids(sample, 47632)).toEqual([1596]);
  });

  it('ignores other ports and non-LISTENING (e.g. ESTABLISHED) rows', () => {
    expect(parseNetstatListenerPids(sample, 47600)).toEqual([4242]);
    // 47632 also appears as a foreign address on an ESTABLISHED row — not matched.
    expect(parseNetstatListenerPids(sample, 47632)).not.toContain(9999);
  });

  it('returns [] for empty/garbage input', () => {
    expect(parseNetstatListenerPids('', 47632)).toEqual([]);
    expect(parseNetstatListenerPids('nonsense', 47632)).toEqual([]);
  });
});

describe('parsePidList', () => {
  it('parses newline-separated PIDs and de-dupes', () => {
    expect(parsePidList('1596\r\n4242\r\n1596\n')).toEqual([1596, 4242]);
  });

  it('skips blank/garbage lines and non-positive values', () => {
    expect(parsePidList('\n  \nabc\n0\n-1\n777\n')).toEqual([777]);
  });
});

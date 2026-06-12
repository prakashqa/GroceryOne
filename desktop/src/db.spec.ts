// db.ts imports `electron`; mock it so the pure helper can be required.
jest.mock('electron', () => ({ app: { getPath: () => require('os').tmpdir() } }));

import { shouldRemoveStaleLock, parsePostmasterPid, parseNetstatListenerPids, parsePidList, planRecovery } from './db';

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

  it('matches IPv6 listener rows ([::] / [::1]) and de-dupes the same PID across v4/v6', () => {
    const s = [
      '  TCP    0.0.0.0:47632    0.0.0.0:0    LISTENING    1596',
      '  TCP    [::]:47632       [::]:0       LISTENING    1596',
      '  TCP    [::1]:47632      [::]:0       LISTENING    1596',
    ].join('\r\n');
    expect(parseNetstatListenerPids(s, 47632)).toEqual([1596]);
  });

  it('returns every DISTINCT pid listening on the port (recovery kills them all)', () => {
    const s = [
      '  TCP    0.0.0.0:47632    0.0.0.0:0    LISTENING    111',
      '  TCP    [::]:47632       [::]:0       LISTENING    222',
    ].join('\n');
    expect(parseNetstatListenerPids(s, 47632).sort((a, b) => a - b)).toEqual([111, 222]);
  });

  it('does not confuse a longer port that merely ends with the digits (632 vs 47632)', () => {
    const s = '  TCP    127.0.0.1:47632    0.0.0.0:0    LISTENING    1596';
    expect(parseNetstatListenerPids(s, 632)).toEqual([]); // ':632' !== ':47632'
  });

  it('returns [] for empty/garbage input', () => {
    expect(parseNetstatListenerPids('', 47632)).toEqual([]);
    expect(parseNetstatListenerPids('nonsense', 47632)).toEqual([]);
  });
});

describe('planRecovery (pure orphan-recovery decision)', () => {
  const base = { hasPidFile: false, listening: false, listenerPids: [] as number[], ourPids: [] as number[], pidFromFile: null as number | null };

  it('removes a stale lock when nothing is listening', () => {
    expect(planRecovery({ ...base, hasPidFile: true, listening: false }))
      .toEqual({ removeLock: true, kill: [], abortUnknownOwner: false });
  });

  it('is a no-op when not listening and no lock file', () => {
    expect(planRecovery({ ...base }))
      .toEqual({ removeLock: false, kill: [], abortUnknownOwner: false });
  });

  it('kills the de-duped union of listener + bundled-postgres + lock-file pids', () => {
    const plan = planRecovery({
      hasPidFile: true, listening: true,
      listenerPids: [1596], ourPids: [1596, 222], pidFromFile: 1596,
    });
    expect(plan.abortUnknownOwner).toBe(false);
    expect(plan.removeLock).toBe(false);
    expect(plan.kill.sort((a, b) => a - b)).toEqual([222, 1596]);
  });

  it('SAFETY: when the port is held but no pid is attributable to us, abort and kill NOTHING', () => {
    expect(planRecovery({ ...base, listening: true, listenerPids: [], ourPids: [], pidFromFile: null }))
      .toEqual({ removeLock: false, kill: [], abortUnknownOwner: true });
  });

  it('still trusts our own lock-file pid even if netstat/CIM found nothing', () => {
    expect(planRecovery({ ...base, listening: true, pidFromFile: 1596 }))
      .toEqual({ removeLock: false, kill: [1596], abortUnknownOwner: false });
  });

  it('kills a NON-LISTENING bundled-postgres zombie (the shared-memory / every-restart case)', () => {
    // Port is free but a leftover postgres.exe from our bundle still holds the
    // shared-memory segment — it MUST be killed even though nothing is listening.
    expect(planRecovery({ ...base, listening: false, hasPidFile: true, ourPids: [222] }))
      .toEqual({ removeLock: false, kill: [222], abortUnknownOwner: false });
  });

  it('SAFETY: when NOT listening, ignores a lock-file pid we cannot attribute (pid reuse)', () => {
    // A stale lock file's pid may have been recycled by an unrelated process —
    // never kill it. Just drop the stale lock.
    expect(planRecovery({ ...base, listening: false, hasPidFile: true, pidFromFile: 999, ourPids: [] }))
      .toEqual({ removeLock: true, kill: [], abortUnknownOwner: false });
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

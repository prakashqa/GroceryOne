// db.ts imports `electron`; mock it so the pure helper can be required.
jest.mock('electron', () => ({ app: { getPath: () => require('os').tmpdir() } }));

import { shouldRemoveStaleLock } from './db';

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

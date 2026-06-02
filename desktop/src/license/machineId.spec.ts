/**
 * Tests for the machine-id wrapper. node-machine-id is mocked so we don't
 * read the real registry; we assert stability + the SHA-256 short-hash.
 */

jest.mock('node-machine-id', () => ({
  machineIdSync: jest.fn(() => 'FIXED-MACHINE-GUID'),
}));

import { createHash } from 'crypto';
import { getRawMachineId, getMachineIdShortHash } from './machineId';

describe('machineId', () => {
  it('returns the raw id from node-machine-id', () => {
    expect(getRawMachineId()).toBe('FIXED-MACHINE-GUID');
  });

  it('produces the first 12 hex chars of SHA-256(raw)', () => {
    const expected = createHash('sha256').update('FIXED-MACHINE-GUID').digest('hex').slice(0, 12);
    expect(getMachineIdShortHash()).toBe(expected);
    expect(getMachineIdShortHash()).toHaveLength(12);
  });

  it('is stable across calls (cached)', () => {
    expect(getRawMachineId()).toBe(getRawMachineId());
  });
});

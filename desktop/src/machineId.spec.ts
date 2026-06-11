import { computeMachineId, shortMachineId } from './machineId';

describe('computeMachineId', () => {
  it('is deterministic for the same OS id', () => {
    expect(computeMachineId('abc-123')).toBe(computeMachineId('abc-123'));
  });

  it('differs for different OS ids (binds to one machine)', () => {
    expect(computeMachineId('machine-A')).not.toBe(computeMachineId('machine-B'));
  });

  it('produces a 64-hex sha256 string', () => {
    expect(computeMachineId('x')).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('shortMachineId', () => {
  it('groups the first 12 hex chars as AAAA-BBBB-CCCC (uppercase)', () => {
    expect(shortMachineId('a1b2c3d4e5f6deadbeef')).toBe('A1B2-C3D4-E5F6');
  });

  it('handles short / empty / non-hex input gracefully', () => {
    expect(shortMachineId('')).toBe('');
    expect(shortMachineId('a1b2')).toBe('A1B2');
    expect(shortMachineId('zz!!a1b2c3d4e5f6')).toBe('A1B2-C3D4-E5F6'); // strips non-hex, then first 12
  });
});

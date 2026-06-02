/**
 * Tests for the in-memory Redis stub used in offline/desktop mode
 * (REDIS_DISABLED=true). It implements the subset of ioredis the app uses:
 * get / set (with EX ttl) / del, plus no-op lifecycle methods.
 */

import { InMemoryRedis } from './in-memory-redis';

describe('InMemoryRedis', () => {
  let redis: InMemoryRedis;

  beforeEach(() => {
    redis = new InMemoryRedis();
  });

  it('round-trips a value with get/set', async () => {
    await redis.set('k', 'v');
    expect(await redis.get('k')).toBe('v');
  });

  it('returns null for a missing key', async () => {
    expect(await redis.get('nope')).toBeNull();
  });

  it('deletes a key', async () => {
    await redis.set('k', 'v');
    await redis.del('k');
    expect(await redis.get('k')).toBeNull();
  });

  it('honors EX ttl — value expires after the window', async () => {
    // Use a tiny ttl and a controllable clock.
    let now = 1_000_000;
    const r = new InMemoryRedis(() => now);
    await r.set('k', 'v', 'EX', 5); // 5 seconds
    expect(await r.get('k')).toBe('v');
    now += 4_000; // +4s — still alive
    expect(await r.get('k')).toBe('v');
    now += 2_000; // +6s total — expired
    expect(await r.get('k')).toBeNull();
  });

  it('treats a key with no ttl as persistent', async () => {
    let now = 0;
    const r = new InMemoryRedis(() => now);
    await r.set('k', 'v');
    now += 10 ** 9;
    expect(await r.get('k')).toBe('v');
  });

  it('overwriting a key resets its ttl', async () => {
    let now = 0;
    const r = new InMemoryRedis(() => now);
    await r.set('k', 'v', 'EX', 5);
    now += 4_000;
    await r.set('k', 'v2', 'EX', 5); // reset
    now += 4_000; // 8s since first set, 4s since reset
    expect(await r.get('k')).toBe('v2');
  });

  it('lifecycle methods are no-ops that resolve', async () => {
    await expect(redis.quit()).resolves.toBeUndefined();
    expect(() => redis.disconnect()).not.toThrow();
  });
});

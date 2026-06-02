/**
 * In-memory Redis stub for offline/desktop mode (REDIS_DISABLED=true).
 *
 * Implements the subset of the ioredis API the app actually uses:
 *   - get(key)
 *   - set(key, value, 'EX', ttlSeconds?)
 *   - del(key)
 *   - quit() / disconnect()  (no-ops)
 *
 * Single-process desktop app → a plain Map with lazy TTL eviction is enough.
 * We deliberately do NOT pull in ioredis so the desktop build never tries to
 * open a socket.
 */

interface Entry {
  value: string;
  expiresAt: number | null; // epoch ms, or null = never
}

type Clock = () => number;

export class InMemoryRedis {
  private store = new Map<string, Entry>();
  private readonly now: Clock;

  constructor(clock?: Clock) {
    this.now = clock ?? (() => Date.now());
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= this.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  /**
   * Mirrors ioredis' variadic signature for the one form we use:
   *   set(key, value)              → persistent
   *   set(key, value, 'EX', ttl)   → expires after ttl seconds
   */
  async set(key: string, value: string, mode?: 'EX', ttlSeconds?: number): Promise<'OK'> {
    let expiresAt: number | null = null;
    if (mode === 'EX' && typeof ttlSeconds === 'number') {
      expiresAt = this.now() + ttlSeconds * 1000;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async quit(): Promise<void> {
    this.store.clear();
  }

  disconnect(): void {
    this.store.clear();
  }
}

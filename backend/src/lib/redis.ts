import Redis from 'ioredis';

// Mock Redis implementation for environments without Redis
interface StoredValue {
  value: string;
  expiresAt?: number; // timestamp in ms
}

class MockRedis {
  private store = new Map<string, StoredValue>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Active expiration: Periodic cleanup every 1s
    // Using unref() to prevent blocking process exit (e.g. in tests)
    this.cleanupInterval = setInterval(() => {
      this.pruneExpired();
    }, 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  // Scan all keys to remove expired ones (Active Expiration)
  private pruneExpired() {
    const now = Date.now();
    for (const [key, item] of this.store) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  // Helper to check and remove expired keys (Lazy Expiration)
  private checkExpiration(key: string): boolean {
    const item = this.store.get(key);
    if (item && item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return true;
    }
    return false;
  }

  async get(key: string) {
    if (this.checkExpiration(key)) {
      return null;
    }
    const item = this.store.get(key);
    return item ? item.value : null;
  }

  async set(key: string, value: string, ...args: any[]) {
    let expiresAt: number | undefined;

    // Handle options like 'EX', 10
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === 'string' && args[i].toUpperCase() === 'EX') {
        const seconds = args[i + 1];
        if (typeof seconds === 'number') {
          expiresAt = Date.now() + seconds * 1000;
        }
      }
    }

    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string) {
    const expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string) {
    return this.store.delete(key) ? 1 : 0;
  }

  async ttl(key: string): Promise<number> {
    if (this.checkExpiration(key)) {
      return -2;
    }

    const item = this.store.get(key);
    if (!item) {
      return -2;
    }

    if (!item.expiresAt) {
      return -1;
    }

    const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.checkExpiration(key)) {
      return 0;
    }

    const item = this.store.get(key);
    if (!item) {
      return 0;
    }

    item.expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, item);
    return 1;
  }

  async keys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

    for (const [key] of this.store) {
      if (this.checkExpiration(key)) {
        continue;
      }
      if (regex.test(key)) {
        keys.push(key);
      }
    }
    return keys;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async eval(..._args: any[]) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  on(_event: string, _callback: Function) {
    // No-op
    return this;
  }

  async quit() {
    return 'OK';
  }

  async disconnect() {
    // No-op
  }

  async ping() {
    return 'PONG';
  }
}

// Check if we should use real Redis or Mock
const useRealRedis = process.env.USE_REAL_REDIS === 'true';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = useRealRedis ? new Redis(redisUrl) : (new MockRedis() as unknown as Redis);

export default redis;
export default redis;

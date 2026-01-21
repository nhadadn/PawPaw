import Redis from 'ioredis';

// Mock Redis implementation for environments without Redis
class MockRedis {
  private store = new Map<string, string>();
  
  async get(key: string) {
    return this.store.get(key) || null;
  }
  
  async set(key: string, value: string, ...args: any[]) {
    this.store.set(key, value);
    return 'OK';
  }
  
  async del(key: string) {
    return this.store.delete(key) ? 1 : 0;
  }

  async setex(key: string, seconds: number, value: string) {
    this.store.set(key, value);
    return 'OK';
  }
  
  async eval(...args: any[]) {
    return null;
  }

  on(event: string, callback: Function) {
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

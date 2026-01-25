import { CacheService } from './cache.service';
import redis from '../lib/redis';

// Mock redis
jest.mock('../lib/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    quit: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
  },
}));

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Ensure redis connection is closed (mocked, but good practice)
    if (redis.quit) {
      await redis.quit();
    }
  });

  it('should get value from cache', async () => {
    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify({ test: 'value' }));
    const result = await cacheService.get('test:key');
    expect(result).toEqual({ test: 'value' });
    expect(redis.get).toHaveBeenCalledWith('test:key');
  });

  it('should return null on cache miss', async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);
    const result = await cacheService.get('test:key');
    expect(result).toBeNull();
  });

  it('should set value in cache', async () => {
    await cacheService.set('test:key', { test: 'value' });
    expect(redis.setex).toHaveBeenCalledWith('test:key', 300, JSON.stringify({ test: 'value' }));
  });

  it('should delete key', async () => {
    await cacheService.del('test:key');
    expect(redis.del).toHaveBeenCalledWith('test:key');
  });

  it('should delete pattern', async () => {
    (redis.keys as jest.Mock).mockResolvedValue(['test:key:1', 'test:key:2']);
    await cacheService.del('test:key:*');
    expect(redis.keys).toHaveBeenCalledWith('test:key:*');
    expect(redis.del).toHaveBeenCalledWith('test:key:1');
    expect(redis.del).toHaveBeenCalledWith('test:key:2');
  });
});

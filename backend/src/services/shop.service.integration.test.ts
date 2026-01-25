import { ShopService } from './shop.service';
import { ShopRepository } from '../repositories/shop.repository';
import redis from '../lib/redis';

// Mock Redis
jest.mock('../lib/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    quit: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
  },
}));

// Mock ShopRepository
jest.mock('../repositories/shop.repository');

describe('ShopService Integration (Cache)', () => {
  let service: ShopService;
  let repoMock: jest.Mocked<ShopRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ShopService();
    // Get the instance of the repository that was created inside the service
    repoMock = (ShopRepository as unknown as jest.Mock).mock.instances[0];
  });

  afterAll(async () => {
    // Ensure redis connection is closed (mocked, but good practice)
    if (redis.quit) {
      await redis.quit();
    }
  });

  describe('getProducts', () => {
    const mockProducts = [
      {
        id: BigInt(1),
        name: 'Test Product',
        slug: 'test-product',
        priceCents: 1000,
        variants: [{ id: BigInt(10), productId: BigInt(1), initialStock: 10, reservedStock: 0 }],
        images: [],
        category: { name: 'Test Cat' },
      },
    ];

    it('should return cached data if available (Cache HIT)', async () => {
      const cachedData = [{ id: '1', name: 'Cached Product' }];
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getProducts(10, 0);

      expect(result).toEqual(cachedData);
      expect(redis.get).toHaveBeenCalledWith(expect.stringContaining('products:list'));
      expect(repoMock.findAllProducts).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache result if not in cache (Cache MISS)', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      repoMock.findAllProducts.mockResolvedValue(mockProducts as any);

      const result = await service.getProducts(10, 0);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(repoMock.findAllProducts).toHaveBeenCalledWith(10, 0, undefined);
      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringContaining('products:list'),
        300,
        expect.any(String)
      );
    });

    it('should fallback to DB if Redis fails', async () => {
      (redis.get as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));
      repoMock.findAllProducts.mockResolvedValue(mockProducts as any);

      const result = await service.getProducts(10, 0);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(repoMock.findAllProducts).toHaveBeenCalled();
      // Should still try to set cache (which might also fail, but service should catch it)
      // The CacheService.set also has try-catch, so it shouldn't throw.
    });
  });
});

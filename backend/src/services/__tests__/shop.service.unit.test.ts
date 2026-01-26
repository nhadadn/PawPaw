import { ShopService } from '../shop.service';
import { ShopRepository } from '../../repositories/shop.repository';
import { CacheService } from '../cache.service';

jest.mock('../../repositories/shop.repository');
jest.mock('../cache.service');

describe('ShopService (unit)', () => {
  let service: ShopService;
  let repo: jest.Mocked<ShopRepository>;
  let cache: jest.Mocked<CacheService>;

  const product = {
    id: BigInt(1),
    name: 'Test Product',
    slug: 'test-product',
    description: null,
    imageUrl: null,
    categoryId: BigInt(2),
    priceCents: 1000,
    currency: 'MXN',
    isActive: true,
    isDrop: false,
    dropDate: null,
    maxPerCustomer: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: BigInt(2),
      name: 'Test Cat',
      slug: 'test-cat',
      description: null,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    variants: [
      {
        id: BigInt(10),
        createdAt: new Date(),
        updatedAt: new Date(),
        productId: BigInt(1),
        sku: 'SKU-10',
        size: null,
        color: null,
        initialStock: 10,
        reservedStock: 0,
      },
    ],
    images: [],
  };

  beforeEach(() => {
    service = new ShopService();
    repo = (ShopRepository as unknown as jest.Mock).mock
      .instances[0] as jest.Mocked<ShopRepository>;
    cache = (CacheService as unknown as jest.Mock).mock.instances[0] as jest.Mocked<CacheService>;
    jest.clearAllMocks();
  });

  it('getProducts returns cache when available', async () => {
    cache.get.mockResolvedValue([{ id: '1' }]);
    const res = await service.getProducts(10, 0);
    expect(Array.isArray(res)).toBe(true);
    expect(cache.get).toHaveBeenCalled();
    expect(repo.findAllProducts).not.toHaveBeenCalled();
  });

  it('getProducts fetches and caches when miss', async () => {
    cache.get.mockResolvedValue(null);
    repo.findAllProducts.mockResolvedValue([product] as any);
    const res = await service.getProducts(10, 0);
    const list = Array.isArray(res) ? (res as Array<any>) : [];
    expect(list[0].id).toBe('1');
    expect(cache.set).toHaveBeenCalled();
  });

  it('getProduct transforms product', async () => {
    repo.findProductById.mockResolvedValue(product as any);
    const res = await service.getProduct(1);
    const p = res as unknown as { id: string; category: string };
    expect(p.id).toBe('1');
    expect(p.category).toBe('Test Cat');
  });

  it('getProductBySlug cache hit', async () => {
    cache.get.mockResolvedValue({ id: '1' } as any);
    const res = await service.getProductBySlug('test-product');
    const p = res as unknown as { id: string };
    expect(p.id).toBe('1');
    expect(repo.findProductBySlug).not.toHaveBeenCalled();
  });

  it('getProductBySlug fetch and set', async () => {
    cache.get.mockResolvedValue(null);
    repo.findProductBySlug.mockResolvedValue(product as any);
    const res = await service.getProductBySlug('test-product');
    const p2 = res as unknown as { id: string };
    expect(p2.id).toBe('1');
    expect(cache.set).toHaveBeenCalled();
  });

  it('getCategories cache miss and set', async () => {
    cache.get.mockResolvedValue(null);
    repo.findAllCategories.mockResolvedValue([
      {
        id: BigInt(2),
        name: 'Test Cat',
        slug: 'test-cat',
        description: null,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ]);
    const res = await service.getCategories();
    const list = Array.isArray(res) ? (res as Array<any>) : [];
    expect(list[0].id).toBe('2');
    expect(cache.set).toHaveBeenCalled();
  });
});

import { AdminService } from './admin.service';
import { AdminRepository } from '../repositories/admin.repository';
import redis from '../lib/redis';

// Mock the repository class
jest.mock('../repositories/admin.repository');

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

describe('AdminService Image Handling', () => {
  let service: AdminService;
  let mockRepoInstance: jest.Mocked<AdminRepository>;

  beforeEach(() => {
    // Clear all mocks
    (AdminRepository as unknown as jest.Mock).mockClear();
    jest.clearAllMocks();

    // Instantiate service, which triggers new AdminRepository()
    service = new AdminService();

    // Get the mock instance
    mockRepoInstance = (AdminRepository as unknown as jest.Mock).mock.instances[0];
  });

  afterAll(async () => {
    // Ensure redis connection is closed (mocked, but good practice)
    if (redis.quit) {
      await redis.quit();
    }
  });

  it('createProduct should correctly map multiple images from repository response', async () => {
    const inputData = {
      name: 'Test Product',
      slug: 'test-product',
      description: 'Desc',
      priceCents: 1000,
      images: ['/uploads/1.jpg', '/uploads/2.jpg'],
      initialStock: 10,
    };

    const mockDbResponse = {
      id: BigInt(100),
      name: 'Test Product',
      slug: 'test-product',
      description: 'Desc',
      imageUrl: '/uploads/1.jpg',
      categoryId: null,
      priceCents: 1000,
      currency: 'MXN',
      isActive: true,
      isDrop: false,
      dropDate: null,
      maxPerCustomer: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: null,
      variants: [
        {
          id: BigInt(1),
          productId: BigInt(100),
          sku: 'test-product-001',
          initialStock: 10,
          reservedStock: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          size: null,
          color: null,
        },
      ],
      images: [
        {
          id: BigInt(50),
          productId: BigInt(100),
          url: '/uploads/1.jpg',
          order: 0,
          createdAt: new Date(),
        },
        {
          id: BigInt(51),
          productId: BigInt(100),
          url: '/uploads/2.jpg',
          order: 1,
          createdAt: new Date(),
        },
      ],
      waitlist: [],
    };

    // Mock the repository method
    mockRepoInstance.createProductWithVariant.mockResolvedValue(mockDbResponse);

    // Execute service method
    const result = await service.createProduct(inputData);

    // Verify repository call
    expect(mockRepoInstance.createProductWithVariant).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Product',
        images: ['/uploads/1.jpg', '/uploads/2.jpg'],
      }),
      10
    );

    // Verify result mapping
    expect(result.id).toBe('100');
    expect(result.images).toBeDefined();
    expect(result.images).toHaveLength(2);
    expect(result.images[0]).toEqual({
      id: '50',
      url: '/uploads/1.jpg',
      order: 0,
    });
    expect(result.images[1]).toEqual({
      id: '51',
      url: '/uploads/2.jpg',
      order: 1,
    });
  });

  it('updateProduct should correctly map new images', async () => {
    const updateData = {
      name: 'Updated Product',
      newImages: ['/uploads/3.jpg'],
    };

    const mockDbResponse = {
      id: BigInt(100),
      name: 'Updated Product',
      slug: 'updated-product',
      description: 'Desc',
      imageUrl: '/uploads/1.jpg',
      categoryId: null,
      priceCents: 1000,
      currency: 'MXN',
      isActive: true,
      isDrop: false,
      dropDate: null,
      maxPerCustomer: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: null,
      variants: [
        {
          id: BigInt(1),
          productId: BigInt(100),
          sku: 'updated-product-001',
          initialStock: 10,
          reservedStock: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          size: null,
          color: null,
        },
      ],
      images: [
        {
          id: BigInt(50),
          productId: BigInt(100),
          url: '/uploads/1.jpg',
          order: 0,
          createdAt: new Date(),
        }, // Existing
        {
          id: BigInt(52),
          productId: BigInt(100),
          url: '/uploads/3.jpg',
          order: 1,
          createdAt: new Date(),
        }, // New
      ],
      waitlist: [],
    };

    mockRepoInstance.updateProduct.mockResolvedValue(mockDbResponse);

    const result = await service.updateProduct(100, updateData);

    expect(mockRepoInstance.updateProduct).toHaveBeenCalledWith(
      100,
      expect.objectContaining({ name: 'Updated Product' }),
      undefined,
      ['/uploads/3.jpg'],
      undefined
    );

    expect(result.id).toBe('100');
    expect(result.images).toHaveLength(2);
    expect(result.images[1].url).toBe('/uploads/3.jpg');
  });

  it('getProduct should map images correctly', async () => {
    const mockDbResponse = {
      id: BigInt(100),
      name: 'Test Product',
      slug: 'test-product',
      description: 'Desc',
      imageUrl: '/uploads/1.jpg',
      categoryId: null,
      priceCents: 1000,
      currency: 'MXN',
      isActive: true,
      isDrop: false,
      dropDate: null,
      maxPerCustomer: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: null,
      variants: [],
      images: [
        {
          id: BigInt(50),
          productId: BigInt(100),
          url: '/uploads/1.jpg',
          order: 0,
          createdAt: new Date(),
        },
      ],
      waitlist: [],
    };

    mockRepoInstance.findProductById.mockResolvedValue(mockDbResponse);

    const result = await service.getProduct(100);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.id).toBe('100');
      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toBe('/uploads/1.jpg');
    }
  });
});

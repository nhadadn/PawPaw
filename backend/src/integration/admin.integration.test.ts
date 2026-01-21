import request from 'supertest';
import { createApp } from '../app';
import { register } from 'prom-client';
import path from 'path';
import fs from 'fs';

// Mock AdminRepository
jest.mock('../repositories/admin.repository', () => ({
  AdminRepository: jest.fn().mockImplementation(() => ({
    findAllProducts: jest
      .fn()
      .mockResolvedValue([
        { id: BigInt(1), name: 'Product 1', categoryId: BigInt(1), variants: [] },
      ]),
    findProductById: jest.fn().mockImplementation((id) => {
      if (id === 1)
        return Promise.resolve({
          id: BigInt(1),
          name: 'Product 1',
          categoryId: BigInt(1),
          variants: [],
        });
      return Promise.resolve(null);
    }),
    createProductWithVariant: jest.fn().mockImplementation((data) =>
      Promise.resolve({
        id: BigInt(2),
        name: data.name,
        categoryId: BigInt(1),
        variants: [],
        imageUrl: data.images && data.images.length > 0 ? data.images[0] : null,
        images: data.images
          ? data.images.map((url: string, index: number) => ({
              id: BigInt(index + 1),
              url,
              order: index,
            }))
          : [],
      })
    ),
    updateProduct: jest.fn().mockResolvedValue({
      id: BigInt(1),
      name: 'Updated Product',
      categoryId: BigInt(1),
      variants: [],
    }),
    deleteProduct: jest.fn().mockResolvedValue({
      id: BigInt(1),
      name: 'Deleted Product',
      categoryId: BigInt(1),
      variants: [],
    }),
    findAllCategories: jest.fn().mockResolvedValue([{ id: BigInt(1), name: 'Category 1' }]),
    createCategory: jest.fn().mockResolvedValue({
      id: BigInt(2),
      name: 'Category 2',
    }),
    findAllOrders: jest.fn().mockResolvedValue([{ id: BigInt(1), items: [] }]),
    findAllUsers: jest.fn().mockResolvedValue([{ id: 'user-1', email: 'user@test.com' }]),
    getDashboardStats: jest.fn().mockResolvedValue({
      totalOrders: 10,
      totalProducts: 5,
      totalUsers: 3,
      totalSales: 1000,
    }),
  })),
}));

// Mock AdminService methods if needed?
// No, we mock Repository so Service uses Mock Repository.
// Service logic (BigInt conversion) will be tested.

// Handle BigInt serialization in tests (still needed for service output)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = createApp();

describe('Admin API Integration', () => {
  beforeAll(async () => {
    register.clear();
  });

  afterAll(async () => {
    register.clear();
  });

  describe('GET /api/admin/products', () => {
    it('should return 403 if not admin', async () => {
      const res = await request(app)
        .get('/api/admin/products')
        .set('Authorization', 'Bearer mock-token');
      expect(res.status).toBe(403);
    });

    it('should return 200 and products list if admin', async () => {
      const res = await request(app)
        .get('/api/admin/products')
        .set('x-test-role', 'admin')
        .set('Authorization', 'Bearer mock-token');

      if (res.status !== 200) {
        console.error('Products Test Failed Body:', JSON.stringify(res.body, null, 2));
      }
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].name).toBe('Product 1');
    });
  });

  describe('POST /api/admin/products', () => {
    it('should create a product', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        priceCents: 1000,
        currency: 'MXN',
        isActive: true,
        isDrop: false,
      };

      const res = await request(app)
        .post('/api/admin/products')
        .set('x-test-role', 'admin')
        .set('Authorization', 'Bearer mock-token')
        .send(productData);

      if (res.status !== 201) {
        // eslint-disable-next-line no-console
        console.error('Create Product Failed:', JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(productData.name);
    });

    it('should create a product with images', async () => {
      const testImagePath = path.join(__dirname, 'test-image.jpg');
      // Create dummy image
      fs.writeFileSync(testImagePath, 'dummy image content');

      const res = await request(app)
        .post('/api/admin/products')
        .set('x-test-role', 'admin')
        .set('Authorization', 'Bearer mock-token')
        .field('name', 'Product with Image')
        .field('priceCents', '1000')
        .field('categoryId', '1')
        .field('initialStock', '10')
        .field('currency', 'MXN')
        .field('isActive', 'true')
        .field('isDrop', 'false')
        .attach('images', testImagePath);

      // Cleanup
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }

      if (res.status !== 201) {
        console.error('Create Product with Images Failed:', JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Product with Image');
      expect(res.body.images).toBeDefined();
      expect(res.body.images.length).toBeGreaterThan(0);
      expect(res.body.images[0].url).toMatch(/\/uploads\/.*\.jpg/);
    });

    it('should fail with invalid data', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('x-test-role', 'admin')
        .set('Authorization', 'Bearer mock-token')
        .send({ name: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/admin/categories', () => {
    it('should return categories', async () => {
      const res = await request(app)
        .get('/api/admin/categories')
        .set('x-test-role', 'admin')
        .set('Authorization', 'Bearer mock-token');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/admin/orders', () => {
    it('should return orders', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('x-test-role', 'admin')
        .set('Authorization', 'Bearer mock-token');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('x-test-role', 'admin')
        .set('Authorization', 'Bearer mock-token');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/admin/dashboard/stats', () => {
    it('should return dashboard stats', async () => {
      // We need to ensure service.getDashboardStats is mocked or implemented
      // Since we mocked repository, we should check if AdminService calls a repository method for stats.
      // Wait, AdminService methods: getProducts, etc.
      // I didn't see getDashboardStats in AdminService/Repository in my previous read.
      // I should add it to Service/Repository if missing.

      // For now, let's assume it fails if not implemented.
      // I will implement it in Service/Repository.

      const res = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('x-test-role', 'admin')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/admin/login', () => {
    it('should return token for valid credentials', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ email: 'admin@pawpaw.com', password: 'admin123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ email: 'admin@pawpaw.com', password: 'wrong-password' });
      expect(res.status).toBe(401);
    });
  });
});

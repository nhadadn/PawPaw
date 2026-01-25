import request from 'supertest';
import { createApp } from '../app';
import fs from 'fs';
import path from 'path';
import redis from '../lib/redis';

// Mock Redis
jest.mock('../lib/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  quit: jest.fn(),
  ping: jest.fn().mockResolvedValue('PONG'),
}));

// Mock Prisma
jest.mock('../lib/prisma', () => ({
  $transaction: jest.fn((callback) => callback({ $queryRaw: jest.fn() })),
  $queryRaw: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
}));

// Mock repositories to avoid DB connection
jest.mock('../repositories/admin.repository');
jest.mock('../repositories/shop.repository', () => ({
  ShopRepository: jest.fn().mockImplementation(() => ({
    findAllProducts: jest.fn().mockResolvedValue([
      {
        id: BigInt(1),
        name: 'Image Test Product',
        imageUrl: '/uploads/integration-test.jpg',
        images: [
          { id: BigInt(1), productId: BigInt(1), url: '/uploads/integration-test.jpg', order: 0 },
        ],
        variants: [],
      },
    ]),
    findProductById: jest.fn().mockResolvedValue({
      id: BigInt(1),
      name: 'Image Test Product',
      imageUrl: '/uploads/integration-test.jpg',
      images: [
        { id: BigInt(1), productId: BigInt(1), url: '/uploads/integration-test.jpg', order: 0 },
      ],
      variants: [],
    }),
  })),
}));

const app = createApp();

describe('Image Serving & Visibility Integration', () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const testFileName = 'integration-test.jpg';
  const testFilePath = path.join(uploadsDir, testFileName);
  const testContent = 'dummy image content';

  beforeAll(() => {
    // Ensure uploads dir exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    // Create a dummy file
    fs.writeFileSync(testFilePath, testContent);
  });

  afterAll(async () => {
    // Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    await redis.quit();
  });

  test('Static file serving: should serve /uploads/integration-test.jpg', async () => {
    const res = await request(app).get(`/uploads/${testFileName}`);
    expect(res.status).toBe(200);
    // When serving static files, express might send it as binary.
    // Supertest might put it in res.body (Buffer) or res.text (if it thinks it's text)
    // Since we didn't specify encoding, and extension is .jpg, it's treated as binary.
    // So we check res.body is a Buffer and equals our content.
    expect(res.body).toBeInstanceOf(Buffer);
    expect(res.body.toString()).toBe(testContent);
    expect(res.headers['content-type']).toMatch(/image\/jpeg/);
  });

  test('API Response: should return product with correct image URL and that URL should be accessible', async () => {
    // 1. Get product from API
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    const product = res.body[0];

    // 2. Verify URL format
    expect(product.imageUrl).toBe(`/uploads/${testFileName}`);

    // 3. Verify the URL returned by the API is actually accessible
    const imageRes = await request(app).get(product.imageUrl);
    expect(imageRes.status).toBe(200);
    expect(imageRes.body).toBeInstanceOf(Buffer);
    expect(imageRes.body.toString()).toBe(testContent);
  });
});

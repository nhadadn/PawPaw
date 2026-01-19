import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import redis from '../lib/redis';

jest.mock('../lib/prisma', () => ({
  $transaction: jest.fn((callback: (tx: { $queryRaw: jest.Mock }) => unknown) => callback({ $queryRaw: jest.fn() })),
  $queryRaw: jest.fn()
}));

jest.mock('../lib/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  zadd: jest.fn(),
  zrem: jest.fn(),
  multi: jest.fn()
}));

jest.mock('../lib/stripe', () => ({
  paymentIntents: {
    retrieve: jest.fn()
  },
  webhooks: {
    constructEvent: jest.fn()
  }
}));

jest.mock('../repositories/checkout.repository', () => ({
  CheckoutRepository: jest.fn().mockImplementation(() => ({
    findVariantWithLock: jest.fn().mockResolvedValue({
      id: BigInt(1),
      product_id: BigInt(10),
      sku: 'SKU-1',
      initial_stock: 10,
      reserved_stock: 0,
      price_cents: 1000,
      currency: 'MXN',
      max_per_customer: null
    }),
    updateReservedStock: jest.fn().mockResolvedValue(undefined),
    createInventoryLog: jest.fn().mockResolvedValue(undefined),
    countUserPastPurchases: jest.fn().mockResolvedValue(0),
    createOrder: jest.fn().mockResolvedValue({ id: BigInt(1), totalCents: 1000 }),
    confirmStockDeduction: jest.fn().mockResolvedValue(undefined),
    releaseStock: jest.fn().mockResolvedValue(undefined)
  }))
}));

describe('Checkout routes', () => {
  const app = createApp();
  const token = jwt.sign({ id: 'user-123', email: 'test@example.com' }, 'changeme_jwt_secret');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/checkout/reserve returns 201 on success', async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);

    const redisMultiMock = {
      set: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue('OK')
    };
    (redis.multi as jest.Mock).mockReturnValue(redisMultiMock);

    const response = await request(app)
      .post('/api/checkout/reserve')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ product_variant_id: 1, quantity: 1 }]
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('reservation_id');
    expect(response.body.total_cents).toBe(1000);
  });

  it('GET /api/checkout/status/:reservation_id returns 200 on success', async () => {
    const reservationId = '550e8400-e29b-41d4-a716-446655440000';
    const reservationPayload = {
      reservation_id: reservationId,
      user_id: 'user-123',
      items: [],
      total_cents: 1000,
      currency: 'MXN',
      expires_at: new Date(Date.now() + 600000).toISOString()
    };

    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(reservationPayload));

    const response = await request(app)
      .get(`/api/checkout/status/${reservationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('reserved');
  });
});


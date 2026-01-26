import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import redis from '../lib/redis';
import stripe from '../lib/stripe';

jest.mock('../lib/prisma', () => ({
  $transaction: jest.fn((callback: (tx: { $queryRaw: jest.Mock }) => unknown) =>
    callback({ $queryRaw: jest.fn() })
  ),
  $queryRaw: jest.fn(),
}));

jest.mock('../lib/redis', () => ({
  get: jest.fn(),
  set: jest.fn(() => ({ catch: jest.fn() })),
  del: jest.fn(),
  keys: jest.fn().mockResolvedValue([]),
  quit: jest.fn(),
  ping: jest.fn().mockResolvedValue('PONG'),
  zadd: jest.fn(),
  zrem: jest.fn(),
  multi: jest.fn(),
}));

jest.mock('../lib/stripe', () => ({
  paymentIntents: {
    retrieve: jest.fn(),
    create: jest.fn().mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'secret_test_123',
    }),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
}));

jest.mock('../websocket/inventory.socket', () => ({
  emitStockUpdate: jest.fn(),
}));

jest.mock('../middleware/rateLimit.middleware', () => ({
  globalLimiter: (req: any, res: any, next: any) => next(),
  authLimiter: (req: any, res: any, next: any) => next(),
  checkoutLimiter: (req: any, res: any, next: any) => next(),
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
      max_per_customer: null,
    }),
    updateReservedStock: jest.fn().mockResolvedValue(undefined),
    createInventoryLog: jest.fn().mockResolvedValue(undefined),
    countUserPastPurchases: jest.fn().mockResolvedValue(0),
    createOrder: jest.fn().mockResolvedValue({ id: BigInt(1), totalCents: 1000 }),
    confirmStockDeduction: jest.fn().mockResolvedValue(undefined),
    releaseStock: jest.fn().mockResolvedValue(undefined),
    releaseReservedStock: jest.fn().mockResolvedValue({
      id: BigInt(1),
      productId: BigInt(10),
      initialStock: 10,
      reservedStock: 0,
    }),
  })),
}));

describe('Checkout routes', () => {
  const app = createApp();
  const token = jwt.sign(
    { id: 'user-123', email: 'test@example.com' },
    process.env.JWT_SECRET || 'changeme_jwt_secret'
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Ensure redis connection is closed (mocked, but good practice)
    if (redis.quit) {
      await redis.quit();
    }
  });

  it('POST /api/checkout/reserve returns 201 on success', async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);

    const redisMultiMock = {
      set: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue('OK'),
    };
    (redis.multi as jest.Mock).mockReturnValue(redisMultiMock);

    const response = await request(app)
      .post('/api/checkout/reserve')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ product_variant_id: 1, quantity: 1 }],
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
      expires_at: new Date(Date.now() + 600000).toISOString(),
    };

    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(reservationPayload));

    const response = await request(app)
      .get(`/api/checkout/status/${reservationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('active');
  });

  it('POST /api/checkout/reserve returns 409 on insufficient stock', async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);

    const redisMultiMock = {
      set: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue('OK'),
    };
    (redis.multi as jest.Mock).mockReturnValue(redisMultiMock);

    const response = await request(app)
      .post('/api/checkout/reserve')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ product_variant_id: 1, quantity: 20 }],
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('INSUFFICIENT_STOCK');
  });

  it('POST /api/checkout/confirm returns 402 when payment fails', async () => {
    const reservationId = '550e8400-e29b-41d4-a716-446655440001';
    const reservationPayload = {
      reservation_id: reservationId,
      user_id: 'user-123',
      items: [
        { product_variant_id: 1, quantity: 1, unit_price_cents: 1000, total_price_cents: 1000 },
      ],
      total_cents: 1000,
      currency: 'MXN',
      expires_at: new Date(Date.now() + 600000).toISOString(),
    };

    (redis.get as jest.Mock)
      .mockResolvedValueOnce(JSON.stringify(reservationPayload))
      .mockResolvedValueOnce(JSON.stringify(reservationPayload));

    (stripe.paymentIntents.retrieve as jest.Mock).mockResolvedValue({
      status: 'requires_payment_method',
    });

    const response = await request(app)
      .post('/api/checkout/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reservation_id: reservationId,
        payment_intent_id: 'pi_test_failed',
      });

    expect(response.status).toBe(402);
    expect(response.body.error).toBe('PAYMENT_FAILED');
  });

  it('POST /api/checkout/cancel returns 200 on success', async () => {
    const reservationId = '550e8400-e29b-41d4-a716-446655440002';
    const reservationPayload = {
      reservation_id: reservationId,
      user_id: 'user-123',
      items: [{ product_variant_id: 1, quantity: 1 }],
      total_cents: 1000,
      currency: 'MXN',
      expires_at: new Date(Date.now() + 600000).toISOString(),
    };

    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(reservationPayload));

    const response = await request(app)
      .post('/api/checkout/cancel')
      .set('Authorization', `Bearer ${token}`)
      .send({ reservation_id: reservationId });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Reservation cancelled');
  });

  it('POST /api/checkout/cancel returns 403 when user does not own reservation', async () => {
    const reservationId = '550e8400-e29b-41d4-a716-446655440003';
    const reservationPayload = {
      reservation_id: reservationId,
      user_id: 'another-user',
      items: [{ product_variant_id: 1, quantity: 1 }],
      total_cents: 1000,
      currency: 'MXN',
      expires_at: new Date(Date.now() + 600000).toISOString(),
    };

    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(reservationPayload));

    const response = await request(app)
      .post('/api/checkout/cancel')
      .set('Authorization', `Bearer ${token}`)
      .send({ reservation_id: reservationId });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('RESERVATION_USER_MISMATCH');
  });

  it('POST /api/checkout/cancel returns 200 when reservation not found', async () => {
    const reservationId = '550e8400-e29b-41d4-a716-446655440000';

    (redis.get as jest.Mock).mockResolvedValue(null);

    const response = await request(app)
      .post('/api/checkout/cancel')
      .set('Authorization', `Bearer ${token}`)
      .send({ reservation_id: reservationId });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Reservation already expired or not found');
  });

  it('respects Idempotency-Key and returns same response for repeated calls', async () => {
    const idempotencyKey = 'idem-123';

    (redis.get as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const redisMultiMock = {
      set: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue('OK'),
    };
    (redis.multi as jest.Mock).mockReturnValue(redisMultiMock);

    const firstResponse = await request(app)
      .post('/api/checkout/reserve')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        items: [{ product_variant_id: 1, quantity: 1 }],
      });

    expect(firstResponse.status).toBe(201);

    const cachedPayload = JSON.stringify({
      statusCode: firstResponse.status,
      body: firstResponse.body,
      headers: {},
    });

    (redis.get as jest.Mock).mockResolvedValueOnce(cachedPayload);

    const secondResponse = await request(app)
      .post('/api/checkout/reserve')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        items: [{ product_variant_id: 1, quantity: 1 }],
      });

    expect(secondResponse.status).toBe(firstResponse.status);
    expect(secondResponse.body).toEqual(firstResponse.body);
    expect(redis.multi as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/checkout/create-payment-intent returns 200 with client_secret', async () => {
    const reservationId = '550e8400-e29b-41d4-a716-446655440005';
    const reservationPayload = {
      reservation_id: reservationId,
      user_id: 'user-123',
      items: [],
      total_cents: 1000,
      currency: 'MXN',
      expires_at: new Date(Date.now() + 600000).toISOString(),
    };

    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(reservationPayload));

    const response = await request(app)
      .post('/api/checkout/create-payment-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ reservation_id: reservationId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('client_secret');
    expect(response.body.client_secret).toBe('secret_test_123');
  });

  it('GET /api/checkout/reservations/:id returns 200 with reservation details', async () => {
    const reservationId = '550e8400-e29b-41d4-a716-446655440006';
    const mockReservation = {
      user_id: 'user-123',
      items: [],
      total_cents: 1000,
      currency: 'MXN',
      expires_at: new Date(Date.now() + 60000).toISOString(),
    };
    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockReservation));

    const response = await request(app)
      .get(`/api/checkout/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_cents', 1000);
    expect(response.body).toHaveProperty('currency', 'MXN');
  });
});

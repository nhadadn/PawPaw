import request from 'supertest';
import express from 'express';
import redis from '../../lib/redis';
// Import router LATER after mocks are set up if needed, but here we control the mock instance.

// Global mock instance
const checkoutServiceMockInstance = {
  reserve: jest.fn(),
};

// Mock Redis
jest.mock('../../lib/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    ping: jest.fn().mockResolvedValue('PONG'),
  },
}));

// Mock CheckoutService
jest.mock('../../services/checkout.service', () => {
  return {
    CheckoutService: jest.fn().mockImplementation(() => checkoutServiceMockInstance),
  };
});

// Import router AFTER mocks (though jest.mock is hoisted, the factory is used)
import { recoveryRouter } from '../recovery.routes';

const app = express();
app.use(express.json());
app.use('/api/recovery', recoveryRouter);

describe('Recovery Routes', () => {
  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation defaults if needed
  });

  describe('POST /api/recovery/restore', () => {
    it('should restore cart with valid token', async () => {
      const token = 'valid-token';
      const reservationId = 'res-123';
      const userId = 'user-123';
      const items = [{ product_variant_id: 1, quantity: 1 }];

      // Mock Redis responses
      (redis.get as jest.Mock).mockImplementation((key) => {
        if (key === `recovery:${token}`) {
          return Promise.resolve(JSON.stringify({ reservationId, email: 'test@example.com' }));
        }
        if (key === `reservation:${reservationId}`) {
          return Promise.resolve(JSON.stringify({ user_id: userId, items }));
        }
        return Promise.resolve(null);
      });

      // Mock CheckoutService reserve
      checkoutServiceMockInstance.reserve.mockResolvedValue({
        id: 'new-res-456',
        reservation_id: 'new-res-456',
        total_cents: 1000,
        items: [
          {
            product_variant_id: 1,
            quantity: 1,
            unit_price_cents: 1000,
            total_price_cents: 1000,
            currency: 'MXN',
          },
        ],
        expires_at: new Date().toISOString(),
        currency: 'MXN',
        user_id: userId,
      });

      const res = await request(app).post('/api/recovery/restore').send({ token });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reservationId', 'new-res-456');
      expect(checkoutServiceMockInstance.reserve).toHaveBeenCalledWith(userId, items);
      expect(redis.del).toHaveBeenCalledWith(`recovery:${token}`);
    });

    it('should return 400 for invalid token', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post('/api/recovery/restore').send({ token: 'invalid-token' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'INVALID_OR_EXPIRED_TOKEN');
    });

    it('should return 400 if original reservation is gone', async () => {
      const token = 'valid-token';

      (redis.get as jest.Mock).mockImplementation((key) => {
        if (key === `recovery:${token}`) {
          return Promise.resolve(JSON.stringify({ reservationId: 'res-gone' }));
        }
        return Promise.resolve(null);
      });

      const res = await request(app).post('/api/recovery/restore').send({ token });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'RESERVATION_GONE');
    });
  });
});

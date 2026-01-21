import request from 'supertest';
import express from 'express';
import { globalLimiter, authLimiter, checkoutLimiter } from './rateLimit.middleware';

// Mock Redis to force MemoryStore behavior for tests
jest.mock('../lib/redis', () => ({
  __esModule: true,
  default: {
    call: jest.fn(),
  },
}));

describe('Rate Limit Middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
  });

  it('should apply global limiter headers', async () => {
    app.use(globalLimiter);
    app.get('/test', (req, res) => res.status(200).send('ok'));

    const res = await request(app).get('/test');
    expect(res.headers['ratelimit-limit']).toBe('100');
  });

  it('should skip global limiter for /health', async () => {
    app.use(globalLimiter);
    app.get('/health', (req, res) => res.status(200).send('ok'));

    const res = await request(app).get('/health');
    expect(res.headers['ratelimit-limit']).toBeUndefined();
  });

  it('should apply auth limiter headers', async () => {
    app.use('/auth', authLimiter);
    app.post('/auth/login', (req, res) => res.status(200).send('ok'));

    const res = await request(app).post('/auth/login');
    expect(res.headers['ratelimit-limit']).toBe('5');
  });

  it('should apply checkout limiter headers', async () => {
    app.use('/checkout', checkoutLimiter);
    app.post('/checkout/reserve', (req, res) => res.status(200).send('ok'));

    const res = await request(app).post('/checkout/reserve');
    expect(res.headers['ratelimit-limit']).toBe('10');
  });
});

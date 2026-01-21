import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../lib/redis';
import logger from '../lib/logger';

const USE_REDIS = process.env.USE_REAL_REDIS === 'true';

// Helper function to create store
const getStore = () => {
  if (USE_REDIS) {
    logger.info('Using Redis for Rate Limiting');
    return new RedisStore({
      // @ts-expect-error - ioredis types compatibility
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix: 'rl:', // Prefix for rate limit keys in Redis
    });
  }
  logger.info('Using MemoryStore for Rate Limiting');
  return undefined; // Defaults to MemoryStore
};

const store = getStore();

// 1. GLOBAL LIMITER
// 100 requests per minute per IP
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: store,
  skip: (req) => {
    // Skip health checks and metrics
    return req.path === '/health' || req.path === '/metrics';
  },
  handler: (req, res, next, options) => {
    logger.warn(`Global Rate Limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json({
      status: 'error',
      message: 'Too many requests, please try again later.',
    });
  },
});

// 2. AUTH LIMITER
// 5 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: store,
  handler: (req, res, next, options) => {
    logger.warn(`Auth Rate Limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json({
      status: 'error',
      message: 'Too many login attempts, please try again later.',
    });
  },
});

// 3. CHECKOUT LIMITER
// 10 requests per minute per IP
export const checkoutLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: store,
  handler: (req, res, next, options) => {
    logger.warn(`Checkout Rate Limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json({
      status: 'error',
      message: 'Too many checkout requests, please try again later.',
    });
  },
});

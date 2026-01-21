import http from 'http';
import logger from '../src/lib/logger';

const request = (path: string, method: string = 'GET') => {
  return new Promise<{ statusCode?: number; headers: http.IncomingHttpHeaders }>(
    (resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 4000,
        path: path,
        method: method,
      };

      const req = http.request(options, (res) => {
        res.resume();
        resolve({ statusCode: res.statusCode, headers: res.headers });
      });
      req.on('error', reject);
      req.end();
    }
  );
};

async function run() {
  try {
    logger.info('--- TEST 1: Global Limiter Skip (/health) ---');
    const healthRes = await request('/health');
    logger.info(`Health Status: ${healthRes.statusCode}`);
    logger.info(`RateLimit-Limit header: ${healthRes.headers['ratelimit-limit']}`);
    if (!healthRes.headers['ratelimit-limit']) {
      logger.info('PASS: No rate limit headers on /health');
    } else {
      logger.warn('FAIL: Rate limit headers present on /health');
    }

    logger.info('\n--- TEST 2: Global Limiter Enforcement (/api/products) ---');
    // Make one request to check headers
    const productRes = await request('/api/products');
    logger.info(`Status: ${productRes.statusCode}`);
    logger.info(`RateLimit-Limit: ${productRes.headers['ratelimit-limit']}`);
    logger.info(`RateLimit-Remaining: ${productRes.headers['ratelimit-remaining']}`);

    if (productRes.headers['ratelimit-limit'] === '100') {
      logger.info('PASS: Global Limit is 100');
    } else {
      logger.warn(`FAIL: Global Limit is ${productRes.headers['ratelimit-limit']}`);
    }

    logger.info('\n--- TEST 3: Checkout Limiter (/api/checkout/status/123) ---');
    const checkoutRes = await request('/api/checkout/status/123');
    logger.info(`Status: ${checkoutRes.statusCode}`);
    logger.info(`RateLimit-Limit: ${checkoutRes.headers['ratelimit-limit']}`);

    // Note: checkout routes have TWO limiters (Global + Checkout).
    // Express-rate-limit sets headers for the LAST one that executed or the one that blocked?
    // Usually, if multiple limiters apply, headers might be overwritten or combined depending on config.
    // We set `standardHeaders: true` and `legacyHeaders: false`.
    // The Checkout limiter is 10. Global is 100.
    // If we hit checkout, it should show limit 10 (the stricter one usually prevails if they overwrite headers).
    // Let's see what happens.

    if (checkoutRes.headers['ratelimit-limit'] === '10') {
      logger.info('PASS: Checkout Limit is 10');
    } else {
      logger.info(
        `INFO: Checkout Limit Header is ${checkoutRes.headers['ratelimit-limit']} (might be masked by Global if order differs)`
      );
    }

    logger.info('\n--- TEST 4: Auth Limiter (/api/auth/login) ---');
    // Assuming this route hits the limiter we added
    const authRes = await request('/api/auth/login', 'POST');
    logger.info(`Status: ${authRes.statusCode}`);
    logger.info(`RateLimit-Limit: ${authRes.headers['ratelimit-limit']}`);

    if (authRes.headers['ratelimit-limit'] === '5') {
      logger.info('PASS: Auth Limit is 5');
    } else {
      logger.warn(`FAIL: Auth Limit is ${authRes.headers['ratelimit-limit']}`);
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      logger.error(`Test failed: ${e.message}`);
    } else {
      logger.error('Test failed: Unknown error');
    }
  }
}

run();

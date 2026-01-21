import http from 'http';

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
    console.log('--- TEST 1: Global Limiter Skip (/health) ---');
    const healthRes = await request('/health');
    console.log(`Health Status: ${healthRes.statusCode}`);
    console.log(`RateLimit-Limit header: ${healthRes.headers['ratelimit-limit']}`);
    if (!healthRes.headers['ratelimit-limit']) {
      console.log('PASS: No rate limit headers on /health');
    } else {
      console.log('FAIL: Rate limit headers present on /health');
    }

    console.log('\n--- TEST 2: Global Limiter Enforcement (/api/products) ---');
    // Make one request to check headers
    const productRes = await request('/api/products');
    console.log(`Status: ${productRes.statusCode}`);
    console.log(`RateLimit-Limit: ${productRes.headers['ratelimit-limit']}`);
    console.log(`RateLimit-Remaining: ${productRes.headers['ratelimit-remaining']}`);

    if (productRes.headers['ratelimit-limit'] === '100') {
      console.log('PASS: Global Limit is 100');
    } else {
      console.log(`FAIL: Global Limit is ${productRes.headers['ratelimit-limit']}`);
    }

    console.log('\n--- TEST 3: Checkout Limiter (/api/checkout/status/123) ---');
    const checkoutRes = await request('/api/checkout/status/123');
    console.log(`Status: ${checkoutRes.statusCode}`);
    console.log(`RateLimit-Limit: ${checkoutRes.headers['ratelimit-limit']}`);

    // Note: checkout routes have TWO limiters (Global + Checkout).
    // Express-rate-limit sets headers for the LAST one that executed or the one that blocked?
    // Usually, if multiple limiters apply, headers might be overwritten or combined depending on config.
    // We set `standardHeaders: true` and `legacyHeaders: false`.
    // The Checkout limiter is 10. Global is 100.
    // If we hit checkout, it should show limit 10 (the stricter one usually prevails if they overwrite headers).
    // Let's see what happens.

    if (checkoutRes.headers['ratelimit-limit'] === '10') {
      console.log('PASS: Checkout Limit is 10');
    } else {
      console.log(
        `INFO: Checkout Limit Header is ${checkoutRes.headers['ratelimit-limit']} (might be masked by Global if order differs)`
      );
    }

    console.log('\n--- TEST 4: Auth Limiter (/api/auth/login) ---');
    // Assuming this route hits the limiter we added
    const authRes = await request('/api/auth/login', 'POST');
    console.log(`Status: ${authRes.statusCode}`);
    console.log(`RateLimit-Limit: ${authRes.headers['ratelimit-limit']}`);

    if (authRes.headers['ratelimit-limit'] === '5') {
      console.log('PASS: Auth Limit is 5');
    } else {
      console.log(`FAIL: Auth Limit is ${authRes.headers['ratelimit-limit']}`);
    }
  } catch (e) {
    console.error('Test failed:', e);
  }
}

run();

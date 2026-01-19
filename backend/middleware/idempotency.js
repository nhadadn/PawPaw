const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24;

function createIdempotencyMiddleware(redis) {
  return async function idempotencyMiddleware(req, res, next) {
    const key = req.header('Idempotency-Key');

    if (!key) {
      return next();
    }

    const method = req.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next();
    }

    const redisKey = `idempotency:${key}`;

    try {
      const cached = await redis.get(redisKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.headers && typeof parsed.headers === 'object') {
          Object.entries(parsed.headers).forEach(([headerName, headerValue]) => {
            if (headerName.toLowerCase() === 'content-length') {
              return;
            }
            if (headerValue !== undefined) {
              res.set(headerName, headerValue);
            }
          });
        }
        res.status(parsed.statusCode || 200);
        return res.send(parsed.body);
      }

      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      let responseBody;
      let responseStatusCode;
      let responseHeaders;

      function captureAndSave(body, sender) {
        responseStatusCode = res.statusCode;
        responseHeaders = res.getHeaders();
        responseBody = body;

        const payload = JSON.stringify({
          statusCode: responseStatusCode || 200,
          body: responseBody,
          headers: responseHeaders
        });

        redis.set(redisKey, payload, { EX: IDEMPOTENCY_TTL_SECONDS }).catch(err => {
          process.stderr.write(`Failed to persist idempotent response: ${err.message}\n`);
        });

        return sender(body);
      }

      res.json = function jsonOverride(body) {
        return captureAndSave(body, originalJson);
      };

      res.send = function sendOverride(body) {
        return captureAndSave(body, originalSend);
      };

      return next();
    } catch (err) {
      process.stderr.write(`Idempotency middleware error: ${err.message}\n`);
      return next();
    }
  };
}

module.exports = { createIdempotencyMiddleware };


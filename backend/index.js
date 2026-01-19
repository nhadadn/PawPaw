const express = require('express');
const { createPool } = require('./db');
const { client: redisClient, initRedis } = require('./redisClient');
const { createIdempotencyMiddleware } = require('./middleware/idempotency');
const { createReservationsRouter } = require('./routes/reservations');
const { startReservationExpiryScheduler } = require('./scheduler/reservationExpiry');

function createApp({ pool, redis }) {
  const app = express();
  app.use(express.json());

  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
    } catch (err) {
      return res.status(500).json({ status: 'error', postgres: false });
    }

    try {
      await redis.ping();
    } catch (err) {
      return res.status(500).json({ status: 'error', redis: false });
    }

    return res.json({ status: 'ok' });
  });

  app.use(createIdempotencyMiddleware(redis));

  app.use('/reservations', createReservationsRouter({ pool, redis }));

  return app;
}

async function bootstrap() {
  const pool = createPool();
  await initRedis();

  const app = createApp({ pool, redis: redisClient });

  startReservationExpiryScheduler({ pool, redis: redisClient });

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    process.stdout.write(`Backend listening on port ${port}\n`);
  });
}

if (require.main === module) {
  bootstrap().catch(err => {
    process.stderr.write(`Failed to start backend: ${err.message}\n`);
    process.exit(1);
  });
}

module.exports = { createApp };



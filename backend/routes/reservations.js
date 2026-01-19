const express = require('express');
const crypto = require('crypto');

const RESERVATION_TTL_SECONDS = 10 * 60;

function getUserFromRequest(req) {
  const userId = req.header('x-user-id');
  if (!userId) {
    return null;
  }
  return { userId };
}

function createReservationsRouter({ pool, redis }) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'UNAUTHENTICATED' });
    }

    const existingReservationId = await redis.get(`reservation:user:${user.userId}`);
    if (existingReservationId) {
      return res.status(409).json({ error: 'ACTIVE_RESERVATION_EXISTS' });
    }

    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (items.length === 0) {
      return res.status(400).json({ error: 'INVALID_ITEMS' });
    }

    const normalizedItems = [];

    for (const item of items) {
      const productVariantId = Number(item.productVariantId);
      const quantity = Number(item.quantity);
      if (!Number.isInteger(productVariantId) || !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'INVALID_ITEMS' });
      }
      normalizedItems.push({ productVariantId, quantity });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const item of normalizedItems) {
        const rowResult = await client.query(
          'SELECT id, available_stock FROM product_variants WHERE id = $1 FOR UPDATE',
          [item.productVariantId]
        );

        if (rowResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'PRODUCT_VARIANT_NOT_FOUND' });
        }

        const row = rowResult.rows[0];
        if (row.available_stock < item.quantity) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'INSUFFICIENT_STOCK' });
        }

        await client.query(
          'UPDATE product_variants SET reserved_stock = reserved_stock + $1 WHERE id = $2',
          [item.quantity, item.productVariantId]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      process.stderr.write(`Failed to create reservation: ${err.message}\n`);
      return res.status(500).json({ error: 'INTERNAL_ERROR' });
    } finally {
      client.release();
    }

    const reservationId = crypto.randomUUID();
    const expiresAtMs = Date.now() + RESERVATION_TTL_SECONDS * 1000;
    const reservation = {
      id: reservationId,
      userId: user.userId,
      items: normalizedItems,
      expiresAt: new Date(expiresAtMs).toISOString()
    };

    const reservationKey = `reservation:${reservationId}`;
    const userKey = `reservation:user:${user.userId}`;

    try {
      const multi = redis.multi();
      multi.set(reservationKey, JSON.stringify(reservation), { EX: RESERVATION_TTL_SECONDS });
      multi.set(userKey, reservationId, { EX: RESERVATION_TTL_SECONDS });
      multi.zAdd('reservations:by_expiry', [{ score: expiresAtMs, value: reservationId }]);
      await multi.exec();
    } catch (err) {
      process.stderr.write(`Failed to persist reservation in Redis: ${err.message}\n`);
      return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }

    return res.status(201).json({
      reservationId,
      expiresAt: reservation.expiresAt
    });
  });

  router.post('/:id/cancel', async (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'UNAUTHENTICATED' });
    }

    const reservationId = req.params.id;
    const reservationKey = `reservation:${reservationId}`;

    const stored = await redis.get(reservationKey);
    if (!stored) {
      return res.status(404).json({ error: 'RESERVATION_NOT_FOUND' });
    }

    let reservation;
    try {
      reservation = JSON.parse(stored);
    } catch (err) {
      process.stderr.write(`Failed to parse reservation payload: ${err.message}\n`);
      return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }

    if (reservation.userId !== user.userId) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const item of reservation.items || []) {
        await client.query(
          'UPDATE product_variants SET reserved_stock = reserved_stock - $1 WHERE id = $2 AND reserved_stock >= $1',
          [item.quantity, item.productVariantId]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      process.stderr.write(`Failed to cancel reservation: ${err.message}\n`);
      return res.status(500).json({ error: 'INTERNAL_ERROR' });
    } finally {
      client.release();
    }

    try {
      const multi = redis.multi();
      multi.del(reservationKey);
      multi.del(`reservation:user:${user.userId}`);
      multi.zRem('reservations:by_expiry', reservationId);
      await multi.exec();
    } catch (err) {
      process.stderr.write(`Failed to clean reservation keys in Redis: ${err.message}\n`);
      return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }

    return res.status(200).json({ status: 'CANCELLED' });
  });

  return router;
}

module.exports = { createReservationsRouter };


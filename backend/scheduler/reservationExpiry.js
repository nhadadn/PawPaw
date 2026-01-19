async function releaseExpiredReservation(pool, redis, reservationId, reservation) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const item of reservation.items || []) {
      await client.query(
        'UPDATE product_variants SET reserved_stock = reserved_stock - $1 WHERE id = $2 AND reserved_stock >= $1',
        [item.quantity, item.productVariantId]
      );
      await client.query(
        'INSERT INTO inventory_logs (product_variant_id, order_id, change_type, quantity_diff) VALUES ($1, NULL, $2, $3)',
        [item.productVariantId, 'release_expired', item.quantity]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    process.stderr.write(`Failed to release expired reservation ${reservationId}: ${err.message}\n`);
    throw err;
  } finally {
    client.release();
  }

  try {
    const multi = redis.multi();
    multi.del(`reservation:${reservationId}`);
    if (reservation.userId) {
      multi.del(`reservation:user:${reservation.userId}`);
    }
    multi.zRem('reservations:by_expiry', reservationId);
    await multi.exec();
  } catch (err) {
    process.stderr.write(`Failed to clean expired reservation keys ${reservationId}: ${err.message}\n`);
  }
}

function startReservationExpiryScheduler({ pool, redis }) {
  const intervalMs = Number(process.env.RESERVATION_SWEEP_INTERVAL_MS) || 60 * 1000;

  async function sweepOnce() {
    const now = Date.now();
    let ids;

    try {
      ids = await redis.zRangeByScore('reservations:by_expiry', 0, now);
    } catch (err) {
      process.stderr.write(`Failed to read reservations:by_expiry: ${err.message}\n`);
      return;
    }

    if (!ids || ids.length === 0) {
      return;
    }

    for (const reservationId of ids) {
      const key = `reservation:${reservationId}`;

      let payload;
      try {
        payload = await redis.get(key);
      } catch (err) {
        process.stderr.write(`Failed to read reservation ${reservationId}: ${err.message}\n`);
        continue;
      }

      if (!payload) {
        try {
          await redis.zRem('reservations:by_expiry', reservationId);
        } catch (err) {
          process.stderr.write(`Failed to remove missing reservation ${reservationId} from index: ${err.message}\n`);
        }
        continue;
      }

      let reservation;
      try {
        reservation = JSON.parse(payload);
      } catch (err) {
        process.stderr.write(`Failed to parse reservation ${reservationId}: ${err.message}\n`);
        continue;
      }

      try {
        await releaseExpiredReservation(pool, redis, reservationId, reservation);
      } catch (err) {
        continue;
      }
    }
  }

  sweepOnce().catch(err => {
    process.stderr.write(`Initial reservation sweep failed: ${err.message}\n`);
  });

  setInterval(() => {
    sweepOnce().catch(err => {
      process.stderr.write(`Reservation sweep failed: ${err.message}\n`);
    });
  }, intervalMs);
}

module.exports = { startReservationExpiryScheduler };


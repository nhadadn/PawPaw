import cron from 'node-cron';
import redis from '../lib/redis';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { InventoryChangeType } from '@prisma/client';

export async function processExpiredReservationsOnce(): Promise<void> {
  const now = Date.now();

  try {
    const expiredReservationIds = await redis.zrangebyscore('reservations:by_expiry', 0, now);

    if (expiredReservationIds.length === 0) {
      return;
    }

    logger.info(`Found ${expiredReservationIds.length} expired reservations`);

    for (const reservationId of expiredReservationIds) {
      try {
        const rawReservation = await redis.get(`reservation:${reservationId}`);

        if (!rawReservation) {
          await redis.zrem('reservations:by_expiry', reservationId);
          continue;
        }

        const reservation = JSON.parse(rawReservation) as {
          user_id: string;
          items: { product_variant_id: number; quantity: number }[];
        };

        await prisma.$transaction(async (tx) => {
          for (const item of reservation.items) {
            await tx.productVariant.update({
              where: { id: BigInt(item.product_variant_id) },
              data: {
                reservedStock: { decrement: item.quantity },
              },
            });

            await tx.inventoryLog.create({
              data: {
                productVariantId: BigInt(item.product_variant_id),
                changeType: InventoryChangeType.RELEASE_EXPIRED,
                quantityDiff: item.quantity,
              },
            });
          }
        });

        // Remove from expiry queue but KEEP the data for abandoned cart recovery
        // The data will expire naturally via Redis TTL (24h) or be processed by recovery service
        await redis.zrem('reservations:by_expiry', reservationId);

        // Add to a set of potential abandoned carts to scan
        await redis.sadd('reservations:abandoned', reservationId);

        logger.info(`Expired reservation ${reservationId} released and marked for recovery check`);
      } catch (err) {
        logger.error(`Failed to process expired reservation ${reservationId}`, { error: err });
      }
    }
  } catch (error) {
    logger.error('Reservation expiry job failed', { error });
  }
}

export function startExpirationScheduler(): void {
  // Every 60 seconds
  cron.schedule('*/1 * * * *', () => {
    logger.info('Running reservation expiry job');
    void processExpiredReservationsOnce();
  });
}

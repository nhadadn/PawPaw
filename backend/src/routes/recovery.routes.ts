import { Request, Response, Router } from 'express';
import { CheckoutService } from '../services/checkout.service';
import redis from '../lib/redis';
import { logger } from '../lib/logger';

export const recoveryRouter = Router();
const checkoutService = new CheckoutService();

recoveryRouter.post('/restore', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'TOKEN_REQUIRED' });
    }

    // 1. Validate token
    const rawData = await redis.get(`recovery:${token}`);
    if (!rawData) {
      return res.status(400).json({ error: 'INVALID_OR_EXPIRED_TOKEN' });
    }

    const { reservationId } = JSON.parse(rawData);

    // 2. Check if original reservation data still exists (it should, due to our extended TTL)
    const rawReservation = await redis.get(`reservation:${reservationId}`);
    if (!rawReservation) {
      return res.status(400).json({ error: 'RESERVATION_GONE' });
    }

    const oldReservation = JSON.parse(rawReservation);

    // 3. Re-create reservation (new ID, new expiration)
    // This uses the existing logic which handles stock checks etc.
    // We assume the items are still available or we try to reserve them again.
    const newReservation = await checkoutService.reserve(
      oldReservation.user_id,
      oldReservation.items
    );

    // 4. Invalidate recovery token
    await redis.del(`recovery:${token}`);

    logger.info(`[Recovery] Cart restored for user ${oldReservation.user_id}`);

    return res.json({
      message: 'Cart restored successfully',
      reservationId: newReservation.reservation_id, // Return new reservation ID
    });
  } catch (error) {
    logger.error('[Recovery] Restore failed', { error });
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
});

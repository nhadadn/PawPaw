import redis from '../lib/redis';
import logger from '../lib/logger';
import prisma from '../lib/prisma';
import { CheckoutService } from './checkout.service';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

interface ReservationItem {
  product_variant_id: number;
  quantity: number;
}

interface ReservationPayload {
  id: string;
  reservation_id: string;
  user_id: string;
  email?: string;
  items: ReservationItem[];
  total_cents: number;
  currency: string;
  expires_at: string;
}

export class AbandonedCartRecoveryService {
  private checkoutService: CheckoutService;
  private transporter: nodemailer.Transporter;

  constructor() {
    this.checkoutService = new CheckoutService();
    // Initialize email transporter (configure with env vars in production)
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'ethereal_user',
        pass: process.env.EMAIL_PASS || 'ethereal_pass',
      },
    });
  }

  /**
   * Scans for expired reservations that are candidates for recovery.
   * Logic:
   * 1. Get all IDs from 'reservations:abandoned' set.
   * 2. Filter those that expired between 10 mins ago and 70 mins ago.
   * 3. Send email if not already notified.
   */
  async scanExpiredReservations(): Promise<void> {
    try {
      const now = Date.now();
      const tenMinutesAgo = now - 10 * 60 * 1000;
      const seventyMinutesAgo = now - 70 * 60 * 1000;

      // Get all candidate reservation IDs
      const candidateIds = await redis.smembers('reservations:abandoned');

      for (const reservationId of candidateIds) {
        // Check if already notified
        const isNotified = await redis.get(`notified:${reservationId}`);
        if (isNotified) {
          // Cleanup from set if already notified
          await redis.srem('reservations:abandoned', reservationId);
          continue;
        }

        // Get reservation details
        const rawReservation = await redis.get(`reservation:${reservationId}`);
        if (!rawReservation) {
          // Data gone, remove from set
          await redis.srem('reservations:abandoned', reservationId);
          continue;
        }

        const reservation = JSON.parse(rawReservation);
        const expiresAt = new Date(reservation.expires_at).getTime();

        // Check if it fits the time window (expired between 10m and 70m ago)
        // expiresAt is when it expired.
        // We want: expiresAt < tenMinutesAgo && expiresAt > seventyMinutesAgo
        if (expiresAt < tenMinutesAgo && expiresAt > seventyMinutesAgo) {
          // Process recovery
          // Check if email is in reservation or resolve it
          const email = reservation.email || (await this.resolveEmail(reservation.user_id));

          if (email) {
            const token = await this.generateRecoveryToken(reservationId, email);
            await this.sendRecoveryEmail(email, token, reservation);
            await this.markAsNotified(reservationId);
            logger.info(`[Recovery] Sent email for reservation ${reservationId}`);
          } else {
            logger.warn(`[Recovery] No email found for user ${reservation.user_id}`);
          }
        } else if (expiresAt < seventyMinutesAgo) {
          // Too old, just remove from set
          await redis.srem('reservations:abandoned', reservationId);
        }
        // If > tenMinutesAgo (expired very recently), keep in set for next scan
      }
    } catch (error) {
      logger.error('[Recovery] Scan failed', { error });
    }
  }

  private async generateRecoveryToken(reservationId: string, email: string): Promise<string> {
    const token = uuidv4();
    // Store token with 24h TTL
    await redis.set(
      `recovery:${token}`,
      JSON.stringify({ reservationId, email }),
      'EX',
      86400 // 24 hours
    );
    return token;
  }

  private async sendRecoveryEmail(
    email: string,
    token: string,
    reservation: ReservationPayload
  ): Promise<void> {
    const recoveryLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/recover?token=${token}`;

    // Simple HTML template
    const html = `
      <h1>¡No pierdas tu carrito!</h1>
      <p>Notamos que dejaste items en tu carrito. Aún están disponibles.</p>
      <ul>
        ${reservation.items
          .map((i: ReservationItem) => `<li>Product ${i.product_variant_id} x${i.quantity}</li>`)
          .join('')}
      </ul>
      <p>Total: $${(reservation.total_cents / 100).toFixed(2)} ${reservation.currency}</p>
      <a href="${recoveryLink}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none;">Restaurar Carrito</a>
      <br><br>
      <small><a href="${process.env.FRONTEND_URL}/unsubscribe">No recibir más emails</a></small>
    `;

    await this.transporter.sendMail({
      from: '"PawPaw Store" <noreply@pawpaw.com>',
      to: email,
      subject: 'Recupera tu carrito de compras',
      html,
    });
  }

  private async markAsNotified(reservationId: string): Promise<void> {
    // Mark as notified for 7 days to prevent duplicates
    await redis.set(`notified:${reservationId}`, 'true', 'EX', 7 * 24 * 60 * 60);
    // Remove from candidate set
    await redis.srem('reservations:abandoned', reservationId);
  }

  private async resolveEmail(userId: string): Promise<string | null> {
    if (!userId || userId.startsWith('guest:')) return null;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      return user?.email || null;
    } catch (error) {
      logger.warn(`[Recovery] Failed to resolve email for user ${userId}`, { error });
      return null;
    }
  }
}

export const recoveryService = new AbandonedCartRecoveryService();

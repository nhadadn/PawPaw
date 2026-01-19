import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import redis from '../lib/redis';
import stripe from '../lib/stripe';
import { CheckoutRepository } from '../repositories/checkout.repository';
import { CheckoutError } from '../utils/errors';
import logger from '../lib/logger';

const RESERVATION_TTL = 600; // 10 minutes

export class CheckoutService {
  private repo: CheckoutRepository;

  constructor() {
    this.repo = new CheckoutRepository();
  }

  async reserve(userId: string, items: { product_variant_id: number; quantity: number }[]) {
    // 1. Check active reservation
    const existingReservation = await redis.get(`reservation:user:${userId}`);
    if (existingReservation) {
      throw new CheckoutError('ACTIVE_RESERVATION_EXISTS', 'User already has an active reservation');
    }

    // 2. Transaction
    const reservationItems: {
      product_variant_id: number;
      quantity: number;
      unit_price_cents: number;
      total_price_cents: number;
      currency: string;
    }[] = [];
    let totalCents = 0;
    let currency = 'MXN';

    try {
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          const variant = await this.repo.findVariantWithLock(tx, item.product_variant_id);
          
          if (!variant) {
            throw new CheckoutError('PRODUCT_VARIANT_NOT_FOUND', `Variant ${item.product_variant_id} not found`);
          }

          // Calculate available stock
          const availableStock = variant.initial_stock - variant.reserved_stock;
          if (availableStock < item.quantity) {
             throw new CheckoutError('INSUFFICIENT_STOCK', `Insufficient stock for variant ${item.product_variant_id}`);
          }

          // Check Max Per Customer
          if (variant.max_per_customer) {
            const pastPurchases = await this.repo.countUserPastPurchases(tx, userId, variant.product_id);
            if (pastPurchases + item.quantity > variant.max_per_customer) {
              throw new CheckoutError('MAX_PER_CUSTOMER_EXCEEDED', `Limit of ${variant.max_per_customer} exceeded for product`);
            }
          }

          // Reserve
          await this.repo.updateReservedStock(tx, Number(variant.id), item.quantity);
          
          // Log
          await this.repo.createInventoryLog(tx, {
            productVariantId: Number(variant.id),
            changeType: 'reserve',
            quantityDiff: item.quantity 
          });

          reservationItems.push({
             product_variant_id: Number(variant.id),
             quantity: item.quantity,
             unit_price_cents: variant.price_cents,
             total_price_cents: variant.price_cents * item.quantity,
             currency: variant.currency
          });
          
          totalCents += variant.price_cents * item.quantity;
          currency = variant.currency;
        }
      });
    } catch (error) {
        if (error instanceof CheckoutError) throw error;
        logger.error('Reservation transaction failed', { error });
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error('Transaction failed: ' + message);
    }

    // 3. Redis
    const reservationId = uuidv4();
    const expiresAt = new Date(Date.now() + RESERVATION_TTL * 1000);
    
    const payload = {
      reservation_id: reservationId,
      user_id: userId,
      items: reservationItems,
      total_cents: totalCents,
      currency,
      expires_at: expiresAt.toISOString()
    };

    await redis.multi()
      .set(`reservation:${reservationId}`, JSON.stringify(payload), 'EX', RESERVATION_TTL)
      .set(`reservation:user:${userId}`, reservationId, 'EX', RESERVATION_TTL)
      .zadd('reservations:by_expiry', expiresAt.getTime(), reservationId)
      .exec();

    logger.info('Reservation created', { reservation_id: reservationId, user_id: userId });

    return payload;
  }

  async confirm(userId: string, reservationId: string, paymentIntentId: string) {
      // 1. Get Reservation
      const rawReservation = await redis.get(`reservation:${reservationId}`);
      if (!rawReservation) {
          throw new CheckoutError('RESERVATION_NOT_FOUND', 'Reservation not found or expired');
      }
      const reservation = JSON.parse(rawReservation);

      if (reservation.user_id !== userId) {
          throw new CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation belongs to another user');
      }

      // 2. Validate Stripe
      let paymentIntent;
      try {
          paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } catch (e) {
          throw new CheckoutError('PAYMENT_FAILED', 'Invalid Payment Intent');
      }

      if (paymentIntent.status !== 'succeeded') {
          // If payment failed, we release stock as per prompt requirements
          await this.cancel(userId, reservationId);
          throw new CheckoutError('PAYMENT_FAILED', `Payment status is ${paymentIntent.status}`);
      }

      // 3. Create Order & Update Stock
      let order;
      try {
          order = await prisma.$transaction(async (tx) => {
              // Create Order
              const newOrder = await this.repo.createOrder(tx, {
                  userId,
                  totalCents: reservation.total_cents,
                  currency: reservation.currency,
                  stripePaymentIntentId: paymentIntentId,
                  items: reservation.items.map((i: {
                    product_variant_id: number;
                    quantity: number;
                    unit_price_cents: number;
                    total_price_cents: number;
                  }) => ({
                    productVariantId: i.product_variant_id,
                    quantity: i.quantity,
                    unitPriceCents: i.unit_price_cents,
                    totalPriceCents: i.total_price_cents
                  }))
              });

              // Update Stock (Permanent deduction)
              for (const item of reservation.items) {
                  await this.repo.confirmStockDeduction(tx, item.product_variant_id, item.quantity);
                  await this.repo.createInventoryLog(tx, {
                      productVariantId: item.product_variant_id,
                      changeType: 'checkout_confirmed',
                      quantityDiff: -item.quantity,
                      orderId: Number(newOrder.id)
                  });
              }
              
              return newOrder;
          });
      } catch (e) {
          logger.error('Order creation failed', { error: e });
          throw new Error('Order creation failed');
      }

      // 4. Cleanup Redis
      await redis.del(`reservation:${reservationId}`);
      await redis.del(`reservation:user:${userId}`);
      await redis.zrem('reservations:by_expiry', reservationId);

      return {
          order_id: order.id.toString(),
          order_number: order.id.toString(), // Assuming ID is order number for now
          status: 'paid',
          total_cents: order.totalCents
      };
  }

  async cancel(userId: string | null, reservationId: string) {
      const rawReservation = await redis.get(`reservation:${reservationId}`);
      if (!rawReservation) {
           throw new CheckoutError('RESERVATION_NOT_FOUND', 'Reservation not found');
      }
      const reservation = JSON.parse(rawReservation);

      if (userId && reservation.user_id !== userId) {
           throw new CheckoutError('RESERVATION_USER_MISMATCH', 'Mismatch');
      }

      // Release stock
      await prisma.$transaction(async (tx) => {
          for (const item of reservation.items) {
              await this.repo.releaseStock(tx, item.product_variant_id, item.quantity);
              await this.repo.createInventoryLog(tx, {
                  productVariantId: item.product_variant_id,
                  changeType: 'release',
                  quantityDiff: item.quantity 
              });
          }
      });

      // Cleanup
      await redis.del(`reservation:${reservationId}`);
      await redis.del(`reservation:user:${reservation.user_id}`);
      await redis.zrem('reservations:by_expiry', reservationId);
      
      return { status: 'cancelled', stock_released: true };
  }

  async getStatus(userId: string, reservationId: string) {
      const rawReservation = await redis.get(`reservation:${reservationId}`);
      if (!rawReservation) {
          throw new CheckoutError('RESERVATION_NOT_FOUND', 'Reservation not found');
      }

      const reservation = JSON.parse(rawReservation);

      if (reservation.user_id !== userId) {
          throw new CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation belongs to another user');
      }

      const expiresAt = new Date(reservation.expires_at);
      const now = new Date();

      if (expiresAt.getTime() <= now.getTime()) {
          throw new CheckoutError('RESERVATION_EXPIRED', 'Reservation expired');
      }

      return {
          reservation_id: reservation.reservation_id,
          user_id: reservation.user_id,
          items: reservation.items,
          total_cents: reservation.total_cents,
          currency: reservation.currency,
          expires_at: reservation.expires_at,
          status: 'reserved'
      };
  }
}

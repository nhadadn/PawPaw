import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import redis from '../lib/redis';
import stripe from '../lib/stripe';
import { CheckoutRepository } from '../repositories/checkout.repository';
import { CheckoutError } from '../utils/errors';
import logger from '../lib/logger';

const RESERVATION_TTL = 600; // 10 minutes
const REDIS_PERSISTENCE_TTL = 86400; // 24 hours

import { Prisma, InventoryChangeType } from '@prisma/client';

import { emitStockUpdate } from '../websocket/inventory.socket';

export class CheckoutService {
  private repo: CheckoutRepository;

  constructor() {
    this.repo = new CheckoutRepository();
  }

  async reserve(
    userId: string,
    items: { product_variant_id: number; quantity: number }[],
    email?: string
  ) {
    // For guests, we use the generated guest ID.
    const existingReservation = await redis.get(`reservation:user:${userId}`);
    if (existingReservation) {
      throw new CheckoutError(
        'ACTIVE_RESERVATION_EXISTS',
        'User already has an active reservation'
      );
    }

    // Resolve email for registered users if not provided
    let resolvedEmail = email;
    if (!resolvedEmail && !userId.startsWith('guest:')) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        if (user) {
          resolvedEmail = user.email;
        }
      } catch (error) {
        logger.warn(`Failed to fetch email for user ${userId}`, { error });
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new CheckoutError('INVALID_REQUEST', 'Items must be a non-empty array');
    }

    for (const item of items) {
      if (
        !item ||
        typeof item.product_variant_id !== 'number' ||
        !Number.isInteger(item.product_variant_id) ||
        item.product_variant_id <= 0
      ) {
        throw new CheckoutError('INVALID_REQUEST', 'product_variant_id must be a positive integer');
      }

      if (
        typeof item.quantity !== 'number' ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        throw new CheckoutError('INVALID_REQUEST', 'quantity must be a positive integer');
      }
    }

    const reservationItems: {
      product_variant_id: number;
      quantity: number;
      unit_price_cents: number;
      total_price_cents: number;
      currency: string;
    }[] = [];
    let totalCents = 0;
    let currency = 'MXN';

    const reservationId = uuidv4();
    const expiresAt = new Date(Date.now() + RESERVATION_TTL * 1000);

    try {
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          const variant = await this.repo.findVariantWithLock(tx, item.product_variant_id);

          if (!variant) {
            throw new CheckoutError(
              'PRODUCT_VARIANT_NOT_FOUND',
              `Variant ${item.product_variant_id} not found`
            );
          }

          // Calculate available stock
          const availableStock = variant.initial_stock - variant.reserved_stock;
          if (availableStock < item.quantity) {
            throw new CheckoutError(
              'INSUFFICIENT_STOCK',
              `Insufficient stock for variant ${item.product_variant_id}`
            );
          }

          // Check Max Per Customer (Skip for guests for now, or handle by IP later)
          if (variant.max_per_customer && !userId.startsWith('guest:')) {
            const pastPurchases = await this.repo.countUserPastPurchases(
              tx,
              userId,
              variant.product_id
            );
            if (pastPurchases + item.quantity > variant.max_per_customer) {
              throw new CheckoutError(
                'MAX_PER_CUSTOMER_EXCEEDED',
                `Limit of ${variant.max_per_customer} exceeded for product`
              );
            }
          }

          // Reserve
          await this.repo.updateReservedStock(tx, Number(variant.id), item.quantity);

          // Log
          await this.repo.createInventoryLog(tx, {
            productVariantId: Number(variant.id),
            changeType: InventoryChangeType.RESERVE,
            quantityDiff: item.quantity,
          });

          reservationItems.push({
            product_variant_id: Number(variant.id),
            quantity: item.quantity,
            unit_price_cents: variant.price_cents,
            total_price_cents: variant.price_cents * item.quantity,
            currency: variant.currency,
          });

          totalCents += variant.price_cents * item.quantity;
          currency = variant.currency;
        }
      });
    } catch (error) {
      if (error instanceof CheckoutError) throw error;
      console.error('DEBUG ERROR:', error);
      logger.error('Reservation transaction failed', {
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        error,
      });
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Transaction failed: ' + message);
    }

    // 3. Save to Redis
    const payload = {
      id: reservationId,
      reservation_id: reservationId,
      user_id: userId,
      email: resolvedEmail,
      items: reservationItems,
      total_cents: totalCents,
      currency,
      expires_at: expiresAt.toISOString(),
      // client_secret will be generated in createPaymentIntent
    };

    // Store in Redis with 24h TTL to allow for abandoned cart recovery
    // The logical expiration (stock release) is handled by 'reservations:by_expiry' and the scheduler
    const REDIS_PERSISTENCE_TTL = 86400; // 24 hours

    await redis
      .multi()
      .set(`reservation:${reservationId}`, JSON.stringify(payload), 'EX', REDIS_PERSISTENCE_TTL)
      .set(`reservation:user:${userId}`, reservationId, 'EX', REDIS_PERSISTENCE_TTL)
      .zadd('reservations:by_expiry', expiresAt.getTime(), reservationId)
      .exec();

    logger.info('Reservation created', { reservation_id: reservationId, user_id: userId });

    return payload;
  }

  async createPaymentIntent(userId: string | null, reservationId: string) {
    // 1. Get Reservation
    const rawReservation = await redis.get(`reservation:${reservationId}`);
    if (!rawReservation) {
      throw new CheckoutError('RESERVATION_NOT_FOUND', 'Reservation not found or expired');
    }
    const reservation = JSON.parse(rawReservation);

    // Validate ownership
    if (userId && reservation.user_id !== userId) {
      // Allow claiming if it's a guest reservation
      if (reservation.user_id.startsWith('guest:')) {
        logger.info(`User ${userId} claiming guest reservation ${reservation.user_id}`);
        reservation.user_id = userId;

        // If PI already exists, we need to persist the claim NOW because we might return early
        if (reservation.payment_intent_id && reservation.client_secret) {
          // Keep the 24h TTL for persistence, do not downgrade to remaining reservation time
          await redis.set(
            `reservation:${reservationId}`,
            JSON.stringify(reservation),
            'EX',
            REDIS_PERSISTENCE_TTL
          );
        }
      } else {
        throw new CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation belongs to another user');
      }
    }

    if (!userId && !reservation.user_id.startsWith('guest:')) {
      throw new CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation requires authentication');
    }

    // Check if PI already exists in reservation data to avoid duplicates (Idempotency)
    if (reservation.payment_intent_id && reservation.client_secret) {
      return {
        client_secret: reservation.client_secret,
        payment_intent_id: reservation.payment_intent_id,
        amount: reservation.total_cents,
        currency: reservation.currency,
      };
    }

    // 2. Create Stripe Payment Intent
    let clientSecret: string;
    let paymentIntentId: string;

    if (process.env.STRIPE_SECRET_KEY?.includes('replace_me')) {
      logger.warn('Using MOCK Stripe Payment Intent due to dummy key');
      paymentIntentId = `pi_mock_${reservationId}`;
      clientSecret = `${paymentIntentId}_secret_mock`;
    } else {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: reservation.total_cents,
          currency: reservation.currency,
          automatic_payment_methods: { enabled: true },
          metadata: {
            reservation_id: reservationId,
            user_id: reservation.user_id,
          },
        });
        if (!paymentIntent.client_secret) {
          throw new Error('Missing client_secret from Stripe');
        }
        clientSecret = paymentIntent.client_secret;
        paymentIntentId = paymentIntent.id;
      } catch (error) {
        logger.error('Stripe payment intent creation failed', {
          message: error instanceof Error ? error.message : 'Unknown',
          error,
        });
        throw new CheckoutError('PAYMENT_FAILED', 'Failed to initialize payment');
      }
    }

    // 3. Update Redis with PI details
    reservation.client_secret = clientSecret;
    reservation.payment_intent_id = paymentIntentId;

    // Calculate remaining TTL
    // FIX: Use REDIS_PERSISTENCE_TTL to ensure data survives for confirmation and recovery
    // even if the stock reservation expires.
    await redis.set(
      `reservation:${reservationId}`,
      JSON.stringify(reservation),
      'EX',
      REDIS_PERSISTENCE_TTL
    );

    return {
      client_secret: clientSecret,
      payment_intent_id: paymentIntentId,
      amount: reservation.total_cents,
      currency: reservation.currency,
    };
  }

  async confirm(
    userId: string | null,
    reservationId: string,
    paymentIntentId: string,
    email?: string,
    tx?: Prisma.TransactionClient
  ) {
    // 1. Get Reservation
    const rawReservation = await redis.get(`reservation:${reservationId}`);
    if (!rawReservation) {
      throw new CheckoutError('RESERVATION_NOT_FOUND', 'Reservation not found or expired');
    }
    const reservation = JSON.parse(rawReservation);

    // Validate ownership
    // If user is authenticated, must match reservation.user_id
    // If user is guest, reservation.user_id must be guest (and we rely on reservationId secrecy)
    if (userId && reservation.user_id !== userId) {
      throw new CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation belongs to another user');
    }

    // If anonymous, ensure reservation is for a guest
    if (!userId && !reservation.user_id.startsWith('guest:')) {
      throw new CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation requires authentication');
    }

    // 2. Validate Stripe
    let paymentIntent;

    if (paymentIntentId.startsWith('pi_mock_')) {
      // MOCK MODE: Skip Stripe validation
      logger.warn('Skipping Stripe validation for MOCK payment intent', { paymentIntentId });
      paymentIntent = {
        id: paymentIntentId,
        status: 'succeeded',
        receipt_email: email || 'guest@mock.com',
      };
    } else {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } catch (_e) {
        throw new CheckoutError('PAYMENT_FAILED', 'Invalid Payment Intent');
      }

      if (paymentIntent.status !== 'succeeded') {
        // If payment failed, we release stock as per prompt requirements
        await this.cancel(reservation.user_id, reservationId);
        throw new CheckoutError('PAYMENT_FAILED', `Payment status is ${paymentIntent.status}`);
      }
    }

    // 3. Create Order & Update Stock
    const executeTransaction = async (trx: Prisma.TransactionClient) => {
      // Create Order
      const newOrder = await this.repo.createOrder(trx, {
        userId: userId || undefined, // undefined if guest
        guestEmail: !userId ? email || paymentIntent.receipt_email || undefined : undefined,
        totalCents: reservation.total_cents,
        currency: reservation.currency,
        stripePaymentIntentId: paymentIntentId,
        items: reservation.items.map(
          (i: {
            product_variant_id: number;
            quantity: number;
            unit_price_cents: number;
            total_price_cents: number;
          }) => ({
            productVariantId: i.product_variant_id,
            quantity: i.quantity,
            unitPriceCents: i.unit_price_cents,
            totalPriceCents: i.total_price_cents,
          })
        ),
      });

      // Update Stock (Permanent deduction)
      for (const item of reservation.items) {
        await this.repo.confirmStockDeduction(trx, item.product_variant_id, item.quantity);
        await this.repo.createInventoryLog(trx, {
          productVariantId: item.product_variant_id,
          changeType: InventoryChangeType.CHECKOUT_CONFIRMED,
          quantityDiff: -item.quantity,
          orderId: Number(newOrder.id),
        });
      }

      return newOrder;
    };

    let order;
    try {
      if (tx) {
        order = await executeTransaction(tx);
      } else {
        order = await prisma.$transaction(executeTransaction);
      }
    } catch (e) {
      logger.error('Order creation failed', { error: e });
      throw new Error('Order creation failed');
    }

    // 4. Cleanup Redis
    await redis.del(`reservation:${reservationId}`);
    await redis.del(`reservation:user:${reservation.user_id}`);
    await redis.zrem('reservations:by_expiry', reservationId);

    return {
      id: order.id.toString(),
      order_number: order.id.toString(),
      status: 'paid', // Frontend expects lowercase 'paid' based on type definition? No, type says 'paid' | 'pending'...
      // But OrderStatus enum is usually uppercase. Let's check frontend type again.
      // Frontend type: status: 'pending' | 'paid' | 'cancelled' | 'shipped';
      // Backend OrderStatus: PAID.
      // So I should convert to lowercase.
      total_amount: order.totalCents / 100, // Convert to main currency unit
      created_at: order.createdAt.toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: order.items.map((item: any) => ({
        id: item.id.toString(),
        product_variant_id: item.productVariantId.toString(),
        quantity: item.quantity,
        price: item.unitPriceCents,
        name: item.productVariant.product.name,
      })),
    };
  }

  async cancel(userId: string | null, reservationId: string, tx?: Prisma.TransactionClient) {
    const rawReservation = await redis.get(`reservation:${reservationId}`);
    if (!rawReservation) {
      return { message: 'Reservation already expired or not found' };
    }
    const reservation = JSON.parse(rawReservation);

    // Validate ownership
    if (userId && reservation.user_id !== userId) {
      throw new CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation belongs to another user');
    }

    // If anonymous, ensure reservation is for a guest
    if (!userId && !reservation.user_id.startsWith('guest:')) {
      throw new CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation requires authentication');
    }

    // Release Stock
    const executeTransaction = async (trx: Prisma.TransactionClient) => {
      for (const item of reservation.items) {
        const updatedVariant = await this.repo.releaseReservedStock(
          trx,
          item.product_variant_id,
          item.quantity
        );

        if (!updatedVariant) {
          logger.warn(
            `Failed to release stock for variant ${item.product_variant_id}: Variant not found`
          );
          continue;
        }

        // Emit real-time stock update
        const available = updatedVariant.initialStock - updatedVariant.reservedStock;
        emitStockUpdate(Number(updatedVariant.productId), available);

        await this.repo.createInventoryLog(trx, {
          productVariantId: item.product_variant_id,
          changeType: InventoryChangeType.RELEASE,
          quantityDiff: -item.quantity,
        });
      }
    };

    if (tx) {
      await executeTransaction(tx);
    } else {
      await prisma.$transaction(executeTransaction);
    }

    // Cleanup Redis
    await redis.del(`reservation:${reservationId}`);
    await redis.del(`reservation:user:${reservation.user_id}`);
    await redis.zrem('reservations:by_expiry', reservationId);

    return { message: 'Reservation cancelled' };
  }

  async getReservation(userId: string | null, reservationId: string) {
    const rawReservation = await redis.get(`reservation:${reservationId}`);
    if (!rawReservation) {
      throw new CheckoutError('RESERVATION_NOT_FOUND', 'Reservation not found or expired');
    }
    const reservation = JSON.parse(rawReservation);

    if (userId && reservation.user_id !== userId) {
      throw new CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation belongs to another user');
    }

    // If anonymous, ensure reservation is for a guest
    if (!userId && !reservation.user_id.startsWith('guest:')) {
      throw new CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation requires authentication');
    }

    return reservation;
  }

  async getStatus(userId: string | null, reservationId: string) {
    const rawReservation = await redis.get(`reservation:${reservationId}`);
    if (!rawReservation) {
      return { status: 'expired' };
    }
    const reservation = JSON.parse(rawReservation);

    if (userId && reservation.user_id !== userId) {
      throw new CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation belongs to another user');
    }

    // If anonymous, ensure reservation is for a guest
    if (!userId && !reservation.user_id.startsWith('guest:')) {
      throw new CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation requires authentication');
    }

    return {
      status: 'active',
      expires_at: reservation.expires_at,
      seconds_remaining: Math.floor(
        (new Date(reservation.expires_at).getTime() - Date.now()) / 1000
      ),
    };
  }
}

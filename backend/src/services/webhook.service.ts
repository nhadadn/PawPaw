import Stripe from 'stripe';
import { Prisma, OrderStatus, InventoryChangeType } from '@prisma/client';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { CheckoutService } from './checkout.service';
import { InventoryService } from './inventory.service';

export class WebhookService {
  private checkoutService: CheckoutService;
  private inventoryService: InventoryService;

  constructor() {
    this.checkoutService = new CheckoutService();
    this.inventoryService = new InventoryService();
  }

  async handleEvent(event: Stripe.Event) {
    try {
      await this.processIdempotent(event, async (tx) => {
        switch (event.type) {
          case 'payment_intent.succeeded':
            await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent, tx);
            break;
          case 'payment_intent.payment_failed':
          case 'payment_intent.canceled':
            await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent, tx);
            break;
          default:
            logger.info(`Unhandled Stripe event type: ${event.type}`);
        }
      });
    } catch (error) {
      // This catch block might not be reached if processIdempotent swallows errors,
      // but it serves as a safety net.
      logger.error('Error handling webhook event', {
        type: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * Wraps the handler in an idempotent transaction.
   * Ensures the event is processed exactly once.
   */
  private async processIdempotent(
    event: Stripe.Event,
    handler: (tx: Prisma.TransactionClient) => Promise<void>
  ) {
    const { id, type } = event;

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Check if event exists
        const existingEvent = await tx.webhookEvent.findUnique({
          where: { id },
        });

        if (existingEvent) {
          if (existingEvent.status === 'processed') {
            logger.info(`Event ${id} already processed. Skipping.`);
            return;
          }
          // If status is 'processing' or 'failed', we allow retry.
          // For 'processing', it handles crash/stale cases.
          // For 'failed', it handles retry logic.
          logger.info(`Retrying event ${id} with status: ${existingEvent.status}`);
        } else {
          // Create 'processing' record.
          // If concurrent requests happen, one will fail here with Unique Constraint Violation.
          await tx.webhookEvent.create({
            data: {
              id,
              type,
              status: 'processing',
            },
          });
        }

        // 2. Execute business logic
        await handler(tx);

        // 3. Mark as processed
        await tx.webhookEvent.update({
          where: { id },
          data: {
            status: 'processed',
            error: null,
            processedAt: new Date(),
          },
        });
      });
    } catch (error) {
      // Handle known concurrency errors (Idempotency)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        logger.info(`Event ${id} is being processed concurrently. Skipping.`);
        return;
      }

      // Handle other errors (Business logic failure)
      logger.error(`Failed to process event ${id}`, { error });

      // Try to record failure status (outside the failed transaction)
      try {
        await prisma.webhookEvent.upsert({
          where: { id },
          update: {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          },
          create: {
            id,
            type,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          },
        });
      } catch (e) {
        logger.error('Failed to update event status to failed', { e });
      }

      // Do NOT throw. Return success to Stripe to avoid infinite retries for non-transient errors.
      // If the error is transient (e.g. DB connection), we might WANT to throw to trigger retry.
      // But requirement says "Retornar 200 (siempre)".
    }
  }

  private async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
    tx: Prisma.TransactionClient
  ) {
    const { id, metadata } = paymentIntent;
    logger.info('Processing payment_intent.succeeded', { id });

    // 1. Check if order already exists (Idempotency check at domain level)
    const existingOrder = await tx.order.findFirst({
      where: { stripePaymentIntentId: id },
    });

    if (existingOrder) {
      if (existingOrder.status !== OrderStatus.PAID) {
        logger.warn('Order exists but status is not paid. Updating.', {
          orderId: existingOrder.id,
        });
        await tx.order.update({
          where: { id: existingOrder.id },
          data: { status: OrderStatus.PAID },
        });
      } else {
        logger.info('Order already processed and paid.', { orderId: existingOrder.id });
      }
      return;
    }

    // 2. If order doesn't exist, create it
    const { reservation_id, user_id } = metadata;

    if (!reservation_id) {
      logger.error('Missing reservation_id in payment intent metadata', { id });
      return;
    }

    logger.info('Order not found. Creating from reservation.', { reservation_id, user_id });

    try {
      // Pass transaction client to confirm
      const result = await this.checkoutService.confirm(
        user_id || null,
        reservation_id,
        id,
        paymentIntent.receipt_email || undefined,
        tx // <--- Pass tx
      );

      logger.info('Order created via webhook', { orderId: result.order_id });
    } catch (error: any) {
      if (error.code === 'RESERVATION_NOT_FOUND') {
        logger.error(
          'Reservation not found or expired for successful payment. Manual intervention required.',
          {
            paymentIntentId: id,
            reservationId: reservation_id,
          }
        );
        // We catch here to prevent transaction rollback?
        // No, if we return, the tx commits (with WebhookEvent marked processed).
        // This is correct: we processed the event, but couldn't create order because reservation missing.
        // We don't want to retry this endlessly.
      } else {
        throw error; // Throw to trigger rollback (and then 'failed' status)
      }
    }
  }

  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent,
    tx: Prisma.TransactionClient
  ) {
    const { id, metadata } = paymentIntent;
    logger.info(`Processing ${paymentIntent.status}`, { id });

    // 1. Check if order exists
    const existingOrder = await tx.order.findFirst({
      where: { stripePaymentIntentId: id },
    });

    if (existingOrder) {
      logger.info('Order exists for failed payment. Cancelling.', { orderId: existingOrder.id });

      // Update status
      await tx.order.update({
        where: { id: existingOrder.id },
        data: { status: OrderStatus.CANCELLED },
      });

      // Restock
      const items = await tx.orderItem.findMany({
        where: { orderId: existingOrder.id },
      });

      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { initialStock: { increment: item.quantity } },
        });

        await tx.inventoryLog.create({
          data: {
            productVariantId: item.productVariantId,
            changeType: InventoryChangeType.UPDATE,
            quantityDiff: item.quantity,
            orderId: existingOrder.id,
          },
        });
      }
      return;
    }

    // 2. If Order doesn't exist, release reservation
    const { reservation_id, user_id } = metadata;

    if (!reservation_id) {
      return;
    }

    logger.info('Releasing reservation for failed payment', { reservation_id });

    try {
      await this.checkoutService.cancel(user_id || null, reservation_id, tx); // <--- Pass tx
      logger.info('Reservation released via webhook');
    } catch (error: any) {
      if (error.code === 'RESERVATION_NOT_FOUND') {
        logger.info('Reservation already gone, nothing to release.');
      } else {
        logger.error('Failed to release reservation', { error });
        throw error; // Rethrow to mark event as failed? Or consume?
        // If we consume, event is 'processed'. If we throw, event is 'failed'.
        // Release failure might be worth retrying?
      }
    }
  }
}

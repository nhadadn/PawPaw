import { WebhookService } from '../webhook.service';
import { OrderStatus } from '@prisma/client';
import Stripe from 'stripe';
import { CheckoutError } from '../../utils/errors';
import prisma from '../../lib/prisma';
import { CheckoutService } from '../checkout.service';
import logger from '../../lib/logger';

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  order: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  orderItem: {
    findMany: jest.fn(),
  },
  productVariant: {
    update: jest.fn(),
  },
  inventoryLog: {
    create: jest.fn(),
  },
  webhookEvent: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(prisma)),
}));

jest.mock('../checkout.service');
jest.mock('../inventory.service');
jest.mock('../../lib/logger');
// Mock lib/stripe to avoid STRIPE_SECRET_KEY warning
jest.mock('../../lib/stripe', () => ({
  __esModule: true,
  default: {},
}));

describe('WebhookService', () => {
  let service: WebhookService;
  let mockCheckoutService: jest.Mocked<CheckoutService>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WebhookService();
    mockCheckoutService = (service as unknown as { checkoutService: CheckoutService })
      .checkoutService as jest.Mocked<CheckoutService>;
    // Default: Event not processed
    (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);
  });

  describe('handlePaymentSucceeded', () => {
    const mockEvent = {
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123',
          metadata: {
            reservation_id: 'res_123',
            user_id: 'user_123',
          },
          receipt_email: 'test@example.com',
        },
      },
    } as unknown as Stripe.Event;

    it('should update order status if order exists but not paid', async () => {
      (prisma.order.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'pending',
        stripePaymentIntentId: 'pi_123',
      });

      await service.handleEvent(mockEvent);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: OrderStatus.PAID },
      });
      expect(mockCheckoutService.confirm).not.toHaveBeenCalled();
    });

    it('should do nothing if order exists and is already paid', async () => {
      (prisma.order.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        status: OrderStatus.PAID,
        stripePaymentIntentId: 'pi_123',
      });

      await service.handleEvent(mockEvent);

      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(mockCheckoutService.confirm).not.toHaveBeenCalled();
    });

    it('should create order from reservation if order does not exist', async () => {
      (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);
      mockCheckoutService.confirm.mockResolvedValue({
        order_id: '1',
        order_number: '1',
        status: OrderStatus.PAID,
        total_cents: 1000,
      });

      await service.handleEvent(mockEvent);

      expect(mockCheckoutService.confirm).toHaveBeenCalledWith(
        'user_123',
        'res_123',
        'pi_123',
        'test@example.com',
        expect.anything()
      );
    });

    it('should handle RESERVATION_NOT_FOUND error gracefully', async () => {
      (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);
      mockCheckoutService.confirm.mockRejectedValue(
        new CheckoutError('RESERVATION_NOT_FOUND', 'Reservation not found')
      );

      await service.handleEvent(mockEvent);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Reservation not found or expired'),
        expect.anything()
      );
    });
  });

  describe('handlePaymentFailed', () => {
    const mockEvent = {
      id: 'evt_123_failed',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_123',
          metadata: {
            reservation_id: 'res_123',
            user_id: 'user_123',
          },
          status: 'payment_failed',
        },
      },
    } as unknown as Stripe.Event;

    it('should cancel order and restock if order exists', async () => {
      (prisma.order.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        status: OrderStatus.PENDING,
        stripePaymentIntentId: 'pi_123',
      });
      (prisma.orderItem.findMany as jest.Mock).mockResolvedValue([
        { productVariantId: 101, quantity: 2 },
      ]);

      await service.handleEvent(mockEvent);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: OrderStatus.CANCELLED },
      });
      // Restock logic
      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { initialStock: { increment: 2 } },
      });
    });

    it('should release reservation if order does not exist', async () => {
      (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

      await service.handleEvent(mockEvent);

      expect(mockCheckoutService.cancel).toHaveBeenCalledWith(
        'user_123',
        'res_123',
        expect.anything()
      );
    });
  });

  describe('Idempotency', () => {
    const mockEvent = {
      type: 'payment_intent.succeeded',
      id: 'evt_123',
      data: { object: { id: 'pi_123' } },
    } as unknown as Stripe.Event;

    it('should skip processing if event is already processed', async () => {
      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 'evt_123',
        status: 'processed',
      });

      await service.handleEvent(mockEvent);

      expect(prisma.order.findFirst).not.toHaveBeenCalled();
      expect(mockCheckoutService.confirm).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('already processed'));
    });
  });
});

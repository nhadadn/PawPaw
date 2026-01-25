import { CheckoutService } from '../checkout.service';
import redis from '../../lib/redis';
import stripe from '../../lib/stripe';

// Define mock repository instance
const mockRepoInstance = {
  findVariantWithLock: jest.fn(),
  updateReservedStock: jest.fn(),
  createInventoryLog: jest.fn(),
  countUserPastPurchases: jest.fn(),
  createOrder: jest.fn(),
  confirmStockDeduction: jest.fn(),
  releaseStock: jest.fn(),
  releaseReservedStock: jest.fn(),
  createReservation: jest.fn(),
};

// Mock dependencies
jest.mock('../../websocket/inventory.socket', () => ({
  emitStockUpdate: jest.fn(),
}));

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn((callback) => callback({})), // Mock tx object
    $queryRaw: jest.fn(),
    user: {
      findUnique: jest.fn(),
    },
  },
}));
jest.mock('../../lib/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  zadd: jest.fn(),
  zrem: jest.fn(),
  multi: jest.fn(),
  keys: jest.fn().mockResolvedValue([]),
  quit: jest.fn(),
  ping: jest.fn(),
}));
jest.mock('../../lib/stripe', () => ({
  __esModule: true,
  default: {
    paymentIntents: {
      retrieve: jest.fn(),
      create: jest.fn(),
      cancel: jest.fn(),
    },
  },
}));
jest.mock('../../repositories/checkout.repository', () => ({
  CheckoutRepository: jest.fn().mockImplementation(() => mockRepoInstance),
}));

jest.mock('../../lib/logger');

describe('CheckoutService', () => {
  let service: CheckoutService;

  beforeAll(() => {
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(async () => {
    await redis.quit();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CheckoutService();
  });

  describe('reserve', () => {
    const userId = 'user-123';
    const items = [{ product_variant_id: 1, quantity: 2 }];

    it('should create a reservation successfully', async () => {
      // Setup mocks
      (redis.get as jest.Mock).mockResolvedValue(null); // No active reservation

      const mockVariant = {
        id: BigInt(1),
        initial_stock: 10,
        reserved_stock: 0,
        price_cents: 1000,
        currency: 'MXN',
        max_per_customer: null,
      };

      // Mock Repository methods
      mockRepoInstance.findVariantWithLock.mockResolvedValue(mockVariant);
      mockRepoInstance.updateReservedStock.mockResolvedValue(undefined);
      mockRepoInstance.createInventoryLog.mockResolvedValue(undefined);
      mockRepoInstance.createReservation.mockResolvedValue({ id: 'res-123' });

      // Mock Stripe create
      (stripe.paymentIntents.create as jest.Mock).mockResolvedValue({
        id: 'pi_123',
        client_secret: 'secret_123',
      });

      const redisMultiMock = {
        set: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue('OK'),
      };
      (redis.multi as jest.Mock).mockReturnValue(redisMultiMock);

      const result = await service.reserve(userId, items);

      expect(result).toHaveProperty('reservation_id');
      expect(result.total_cents).toBe(2000);
      expect(mockRepoInstance.findVariantWithLock).toHaveBeenCalled();
      expect(mockRepoInstance.updateReservedStock).toHaveBeenCalledWith(expect.anything(), 1, 2);
      expect(redisMultiMock.set).toHaveBeenCalledTimes(2);
    });

    it('should throw error if active reservation exists', async () => {
      (redis.get as jest.Mock).mockResolvedValue('some-reservation-id');

      await expect(service.reserve(userId, items)).rejects.toThrow(
        'User already has an active reservation'
      );
    });

    it('should throw error if insufficient stock', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const mockVariant = {
        id: BigInt(1),
        initial_stock: 1, // Only 1 available
        reserved_stock: 0,
        price_cents: 1000,
        currency: 'MXN',
      };

      mockRepoInstance.findVariantWithLock.mockResolvedValue(mockVariant);

      await expect(service.reserve(userId, items)).rejects.toThrow('Insufficient stock');
    });

    it('should reject when items array is empty', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      await expect(service.reserve(userId, [])).rejects.toThrow('Items must be a non-empty array');
    });

    it('should reject when quantity is not positive', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const invalidItems = [{ product_variant_id: 1, quantity: 0 }];

      await expect(service.reserve(userId, invalidItems)).rejects.toThrow(
        'quantity must be a positive integer'
      );
    });

    it('should reject when product_variant_id is not positive', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const invalidItems = [{ product_variant_id: 0, quantity: 1 }];

      await expect(service.reserve(userId, invalidItems)).rejects.toThrow(
        'product_variant_id must be a positive integer'
      );
    });

    it('should throw error when variant is not found', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      mockRepoInstance.findVariantWithLock.mockResolvedValue(null);

      await expect(service.reserve(userId, items)).rejects.toThrow('Variant 1 not found');
    });

    it('should enforce MAX_PER_CUSTOMER limit', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const mockVariant = {
        id: BigInt(1),
        initial_stock: 10,
        reserved_stock: 0,
        price_cents: 1000,
        currency: 'MXN',
        max_per_customer: 3,
      };

      mockRepoInstance.findVariantWithLock.mockResolvedValue(mockVariant);
      mockRepoInstance.countUserPastPurchases.mockResolvedValue(2);

      await expect(service.reserve(userId, items)).rejects.toThrow(
        'Limit of 3 exceeded for product'
      );
    });
  });

  describe('confirm', () => {
    const userId = 'user-123';
    const reservationId = 'res-123';
    const paymentIntentId = 'pi_123';

    const mockReservation = {
      reservation_id: reservationId,
      user_id: userId,
      total_cents: 2000,
      currency: 'MXN',
      items: [
        { product_variant_id: 1, quantity: 2, unit_price_cents: 1000, total_price_cents: 2000 },
      ],
      expires_at: new Date().toISOString(),
    };

    it('should confirm order successfully', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockReservation));

      (stripe.paymentIntents.retrieve as jest.Mock).mockResolvedValue({
        status: 'succeeded',
      });

      mockRepoInstance.createOrder.mockResolvedValue({ id: BigInt(100), totalCents: 2000 });
      mockRepoInstance.confirmStockDeduction.mockResolvedValue(undefined);
      mockRepoInstance.createInventoryLog.mockResolvedValue(undefined);

      const result = await service.confirm(userId, reservationId, paymentIntentId);

      expect(result.status).toBe('PAID');
      expect(mockRepoInstance.createOrder).toHaveBeenCalled();
      expect(mockRepoInstance.confirmStockDeduction).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });

    it('should throw error if reservation not found', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      await expect(service.confirm(userId, reservationId, paymentIntentId)).rejects.toThrow(
        'Reservation not found'
      );
    });

    it('should release stock and throw error if payment failed', async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockReservation));

      (stripe.paymentIntents.retrieve as jest.Mock).mockResolvedValue({
        status: 'requires_payment_method',
      });

      mockRepoInstance.releaseReservedStock.mockResolvedValue({
        id: BigInt(1),
        productId: BigInt(10),
        initialStock: 10,
        reservedStock: 0,
      });
      mockRepoInstance.createInventoryLog.mockResolvedValue(undefined);

      await expect(service.confirm(userId, reservationId, paymentIntentId)).rejects.toThrow(
        'Payment status is requires_payment_method'
      );

      expect(mockRepoInstance.releaseReservedStock).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });
  });
});

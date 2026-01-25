import { processExpiredReservationsOnce } from './expiration.scheduler';
import redis from '../lib/redis';
import prisma from '../lib/prisma';

jest.mock('../lib/redis', () => ({
  zrangebyscore: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  zadd: jest.fn(),
  zrem: jest.fn(),
  sadd: jest.fn(),
  multi: jest.fn(),
}));

jest.mock('../lib/prisma', () => {
  const mockProductVariantUpdate = jest.fn();
  const mockInventoryLogCreate = jest.fn();
  const prismaTransactionMock = jest.fn(
    async (
      callback: (tx: {
        productVariant: { update: typeof mockProductVariantUpdate };
        inventoryLog: { create: typeof mockInventoryLogCreate };
      }) => unknown
    ) => {
      return callback({
        productVariant: { update: mockProductVariantUpdate },
        inventoryLog: { create: mockInventoryLogCreate },
      });
    }
  );

  return {
    $transaction: prismaTransactionMock,
    __mockProductVariantUpdate: mockProductVariantUpdate,
    __mockInventoryLogCreate: mockInventoryLogCreate,
  };
});

jest.mock('../lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('processExpiredReservationsOnce', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('releases stock and cleans redis for expired reservations', async () => {
    const reservationId = 'res-123';
    const userId = 'user-123';

    (redis.zrangebyscore as jest.Mock).mockResolvedValue([reservationId]);

    const reservationPayload = {
      user_id: userId,
      items: [{ product_variant_id: 1, quantity: 2 }],
    };

    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(reservationPayload));

    const prismaAny = prisma as unknown as {
      $transaction: jest.Mock;
      __mockProductVariantUpdate: jest.Mock;
      __mockInventoryLogCreate: jest.Mock;
    };

    await processExpiredReservationsOnce();

    expect(redis.zrangebyscore as jest.Mock).toHaveBeenCalledWith(
      'reservations:by_expiry',
      0,
      expect.any(Number)
    );
    expect(redis.get as jest.Mock).toHaveBeenCalledWith(`reservation:${reservationId}`);
    expect(prismaAny.$transaction).toHaveBeenCalled();
    expect(prismaAny.__mockProductVariantUpdate).toHaveBeenCalledWith({
      where: { id: BigInt(1) },
      data: { reservedStock: { decrement: 2 } },
    });
    expect(prismaAny.__mockInventoryLogCreate).toHaveBeenCalledWith({
      data: {
        productVariantId: BigInt(1),
        changeType: 'RELEASE_EXPIRED',
        quantityDiff: 2,
      },
    });
    expect(redis.zrem as jest.Mock).toHaveBeenCalledWith('reservations:by_expiry', reservationId);
    expect(redis.sadd as jest.Mock).toHaveBeenCalledWith('reservations:abandoned', reservationId);
    expect(redis.del as jest.Mock).not.toHaveBeenCalled();
  });

  it('does nothing when there are no expired reservations', async () => {
    (redis.zrangebyscore as jest.Mock).mockResolvedValue([]);

    await processExpiredReservationsOnce();

    expect(redis.get as jest.Mock).not.toHaveBeenCalled();
    expect((prisma as unknown as { $transaction: jest.Mock }).$transaction).not.toHaveBeenCalled();
    expect(redis.del as jest.Mock).not.toHaveBeenCalled();
    expect(redis.zrem as jest.Mock).not.toHaveBeenCalled();
  });
});

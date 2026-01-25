import { AbandonedCartRecoveryService } from '../abandonedCartRecovery.service';
import redis from '../../lib/redis';
import nodemailer from 'nodemailer';
import { CheckoutService } from '../checkout.service';

// Mock Redis factory
jest.mock('../../lib/redis', () => {
  return {
    __esModule: true,
    default: {
      smembers: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      srem: jest.fn(),
      sadd: jest.fn(),
      zrem: jest.fn(),
      zadd: jest.fn(),
      multi: jest.fn(),
      quit: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
      ping: jest.fn().mockResolvedValue('PONG'),
    },
  };
});

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue('OK'),
  }),
}));
jest.mock('../checkout.service');
jest.mock('../../lib/logger');

describe('AbandonedCartRecoveryService', () => {
  let service: AbandonedCartRecoveryService;
  let sendMailMock: jest.Mock;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let checkoutServiceMock: jest.Mocked<CheckoutService>;

  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Nodemailer mock
    sendMailMock = jest.fn().mockResolvedValue('OK');
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    // Setup CheckoutService mock
    checkoutServiceMock = new CheckoutService() as unknown as jest.Mocked<CheckoutService>;

    service = new AbandonedCartRecoveryService();
  });

  describe('scanExpiredReservations', () => {
    it('should process eligible abandoned reservations', async () => {
      const reservationId = 'res-123';
      const userId = 'user-123';

      // 1. Mock redis.smembers to return candidate
      (redis.smembers as jest.Mock).mockResolvedValue([reservationId]);

      // 2. Mock redis.get for notified check (return null = not notified)
      (redis.get as jest.Mock).mockImplementation((key) => {
        if (key === `notified:${reservationId}`) return Promise.resolve(null);
        if (key === `reservation:${reservationId}`) {
          // Return reservation expired 30 mins ago (valid for recovery)
          const now = Date.now();
          const expiresAt = now - 30 * 60 * 1000;
          return Promise.resolve(
            JSON.stringify({
              id: reservationId,
              user_id: userId,
              expires_at: new Date(expiresAt).toISOString(),
              total_cents: 1000,
              currency: 'MXN',
              items: [{ product_variant_id: 1, quantity: 1 }],
            })
          );
        }
        return Promise.resolve(null);
      });

      // 3. Mock resolveEmail
      const resolveEmailSpy = jest
        .spyOn(
          service as unknown as { resolveEmail: (userId: string) => Promise<string> },
          'resolveEmail'
        )
        .mockResolvedValue('test@example.com');

      await service.scanExpiredReservations();

      expect(redis.smembers).toHaveBeenCalledWith('reservations:abandoned');
      expect(resolveEmailSpy).toHaveBeenCalledWith(userId);
      expect(sendMailMock).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^notified:/),
        'true',
        'EX',
        expect.any(Number)
      );
      expect(redis.srem).toHaveBeenCalledWith('reservations:abandoned', reservationId);
    });

    it('should skip reservations that are too old', async () => {
      const reservationId = 'res-old';

      (redis.smembers as jest.Mock).mockResolvedValue([reservationId]);
      (redis.get as jest.Mock).mockImplementation((key) => {
        if (key === `notified:${reservationId}`) return Promise.resolve(null);
        if (key === `reservation:${reservationId}`) {
          // Expired 2 hours ago (too old)
          const now = Date.now();
          const expiresAt = now - 120 * 60 * 1000;
          return Promise.resolve(
            JSON.stringify({
              id: reservationId,
              expires_at: new Date(expiresAt).toISOString(),
            })
          );
        }
        return Promise.resolve(null);
      });

      await service.scanExpiredReservations();

      expect(sendMailMock).not.toHaveBeenCalled();
      expect(redis.srem).toHaveBeenCalledWith('reservations:abandoned', reservationId);
    });
  });
});

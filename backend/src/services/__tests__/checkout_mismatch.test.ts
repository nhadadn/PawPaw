import { CheckoutService } from '../checkout.service';
import redis from '../../lib/redis';

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  $transaction: jest.fn((cb) => cb({})),
}));
jest.mock('../../lib/redis');
jest.mock('../../lib/stripe', () => ({
  __esModule: true,
  default: {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'pi_123', client_secret: 'sec_123' }),
    },
  },
}));
jest.mock('../../repositories/checkout.repository');
jest.mock('../../websocket/inventory.socket', () => ({
  emitStockUpdate: jest.fn(),
}));

describe('CheckoutService - Guest Claim', () => {
  let service: CheckoutService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CheckoutService();
  });

  it('should allow authenticated user to claim guest reservation', async () => {
    const reservationId = 'res-123';
    const guestId = 'guest:abc';
    const userId = 'user-real';

    // Mock Redis returning a guest reservation
    const mockReservation = {
      id: reservationId,
      user_id: guestId,
      total_cents: 1000,
      currency: 'MXN',
      expires_at: new Date(Date.now() + 600000).toISOString(),
    };
    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockReservation));
    (redis.set as jest.Mock).mockResolvedValue('OK');

    // Call createPaymentIntent with REAL userId
    // This should NOT throw RESERVATION_USER_MISMATCH if fixed
    const result = await service.createPaymentIntent(userId, reservationId);

    expect(result).toBeDefined();
    // Verify that Redis was updated with the NEW user_id
    expect(redis.set).toHaveBeenCalled();
    const setCall = (redis.set as jest.Mock).mock.calls.find(
      (call) => call[0] === `reservation:${reservationId}`
    );
    const savedData = JSON.parse(setCall[1]);
    expect(savedData.user_id).toBe(userId);
  });
});

import request from 'supertest';
import { createApp } from '../app';
import stripe from '../lib/stripe';
import { register } from 'prom-client';

// Mock dependencies
jest.mock('../lib/stripe', () => ({
  webhooks: {
    constructEvent: jest.fn()
  }
}));

jest.mock('../lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Mock process.env.STRIPE_WEBHOOK_SECRET
const originalEnv = process.env;

describe('Stripe Webhook', () => {
  let app: any;

  beforeEach(() => {
    register.clear();
    jest.resetModules();
    process.env = { ...originalEnv, STRIPE_WEBHOOK_SECRET: 'whsec_test_secret' };
    app = createApp();
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('POST /api/webhooks/stripe returns 400 if signature is missing', async () => {
    const response = await request(app)
      .post('/api/webhooks/stripe')
      .send({ some: 'data' });

    expect(response.status).toBe(400);
    expect(response.text).toContain('Missing stripe-signature header');
  });

  it('POST /api/webhooks/stripe returns 400 if signature verification fails', async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const response = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'invalid_signature')
      .send({ some: 'data' });

    expect(response.status).toBe(400);
    expect(response.text).toContain('Webhook Error: Invalid signature');
  });

  it('POST /api/webhooks/stripe returns 200 for unhandled event type', async () => {
    const mockEvent = {
      type: 'some.other.event',
      data: { object: { id: 'evt_123' } }
    };

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

    const response = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'valid_signature')
      .send(mockEvent);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: true });
  });

  it('POST /api/webhooks/stripe returns 200 for payment_intent.succeeded', async () => {
    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123' } }
    };

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

    const response = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'valid_signature')
      .send(mockEvent);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: true });
  });
});

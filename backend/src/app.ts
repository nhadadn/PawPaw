import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import checkoutRoutes from './routes/checkout.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import prisma from './lib/prisma';
import redis from './lib/redis';
import stripe from './lib/stripe';
import logger from './lib/logger';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());

  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      return res.status(500).send('Webhook not configured');
    }

    if (!signature || typeof signature !== 'string') {
      return res.status(400).send('Missing stripe-signature header');
    }

    let event: unknown;

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      logger.error('Stripe webhook signature verification failed', { error: err });
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(400).send(`Webhook Error: ${message}`);
    }

    try {
      const stripeEvent = event as { type: string; data: { object: { id: string } } };

      switch (stripeEvent.type) {
        case 'payment_intent.succeeded':
          logger.info('Stripe payment_intent.succeeded', { id: stripeEvent.data.object.id });
          break;
        case 'payment_intent.payment_failed':
          logger.warn('Stripe payment_intent.payment_failed', { id: stripeEvent.data.object.id });
          break;
        default:
          logger.info('Unhandled Stripe event type', { type: stripeEvent.type });
      }

      return res.json({ received: true });
    } catch (err) {
      logger.error('Stripe webhook handling error', { error: err });
      return res.status(500).send('Webhook handling error');
    }
  });

  app.use(express.json());
  app.use(morgan('dev'));

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/health', async (req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();
      res.json({ status: 'ok' });
    } catch (error) {
      res.status(500).json({ status: 'error', details: String(error) });
    }
  });

  app.use('/api/checkout', checkoutRoutes);

  return app;
};

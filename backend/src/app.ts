import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import Stripe from 'stripe';
import { WebhookService } from './services/webhook.service';
import { errorHandler } from './middleware/errorHandler.middleware';
import { NotFoundError } from './utils/errors';

// Handle BigInt serialization
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import morgan from 'morgan';
import shopRoutes from './routes/shop.routes';
import checkoutRoutes from './routes/checkout.routes';
import { adminRoutes } from './routes/admin.routes';
import healthRoutes from './routes/health';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import prisma from './lib/prisma';
import redis from './lib/redis';
import stripe from './lib/stripe';
import logger from './lib/logger';
import promBundle from 'express-prom-bundle';
import { globalLimiter, authLimiter, checkoutLimiter } from './middleware/rateLimit.middleware';

export const createApp = () => {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server webhooks)
        if (!origin) return callback(null, true);

        if (origin === allowedOrigin) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Prometheus metrics middleware
  const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    includeUp: true,
    customLabels: { project_name: 'pawpaw', project_version: '1.0.0' },
    metricsPath: '/metrics',
    autoregister: false,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(metricsMiddleware as any);

  // Apply Global Rate Limiter
  app.use(globalLimiter);

  const webhookService = new WebhookService();

  app.post(
    '/api/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      const signature = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        logger.error('STRIPE_WEBHOOK_SECRET is not configured');
        return res.status(500).send('Webhook not configured');
      }

      if (!signature || typeof signature !== 'string') {
        return res.status(400).send('Missing stripe-signature header');
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
      } catch (err) {
        logger.error('Stripe webhook signature verification failed', { error: err });
        const message = err instanceof Error ? err.message : 'Unknown error';
        return res.status(400).send(`Webhook Error: ${message}`);
      }

      try {
        await webhookService.handleEvent(event);
        return res.json({ received: true });
      } catch (err) {
        logger.error('Stripe webhook handling error', { error: err });
        return res.status(500).send('Webhook handling error');
      }
    }
  );

  app.use(express.json());
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
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

  // Specific Rate Limiters
  app.use('/api/checkout', checkoutLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/admin/login', authLimiter);

  app.use('/api/checkout', checkoutRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', shopRoutes);
  app.use('/api', healthRoutes);

  // 404 Handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

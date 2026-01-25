import { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { CheckoutService } from '../services/checkout.service';
import { CheckoutError } from '../utils/errors';
import logger from '../lib/logger';

const ReserveSchema = z.object({
  items: z
    .array(
      z.object({
        product_variant_id: z.number().positive(),
        quantity: z.number().positive(),
      })
    )
    .nonempty(),
  email: z.string().email().optional(),
});

const CreatePaymentIntentSchema = z.object({
  reservation_id: z.string().uuid(),
});

const ConfirmSchema = z.object({
  reservation_id: z.string().uuid(),
  payment_intent_id: z.string().startsWith('pi_'),
  email: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().email().optional()
  ),
});

const CancelSchema = z.object({
  reservation_id: z.string().uuid(),
});

const StatusParamsSchema = z.object({
  reservation_id: z.string().uuid(),
});

export class CheckoutController {
  private service: CheckoutService;

  constructor() {
    this.service = new CheckoutService();
  }

  reserve = async (req: Request, res: Response) => {
    try {
      const validated = ReserveSchema.parse(req.body);
      // If user is not authenticated, generate a guest ID
      const userId = req.user?.id || `guest:${uuidv4()}`;

      const result = await this.service.reserve(userId, validated.items, validated.email);
      return res.status(201).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  createPaymentIntent = async (req: Request, res: Response) => {
    try {
      const validated = CreatePaymentIntentSchema.parse(req.body);
      const userId = req.user?.id || null;

      const result = await this.service.createPaymentIntent(userId, validated.reservation_id);
      return res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  confirm = async (req: Request, res: Response) => {
    try {
      logger.info('ConfirmPayment Payload:', req.body);
      logger.info('Checkout Confirm User:', req.user);

      const validated = ConfirmSchema.parse(req.body);
      // Pass optional userId. Service will handle guest verification logic.
      const userId = req.user?.id || null;

      const result = await this.service.confirm(
        userId,
        validated.reservation_id,
        validated.payment_intent_id,
        validated.email
      );
      return res.status(200).json(result);
    } catch (error) {
      logger.error('ConfirmPayment Error:', error);
      this.handleError(res, error);
    }
  };

  cancel = async (req: Request, res: Response) => {
    try {
      const validated = CancelSchema.parse(req.body);
      const userId = req.user?.id || null;

      const result = await this.service.cancel(userId, validated.reservation_id);
      return res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  status = async (req: Request, res: Response) => {
    try {
      const params = StatusParamsSchema.parse(req.params);
      const userId = req.user?.id || null;

      const result = await this.service.getStatus(userId, params.reservation_id);
      return res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown) {
    if (error instanceof z.ZodError) {
      logger.error('Checkout Validation Error:', JSON.stringify(error.errors, null, 2));
      return res
        .status(400)
        .json({ error: 'INVALID_REQUEST', message: 'Validation failed', details: error.errors });
    }

    if (error instanceof CheckoutError) {
      const statusMap: Record<string, number> = {
        INVALID_REQUEST: 400,
        ACTIVE_RESERVATION_EXISTS: 409,
        INSUFFICIENT_STOCK: 409,
        MAX_PER_CUSTOMER_EXCEEDED: 409,
        PRODUCT_VARIANT_NOT_FOUND: 400,
        RESERVATION_NOT_FOUND: 404,
        RESERVATION_EXPIRED: 404,
        PAYMENT_FAILED: 402,
        RESERVATION_USER_MISMATCH: 403, // Explicitly map mismatch to 403
      };

      const status = statusMap[error.code] || 500;
      logger.error(`Checkout Error [${error.code}]:`, error.message);

      return res.status(status).json({
        error: error.code,
        message: error.message,
      });
    }

    logger.error('Unexpected Checkout Error:', error);
    return res
      .status(500)
      .json({ error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' });
  }
}

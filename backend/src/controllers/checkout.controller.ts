import { Request, Response } from 'express';
import { z } from 'zod';
import { CheckoutService } from '../services/checkout.service';
import { CheckoutError } from '../utils/errors';
import logger from '../lib/logger';

const ReserveSchema = z.object({
  items: z.array(z.object({
    product_variant_id: z.number().positive(),
    quantity: z.number().positive()
  })).nonempty()
});

const ConfirmSchema = z.object({
  reservation_id: z.string().uuid(),
  payment_intent_id: z.string().startsWith('pi_')
});

const CancelSchema = z.object({
  reservation_id: z.string().uuid()
});

const StatusParamsSchema = z.object({
  reservation_id: z.string().uuid()
});

export class CheckoutController {
  private service: CheckoutService;

  constructor() {
    this.service = new CheckoutService();
  }

  reserve = async (req: Request, res: Response) => {
    try {
      const validated = ReserveSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const result = await this.service.reserve(userId, validated.items);
      return res.status(201).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  confirm = async (req: Request, res: Response) => {
    try {
      const validated = ConfirmSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const result = await this.service.confirm(userId, validated.reservation_id, validated.payment_intent_id);
      return res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  cancel = async (req: Request, res: Response) => {
    try {
      const validated = CancelSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
         return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const result = await this.service.cancel(userId, validated.reservation_id);
      return res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  status = async (req: Request, res: Response) => {
    try {
      const params = StatusParamsSchema.parse(req.params);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const result = await this.service.getStatus(userId, params.reservation_id);
      return res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Validation failed', details: error.errors });
    }

    if (error instanceof CheckoutError) {
      const statusMap: Record<string, number> = {
        'ACTIVE_RESERVATION_EXISTS': 409,
        'INSUFFICIENT_STOCK': 409,
        'MAX_PER_CUSTOMER_EXCEEDED': 409,
        'PRODUCT_VARIANT_NOT_FOUND': 400,
        'RESERVATION_NOT_FOUND': 404,
        'RESERVATION_EXPIRED': 404,
        'PAYMENT_FAILED': 402,
        'ORDER_ALREADY_CONFIRMED': 409,
        'RESERVATION_USER_MISMATCH': 403, // Default to 403
      };

      let status = statusMap[error.code] || 500;
      
      // Override for Confirm endpoint to match specific contract 409
      if (error.code === 'RESERVATION_USER_MISMATCH' && res.req.path.includes('/confirm')) {
          status = 409;
      }

      return res.status(status).json({ error: error.code, message: error.message });
    }

    logger.error('Unexpected error', { error });
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });
  }
}

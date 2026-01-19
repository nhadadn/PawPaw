import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

const router = Router();
const controller = new CheckoutController();

router.post('/reserve', authMiddleware, idempotencyMiddleware, controller.reserve);
router.post('/confirm', authMiddleware, idempotencyMiddleware, controller.confirm);
router.post('/cancel', authMiddleware, controller.cancel);
router.get('/status/:reservation_id', authMiddleware, controller.status);

export default router;

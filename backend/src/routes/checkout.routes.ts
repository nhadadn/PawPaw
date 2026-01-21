import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller';
import { optionalAuthMiddleware } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

const router = Router();
const controller = new CheckoutController();

/**
 * @swagger
 * tags:
 *   name: Checkout
 *   description: Checkout process management
 */

/**
 * @swagger
 * /checkout/reserve:
 *   post:
 *     summary: Create a reservation for items
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ReservationItem'
 *     responses:
 *       200:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict (Insufficient stock, active reservation, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reserve', optionalAuthMiddleware, idempotencyMiddleware, controller.reserve);

/**
 * @swagger
 * /checkout/confirm:
 *   post:
 *     summary: Confirm a reservation with payment
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reservation_id
 *               - payment_intent_id
 *             properties:
 *               reservation_id:
 *                 type: string
 *                 format: uuid
 *               payment_intent_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order_id:
 *                   type: integer
 *                 status:
 *                   type: string
 *                   example: 'confirmed'
 *       400:
 *         description: Invalid request
 *       402:
 *         description: Payment failed
 *       404:
 *         description: Reservation not found
 */
router.post('/confirm', optionalAuthMiddleware, idempotencyMiddleware, controller.confirm);

router.post('/cancel', optionalAuthMiddleware, controller.cancel);
router.get('/status/:reservation_id', optionalAuthMiddleware, controller.status);

export default router;


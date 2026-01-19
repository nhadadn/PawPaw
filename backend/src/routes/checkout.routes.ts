import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller';
import { authMiddleware } from '../middleware/auth.middleware';
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
router.post('/reserve', authMiddleware, idempotencyMiddleware, controller.reserve);

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
router.post('/confirm', authMiddleware, idempotencyMiddleware, controller.confirm);

/**
 * @swagger
 * /checkout/cancel:
 *   post:
 *     summary: Cancel a reservation manually
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
 *             properties:
 *               reservation_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Reservation cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Reservation cancelled'
 *       404:
 *         description: Reservation not found
 */
router.post('/cancel', authMiddleware, controller.cancel);

/**
 * @swagger
 * /checkout/status/{reservation_id}:
 *   get:
 *     summary: Get reservation status
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservation_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the reservation
 *     responses:
 *       200:
 *         description: Reservation details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationResponse'
 *       404:
 *         description: Reservation not found
 */
router.get('/status/:reservation_id', authMiddleware, controller.status);

export default router;

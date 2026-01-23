"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutService = void 0;
const uuid_1 = require("uuid");
const prisma_1 = __importDefault(require("../lib/prisma"));
const redis_1 = __importDefault(require("../lib/redis"));
const stripe_1 = __importDefault(require("../lib/stripe"));
const checkout_repository_1 = require("../repositories/checkout.repository");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../lib/logger"));
const RESERVATION_TTL = 600; // 10 minutes
const client_1 = require("@prisma/client");
class CheckoutService {
    constructor() {
        this.repo = new checkout_repository_1.CheckoutRepository();
    }
    async reserve(userId, items) {
        // For guests, we use the generated guest ID.
        const existingReservation = await redis_1.default.get(`reservation:user:${userId}`);
        if (existingReservation) {
            throw new errors_1.CheckoutError('ACTIVE_RESERVATION_EXISTS', 'User already has an active reservation');
        }
        if (!Array.isArray(items) || items.length === 0) {
            throw new errors_1.CheckoutError('INVALID_REQUEST', 'Items must be a non-empty array');
        }
        for (const item of items) {
            if (!item ||
                typeof item.product_variant_id !== 'number' ||
                !Number.isInteger(item.product_variant_id) ||
                item.product_variant_id <= 0) {
                throw new errors_1.CheckoutError('INVALID_REQUEST', 'product_variant_id must be a positive integer');
            }
            if (typeof item.quantity !== 'number' ||
                !Number.isInteger(item.quantity) ||
                item.quantity <= 0) {
                throw new errors_1.CheckoutError('INVALID_REQUEST', 'quantity must be a positive integer');
            }
        }
        const reservationItems = [];
        let totalCents = 0;
        let currency = 'MXN';
        const reservationId = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + RESERVATION_TTL * 1000);
        try {
            await prisma_1.default.$transaction(async (tx) => {
                for (const item of items) {
                    const variant = await this.repo.findVariantWithLock(tx, item.product_variant_id);
                    if (!variant) {
                        throw new errors_1.CheckoutError('PRODUCT_VARIANT_NOT_FOUND', `Variant ${item.product_variant_id} not found`);
                    }
                    // Calculate available stock
                    const availableStock = variant.initial_stock - variant.reserved_stock;
                    if (availableStock < item.quantity) {
                        throw new errors_1.CheckoutError('INSUFFICIENT_STOCK', `Insufficient stock for variant ${item.product_variant_id}`);
                    }
                    // Check Max Per Customer (Skip for guests for now, or handle by IP later)
                    if (variant.max_per_customer && !userId.startsWith('guest:')) {
                        const pastPurchases = await this.repo.countUserPastPurchases(tx, userId, variant.product_id);
                        if (pastPurchases + item.quantity > variant.max_per_customer) {
                            throw new errors_1.CheckoutError('MAX_PER_CUSTOMER_EXCEEDED', `Limit of ${variant.max_per_customer} exceeded for product`);
                        }
                    }
                    // Reserve
                    await this.repo.updateReservedStock(tx, Number(variant.id), item.quantity);
                    // Log
                    await this.repo.createInventoryLog(tx, {
                        productVariantId: Number(variant.id),
                        changeType: client_1.InventoryChangeType.RESERVE,
                        quantityDiff: item.quantity,
                    });
                    reservationItems.push({
                        product_variant_id: Number(variant.id),
                        quantity: item.quantity,
                        unit_price_cents: variant.price_cents,
                        total_price_cents: variant.price_cents * item.quantity,
                        currency: variant.currency,
                    });
                    totalCents += variant.price_cents * item.quantity;
                    currency = variant.currency;
                }
            });
        }
        catch (error) {
            if (error instanceof errors_1.CheckoutError)
                throw error;
            console.error('DEBUG ERROR:', error);
            logger_1.default.error('Reservation transaction failed', {
                message: error instanceof Error ? error.message : 'Unknown',
                stack: error instanceof Error ? error.stack : undefined,
                error,
            });
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error('Transaction failed: ' + message);
        }
        // 3. Save to Redis
        const payload = {
            id: reservationId,
            reservation_id: reservationId,
            user_id: userId,
            items: reservationItems,
            total_cents: totalCents,
            currency,
            expires_at: expiresAt.toISOString(),
            // client_secret will be generated in createPaymentIntent
        };
        await redis_1.default
            .multi()
            .set(`reservation:${reservationId}`, JSON.stringify(payload), 'EX', RESERVATION_TTL)
            .set(`reservation:user:${userId}`, reservationId, 'EX', RESERVATION_TTL)
            .zadd('reservations:by_expiry', expiresAt.getTime(), reservationId)
            .exec();
        logger_1.default.info('Reservation created', { reservation_id: reservationId, user_id: userId });
        return payload;
    }
    async createPaymentIntent(userId, reservationId) {
        // 1. Get Reservation
        const rawReservation = await redis_1.default.get(`reservation:${reservationId}`);
        if (!rawReservation) {
            throw new errors_1.CheckoutError('RESERVATION_NOT_FOUND', 'Reservation not found or expired');
        }
        const reservation = JSON.parse(rawReservation);
        // Validate ownership
        if (userId && reservation.user_id !== userId) {
            // Allow claiming if it's a guest reservation
            if (reservation.user_id.startsWith('guest:')) {
                logger_1.default.info(`User ${userId} claiming guest reservation ${reservation.user_id}`);
                reservation.user_id = userId;
                // If PI already exists, we need to persist the claim NOW because we might return early
                if (reservation.payment_intent_id && reservation.client_secret) {
                    const ttl = Math.max(0, Math.floor((new Date(reservation.expires_at).getTime() - Date.now()) / 1000));
                    if (ttl > 0) {
                        await redis_1.default.set(`reservation:${reservationId}`, JSON.stringify(reservation), 'EX', ttl);
                    }
                }
            }
            else {
                throw new errors_1.CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation belongs to another user');
            }
        }
        if (!userId && !reservation.user_id.startsWith('guest:')) {
            throw new errors_1.CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation requires authentication');
        }
        // Check if PI already exists in reservation data to avoid duplicates (Idempotency)
        if (reservation.payment_intent_id && reservation.client_secret) {
            return {
                client_secret: reservation.client_secret,
                payment_intent_id: reservation.payment_intent_id,
                amount: reservation.total_cents,
                currency: reservation.currency,
            };
        }
        // 2. Create Stripe Payment Intent
        let clientSecret;
        let paymentIntentId;
        if (process.env.STRIPE_SECRET_KEY?.includes('replace_me')) {
            logger_1.default.warn('Using MOCK Stripe Payment Intent due to dummy key');
            paymentIntentId = `pi_mock_${reservationId}`;
            clientSecret = `${paymentIntentId}_secret_mock`;
        }
        else {
            try {
                const paymentIntent = await stripe_1.default.paymentIntents.create({
                    amount: reservation.total_cents,
                    currency: reservation.currency,
                    automatic_payment_methods: { enabled: true },
                    metadata: {
                        reservation_id: reservationId,
                        user_id: reservation.user_id,
                    },
                });
                if (!paymentIntent.client_secret) {
                    throw new Error('Missing client_secret from Stripe');
                }
                clientSecret = paymentIntent.client_secret;
                paymentIntentId = paymentIntent.id;
            }
            catch (error) {
                logger_1.default.error('Stripe payment intent creation failed', {
                    message: error instanceof Error ? error.message : 'Unknown',
                    error,
                });
                throw new errors_1.CheckoutError('PAYMENT_FAILED', 'Failed to initialize payment');
            }
        }
        // 3. Update Redis with PI details
        reservation.client_secret = clientSecret;
        reservation.payment_intent_id = paymentIntentId;
        // Calculate remaining TTL
        const ttl = Math.max(0, Math.floor((new Date(reservation.expires_at).getTime() - Date.now()) / 1000));
        if (ttl > 0) {
            await redis_1.default.set(`reservation:${reservationId}`, JSON.stringify(reservation), 'EX', ttl);
        }
        return {
            client_secret: clientSecret,
            payment_intent_id: paymentIntentId,
            amount: reservation.total_cents,
            currency: reservation.currency,
        };
    }
    async confirm(userId, reservationId, paymentIntentId, email, tx) {
        // 1. Get Reservation
        const rawReservation = await redis_1.default.get(`reservation:${reservationId}`);
        if (!rawReservation) {
            throw new errors_1.CheckoutError('RESERVATION_NOT_FOUND', 'Reservation not found or expired');
        }
        const reservation = JSON.parse(rawReservation);
        // Validate ownership
        // If user is authenticated, must match reservation.user_id
        // If user is guest, reservation.user_id must be guest (and we rely on reservationId secrecy)
        if (userId && reservation.user_id !== userId) {
            throw new errors_1.CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation belongs to another user');
        }
        // If anonymous, ensure reservation is for a guest
        if (!userId && !reservation.user_id.startsWith('guest:')) {
            throw new errors_1.CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation requires authentication');
        }
        // 2. Validate Stripe
        let paymentIntent;
        if (paymentIntentId.startsWith('pi_mock_')) {
            // MOCK MODE: Skip Stripe validation
            logger_1.default.warn('Skipping Stripe validation for MOCK payment intent', { paymentIntentId });
            paymentIntent = {
                id: paymentIntentId,
                status: 'succeeded',
                receipt_email: email || 'guest@mock.com',
            };
        }
        else {
            try {
                paymentIntent = await stripe_1.default.paymentIntents.retrieve(paymentIntentId);
            }
            catch (e) {
                throw new errors_1.CheckoutError('PAYMENT_FAILED', 'Invalid Payment Intent');
            }
            if (paymentIntent.status !== 'succeeded') {
                // If payment failed, we release stock as per prompt requirements
                await this.cancel(reservation.user_id, reservationId);
                throw new errors_1.CheckoutError('PAYMENT_FAILED', `Payment status is ${paymentIntent.status}`);
            }
        }
        // 3. Create Order & Update Stock
        const executeTransaction = async (trx) => {
            // Create Order
            const newOrder = await this.repo.createOrder(trx, {
                userId: userId || undefined, // undefined if guest
                guestEmail: !userId ? email || paymentIntent.receipt_email || undefined : undefined,
                totalCents: reservation.total_cents,
                currency: reservation.currency,
                stripePaymentIntentId: paymentIntentId,
                items: reservation.items.map((i) => ({
                    productVariantId: i.product_variant_id,
                    quantity: i.quantity,
                    unitPriceCents: i.unit_price_cents,
                    totalPriceCents: i.total_price_cents,
                })),
            });
            // Update Stock (Permanent deduction)
            for (const item of reservation.items) {
                await this.repo.confirmStockDeduction(trx, item.product_variant_id, item.quantity);
                await this.repo.createInventoryLog(trx, {
                    productVariantId: item.product_variant_id,
                    changeType: client_1.InventoryChangeType.CHECKOUT_CONFIRMED,
                    quantityDiff: -item.quantity,
                    orderId: Number(newOrder.id),
                });
            }
            return newOrder;
        };
        let order;
        try {
            if (tx) {
                order = await executeTransaction(tx);
            }
            else {
                order = await prisma_1.default.$transaction(executeTransaction);
            }
        }
        catch (e) {
            logger_1.default.error('Order creation failed', { error: e });
            throw new Error('Order creation failed');
        }
        // 4. Cleanup Redis
        await redis_1.default.del(`reservation:${reservationId}`);
        await redis_1.default.del(`reservation:user:${reservation.user_id}`);
        await redis_1.default.zrem('reservations:by_expiry', reservationId);
        return {
            order_id: order.id.toString(),
            order_number: order.id.toString(), // Assuming ID is order number for now
            status: client_1.OrderStatus.PAID,
            total_cents: order.totalCents,
        };
    }
    async cancel(userId, reservationId, tx) {
        const rawReservation = await redis_1.default.get(`reservation:${reservationId}`);
        if (!rawReservation) {
            return { message: 'Reservation already expired or not found' };
        }
        const reservation = JSON.parse(rawReservation);
        // Validate ownership
        if (userId && reservation.user_id !== userId) {
            throw new errors_1.CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation belongs to another user');
        }
        // If anonymous, ensure reservation is for a guest
        if (!userId && !reservation.user_id.startsWith('guest:')) {
            throw new errors_1.CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation requires authentication');
        }
        // Release Stock
        const executeTransaction = async (trx) => {
            for (const item of reservation.items) {
                await this.repo.releaseReservedStock(trx, item.product_variant_id, item.quantity);
                await this.repo.createInventoryLog(trx, {
                    productVariantId: item.product_variant_id,
                    changeType: client_1.InventoryChangeType.RELEASE,
                    quantityDiff: -item.quantity,
                });
            }
        };
        if (tx) {
            await executeTransaction(tx);
        }
        else {
            await prisma_1.default.$transaction(executeTransaction);
        }
        // Cleanup Redis
        await redis_1.default.del(`reservation:${reservationId}`);
        await redis_1.default.del(`reservation:user:${reservation.user_id}`);
        await redis_1.default.zrem('reservations:by_expiry', reservationId);
        return { message: 'Reservation cancelled' };
    }
    async getStatus(userId, reservationId) {
        const rawReservation = await redis_1.default.get(`reservation:${reservationId}`);
        if (!rawReservation) {
            return { status: 'expired' };
        }
        const reservation = JSON.parse(rawReservation);
        if (userId && reservation.user_id !== userId) {
            throw new errors_1.CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation belongs to another user');
        }
        // If anonymous, ensure reservation is for a guest
        if (!userId && !reservation.user_id.startsWith('guest:')) {
            throw new errors_1.CheckoutError('RESERVATION_USER_MISMATCH', 'Reservation requires authentication');
        }
        return {
            status: 'active',
            expires_at: reservation.expires_at,
            seconds_remaining: Math.floor((new Date(reservation.expires_at).getTime() - Date.now()) / 1000),
        };
    }
}
exports.CheckoutService = CheckoutService;

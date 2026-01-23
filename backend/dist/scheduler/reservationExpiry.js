"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const redis_1 = __importDefault(require("../lib/redis"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const logger_1 = __importDefault(require("../lib/logger"));
const client_1 = require("@prisma/client");
// Check every minute
node_cron_1.default.schedule('*/1 * * * *', async () => {
    logger_1.default.info('Running reservation expiry job');
    const now = Date.now();
    try {
        // 1. Get expired reservations
        const expiredReservationIds = await redis_1.default.zrangebyscore('reservations:by_expiry', 0, now);
        if (expiredReservationIds.length === 0) {
            return;
        }
        logger_1.default.info(`Found ${expiredReservationIds.length} expired reservations`);
        for (const reservationId of expiredReservationIds) {
            try {
                const rawReservation = await redis_1.default.get(`reservation:${reservationId}`);
                if (!rawReservation) {
                    // Already gone? Remove from sorted set
                    await redis_1.default.zrem('reservations:by_expiry', reservationId);
                    continue;
                }
                const reservation = JSON.parse(rawReservation);
                // Release stock
                await prisma_1.default.$transaction(async (tx) => {
                    for (const item of reservation.items) {
                        await tx.productVariant.update({
                            where: { id: BigInt(item.product_variant_id) },
                            data: {
                                reservedStock: { decrement: item.quantity },
                            },
                        });
                        await tx.inventoryLog.create({
                            data: {
                                productVariantId: BigInt(item.product_variant_id),
                                changeType: client_1.InventoryChangeType.RELEASE_EXPIRED,
                                quantityDiff: item.quantity,
                            },
                        });
                    }
                });
                // Cleanup Redis
                await redis_1.default.del(`reservation:${reservationId}`);
                await redis_1.default.del(`reservation:user:${reservation.user_id}`);
                await redis_1.default.zrem('reservations:by_expiry', reservationId);
                logger_1.default.info(`Expired reservation ${reservationId} released`);
            }
            catch (err) {
                logger_1.default.error(`Failed to process expired reservation ${reservationId}`, { error: err });
            }
        }
    }
    catch (error) {
        logger_1.default.error('Reservation expiry job failed', { error });
    }
});

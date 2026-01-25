"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processExpiredReservationsOnce = processExpiredReservationsOnce;
exports.startExpirationScheduler = startExpirationScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const redis_1 = __importDefault(require("../lib/redis"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const logger_1 = __importDefault(require("../lib/logger"));
const client_1 = require("@prisma/client");
const inventory_socket_1 = require("../websocket/inventory.socket");
async function processExpiredReservationsOnce() {
    const now = Date.now();
    try {
        const expiredReservationIds = await redis_1.default.zrangebyscore('reservations:by_expiry', 0, now);
        if (expiredReservationIds.length === 0) {
            return;
        }
        logger_1.default.info(`Found ${expiredReservationIds.length} expired reservations`);
        for (const reservationId of expiredReservationIds) {
            try {
                const rawReservation = await redis_1.default.get(`reservation:${reservationId}`);
                if (!rawReservation) {
                    await redis_1.default.zrem('reservations:by_expiry', reservationId);
                    continue;
                }
                const reservation = JSON.parse(rawReservation);
                await prisma_1.default.$transaction(async (tx) => {
                    for (const item of reservation.items) {
                        const updatedVariant = await tx.productVariant.update({
                            where: { id: BigInt(item.product_variant_id) },
                            data: {
                                reservedStock: { decrement: item.quantity },
                            },
                        });
                        // Emit stock update
                        const available = updatedVariant.initialStock - updatedVariant.reservedStock;
                        (0, inventory_socket_1.emitStockUpdate)(Number(updatedVariant.productId), available);
                        await tx.inventoryLog.create({
                            data: {
                                productVariantId: BigInt(item.product_variant_id),
                                changeType: client_1.InventoryChangeType.RELEASE_EXPIRED,
                                quantityDiff: item.quantity,
                            },
                        });
                    }
                });
                // Remove from expiry queue but KEEP the data for abandoned cart recovery
                // The data will expire naturally via Redis TTL (24h) or be processed by recovery service
                await redis_1.default.zrem('reservations:by_expiry', reservationId);
                // Add to a set of potential abandoned carts to scan
                await redis_1.default.sadd('reservations:abandoned', reservationId);
                logger_1.default.info(`Expired reservation ${reservationId} released and marked for recovery check`);
            }
            catch (err) {
                logger_1.default.error(`Failed to process expired reservation ${reservationId}`, { error: err });
            }
        }
    }
    catch (error) {
        logger_1.default.error('Reservation expiry job failed', { error });
    }
}
function startExpirationScheduler() {
    // Every 60 seconds
    node_cron_1.default.schedule('*/1 * * * *', () => {
        logger_1.default.info('Running reservation expiry job');
        void processExpiredReservationsOnce();
    });
}

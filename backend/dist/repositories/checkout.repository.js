"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutRepository = void 0;
const client_1 = require("@prisma/client");
class CheckoutRepository {
    /**
     * Finds a product variant by ID and locks it for update.
     * Also fetches the parent product's max_per_customer setting.
     */
    async findVariantWithLock(tx, variantId) {
        // Using $queryRaw for SELECT ... FOR UPDATE to ensure consistency
        const variants = await tx.$queryRaw `
      SELECT 
        pv.id, 
        pv.product_id, 
        pv.sku, 
        pv.initial_stock, 
        pv.reserved_stock,
        p.price_cents,
        p.currency,
        p.max_per_customer
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.id = ${variantId}
      FOR UPDATE
    `;
        return variants[0] || null;
    }
    async updateReservedStock(tx, variantId, quantityDelta) {
        await tx.productVariant.update({
            where: { id: variantId },
            data: {
                reservedStock: { increment: quantityDelta },
            },
        });
    }
    async createInventoryLog(tx, data) {
        await tx.inventoryLog.create({
            data: {
                productVariantId: data.productVariantId,
                changeType: data.changeType,
                quantityDiff: data.quantityDiff,
                orderId: data.orderId,
            },
        });
    }
    async createOrder(tx, data) {
        return tx.order.create({
            data: {
                userId: data.userId,
                guestEmail: data.guestEmail,
                status: client_1.OrderStatus.PAID,
                totalCents: data.totalCents,
                currency: data.currency,
                stripePaymentIntentId: data.stripePaymentIntentId,
                items: {
                    create: data.items.map((item) => ({
                        productVariantId: item.productVariantId,
                        quantity: item.quantity,
                        unitPriceCents: item.unitPriceCents,
                        totalPriceCents: item.totalPriceCents,
                    })),
                },
            },
        });
    }
    async releaseReservedStock(tx, variantId, quantity) {
        await tx.productVariant.update({
            where: { id: BigInt(variantId) },
            data: {
                reservedStock: { decrement: quantity },
            },
        });
    }
    async confirmStockDeduction(tx, variantId, quantity) {
        // When confirmed, we reduce reserved_stock AND initial_stock
        await tx.productVariant.update({
            where: { id: variantId },
            data: {
                reservedStock: { decrement: quantity },
                initialStock: { decrement: quantity },
            },
        });
    }
    async releaseStock(tx, variantId, quantity) {
        await tx.productVariant.update({
            where: { id: variantId },
            data: {
                reservedStock: { decrement: quantity },
            },
        });
    }
    async countUserPastPurchases(tx, userId, productId) {
        const result = await tx.orderItem.aggregate({
            _sum: {
                quantity: true,
            },
            where: {
                order: {
                    userId: userId,
                    status: { not: client_1.OrderStatus.CANCELLED },
                },
                productVariant: {
                    productId: productId,
                },
            },
        });
        return result._sum.quantity || 0;
    }
}
exports.CheckoutRepository = CheckoutRepository;

import { PrismaClient, InventoryChangeType, OrderStatus } from '@prisma/client';

// Helper type for Transaction
export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class CheckoutRepository {
  /**
   * Finds a product variant by ID and locks it for update.
   * Also fetches the parent product's max_per_customer setting.
   */
  async findVariantWithLock(tx: PrismaTransaction, variantId: number) {
    // Using $queryRaw for SELECT ... FOR UPDATE to ensure consistency
    const variants = await tx.$queryRaw<
      Array<{
        id: bigint;
        product_id: bigint;
        sku: string;
        initial_stock: number;
        reserved_stock: number;
        price_cents: number;
        currency: string;
        max_per_customer: number | null;
      }>
    >`
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

  async updateReservedStock(tx: PrismaTransaction, variantId: number, quantityDelta: number) {
    await tx.productVariant.update({
      where: { id: variantId },
      data: {
        reservedStock: { increment: quantityDelta },
      },
    });
  }

  async createInventoryLog(
    tx: PrismaTransaction,
    data: {
      productVariantId: number | bigint;
      changeType: InventoryChangeType;
      quantityDiff: number;
      orderId?: number | bigint;
    }
  ) {
    await tx.inventoryLog.create({
      data: {
        productVariantId: data.productVariantId,
        changeType: data.changeType,
        quantityDiff: data.quantityDiff,
        orderId: data.orderId,
      },
    });
  }

  async createOrder(
    tx: PrismaTransaction,
    data: {
      userId: string | undefined;
      guestEmail?: string;
      totalCents: number;
      currency: string;
      stripePaymentIntentId: string;
      items: Array<{
        productVariantId: number | bigint;
        quantity: number;
        unitPriceCents: number;
        totalPriceCents: number;
      }>;
    }
  ) {
    return tx.order.create({
      data: {
        userId: data.userId,
        guestEmail: data.guestEmail,
        status: OrderStatus.PAID,
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

  async releaseReservedStock(tx: PrismaTransaction, variantId: number | bigint, quantity: number) {
    return await tx.productVariant.update({
      where: { id: BigInt(variantId) },
      data: {
        reservedStock: { decrement: quantity },
      },
    });
  }

  async confirmStockDeduction(tx: PrismaTransaction, variantId: number | bigint, quantity: number) {
    // When confirmed, we reduce reserved_stock AND initial_stock
    return await tx.productVariant.update({
      where: { id: variantId },
      data: {
        reservedStock: { decrement: quantity },
        initialStock: { decrement: quantity },
      },
    });
  }

  async releaseStock(tx: PrismaTransaction, variantId: number | bigint, quantity: number) {
    await tx.productVariant.update({
      where: { id: variantId },
      data: {
        reservedStock: { decrement: quantity },
      },
    });
  }

  async countUserPastPurchases(tx: PrismaTransaction, userId: string, productId: bigint) {
    const result = await tx.orderItem.aggregate({
      _sum: {
        quantity: true,
      },
      where: {
        order: {
          userId: userId,
          status: { not: OrderStatus.CANCELLED },
        },
        productVariant: {
          productId: productId,
        },
      },
    });
    return result._sum.quantity || 0;
  }
}

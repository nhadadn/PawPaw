import { InventoryChangeType } from '@prisma/client';
import prisma from '../lib/prisma';
import { CheckoutRepository, PrismaTransaction } from '../repositories/checkout.repository';

export class InventoryService {
  private repo: CheckoutRepository;

  constructor() {
    this.repo = new CheckoutRepository();
  }

  /**
   * Confirms inventory deduction for a sold item.
   * Decrements both reservedStock and initialStock.
   */
  async confirmStock(
    productVariantId: number,
    quantity: number,
    orderId?: number,
    tx?: PrismaTransaction
  ) {
    const operation = async (transaction: PrismaTransaction) => {
      await this.repo.confirmStockDeduction(transaction, productVariantId, quantity);

      await this.repo.createInventoryLog(transaction, {
        productVariantId,
        changeType: InventoryChangeType.CHECKOUT_CONFIRMED,
        quantityDiff: -quantity,
        orderId,
      });
    };

    if (tx) {
      await operation(tx);
    } else {
      await prisma.$transaction(operation);
    }
  }

  /**
   * Releases reserved stock (e.g. payment failed or reservation expired).
   * Decrements only reservedStock.
   */
  async releaseStock(
    productVariantId: number,
    quantity: number,
    orderId?: number,
    tx?: PrismaTransaction
  ) {
    const operation = async (transaction: PrismaTransaction) => {
      await this.repo.releaseReservedStock(transaction, productVariantId, quantity);

      await this.repo.createInventoryLog(transaction, {
        productVariantId,
        changeType: InventoryChangeType.RELEASE,
        quantityDiff: -quantity, // Logic: we are removing the "hold", so it's a negative diff in "reserved" context?
        // Wait, InventoryLog typically tracks "change in available" or "change in absolute"?
        // In CheckoutService.cancel: changeType: 'release', quantityDiff: -item.quantity
        // In CheckoutService.reserve: changeType: 'reserve', quantityDiff: item.quantity
        // So 'release' undoes 'reserve'.
        orderId,
      });
    };

    if (tx) {
      await operation(tx);
    } else {
      await prisma.$transaction(operation);
    }
  }

  /**
   * Manual adjustment (e.g. admin or correction).
   */
  async adjustStock(
    productVariantId: number,
    initialStockDelta: number,
    reservedStockDelta: number,
    reason: string,
    tx?: PrismaTransaction
  ) {
    const operation = async (transaction: PrismaTransaction) => {
      await transaction.productVariant.update({
        where: { id: productVariantId },
        data: {
          initialStock: { increment: initialStockDelta },
          reservedStock: { increment: reservedStockDelta },
        },
      });

      await this.repo.createInventoryLog(transaction, {
        productVariantId,
        changeType: InventoryChangeType.UPDATE,
        quantityDiff: initialStockDelta, // Logging the main stock change
      });
    };

    if (tx) {
      await operation(tx);
    } else {
      await prisma.$transaction(operation);
    }
  }
}

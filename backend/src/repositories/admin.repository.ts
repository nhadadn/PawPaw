import prisma from '../lib/prisma';
import { OrderStatus, UserRole } from '@prisma/client';

export class AdminRepository {
  // Products
  async findAllProducts(limit = 10, offset = 0) {
    return prisma.product.findMany({
      take: limit,
      skip: offset,
      include: {
        category: true,
        variants: true,
        images: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProductById(id: number) {
    return prisma.product.findUnique({
      where: { id: BigInt(id) },
      include: {
        category: true,
        variants: true,
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async createProductWithVariant(data: any, initialStock: number) {
    const { images, ...productData } = data;

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: productData,
      });

      if (images && images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((url: string, index: number) => ({
            productId: product.id,
            url,
            order: index,
          })),
        });
      }

      // Create default variant
      await tx.productVariant.create({
        data: {
          productId: product.id,
          initialStock: initialStock,
          sku: `${data.slug}-001`,
        },
      });

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          variants: true,
          images: {
            orderBy: { order: 'asc' },
          },
        },
      });
    });
  }

  async createProduct(data: any) {
    return prisma.product.create({
      data,
    });
  }

  async updateProduct(
    id: number,
    data: any,
    imageOrder?: { type: 'existing' | 'new'; id?: string; index?: number }[],
    newImageUrls?: string[],
    stock?: number
  ) {
    const { ...updateData } = data; // Removed unused newImages

    return prisma.$transaction(async (tx) => {
      // 1. Update basic product data
      await tx.product.update({
        where: { id: BigInt(id) },
        data: updateData,
      });

      // 2. Update Stock (Default Variant)
      if (typeof stock === 'number') {
        const variants = await tx.productVariant.findMany({
          where: { productId: BigInt(id) },
        });
        if (variants.length > 0) {
          await tx.productVariant.update({
            where: { id: variants[0].id },
            data: { initialStock: stock },
          });
        }
      }

      // 3. Handle images
      if (imageOrder && Array.isArray(imageOrder)) {
        // Get all current images to check which ones to keep
        const currentImages = await tx.productImage.findMany({
          where: { productId: BigInt(id) },
        });
        const currentIds = currentImages.map((img) => img.id.toString());

        // Identify images to keep from order
        const keptIds = imageOrder
          .filter((item) => item.type === 'existing')
          .map((item) => item.id);

        // Delete removed images
        const toDelete = currentIds.filter((id) => !keptIds.includes(id));
        if (toDelete.length > 0) {
          await tx.productImage.deleteMany({
            where: {
              id: { in: toDelete.map((id) => BigInt(id)) },
            },
          });
        }

        // Update order of existing and create new ones
        for (let i = 0; i < imageOrder.length; i++) {
          const item = imageOrder[i];
          if (item.type === 'existing' && item.id) {
            await tx.productImage.update({
              where: { id: BigInt(item.id) },
              data: { order: i },
            });
          } else if (item.type === 'new' && typeof item.index === 'number' && newImageUrls) {
            const url = newImageUrls[item.index];
            if (url) {
              await tx.productImage.create({
                data: {
                  productId: BigInt(id),
                  url: url,
                  order: i,
                },
              });
            }
          }
        }

        // Update main imageUrl for compatibility
        const firstImage = await tx.productImage.findFirst({
          where: { productId: BigInt(id) },
          orderBy: { order: 'asc' },
        });
        if (firstImage) {
          await tx.product.update({
            where: { id: BigInt(id) },
            data: { imageUrl: firstImage.url },
          });
        }
      } else if (newImageUrls && newImageUrls.length > 0) {
        // Fallback: Just append new images
        const lastImage = await tx.productImage.findFirst({
          where: { productId: BigInt(id) },
          orderBy: { order: 'desc' },
        });
        const startOrder = (lastImage?.order ?? -1) + 1;
        await tx.productImage.createMany({
          data: newImageUrls.map((url, index) => ({
            productId: BigInt(id),
            url,
            order: startOrder + index,
          })),
        });
      }

      // Return full product with relations
      return tx.product.findUnique({
        where: { id: BigInt(id) },
        include: {
          category: true,
          variants: true,
          images: {
            orderBy: { order: 'asc' },
          },
        },
      });
    });
  }

  async deleteProduct(id: number) {
    return prisma.product.delete({
      where: { id: BigInt(id) },
    });
  }

  // Categories
  async findAllCategories() {
    return prisma.category.findMany();
  }

  async createCategory(data: any) {
    return prisma.category.create({
      data,
    });
  }

  async updateCategory(id: number, data: any) {
    return prisma.category.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  async deleteCategory(id: number) {
    return prisma.category.delete({
      where: { id: BigInt(id) },
    });
  }

  // Orders
  async findAllOrders(limit = 10, offset = 0) {
    return prisma.order.findMany({
      take: limit,
      skip: offset,
      include: {
        user: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOrderById(id: number) {
    return prisma.order.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: true,
        items: true,
      },
    });
  }

  async updateOrderStatus(id: number, status: OrderStatus) {
    return prisma.order.update({
      where: { id: BigInt(id) },
      data: { status },
    });
  }

  // Inventory
  async updateInventory(
    variantId: number,
    data: { initialStock?: number; reservedStock?: number }
  ) {
    return prisma.productVariant.update({
      where: { id: BigInt(variantId) },
      data,
    });
  }

  // Users
  async findAllUsers(limit = 10, offset = 0) {
    return prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(id: string, role: UserRole) {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  // Stats
  async getDashboardStats() {
    const [totalOrders, totalProducts, totalUsers, totalSales, recentOrdersRaw, lowStockCount] =
      await Promise.all([
        prisma.order.count(),
        prisma.product.count(),
        prisma.user.count(),
        prisma.order.aggregate({
          _sum: {
            totalCents: true,
          },
          where: {
            status: OrderStatus.PAID,
          },
        }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        }),
        prisma.productVariant.count({
          where: {
            initialStock: { lt: 5 }, // Low stock threshold
          },
        }),
      ]);

    // Get top products by revenue
    const topProductsRaw = await prisma.orderItem.groupBy({
      by: ['productVariantId'],
      _sum: {
        quantity: true,
        totalPriceCents: true,
      },
      orderBy: {
        _sum: { totalPriceCents: 'desc' },
      },
      take: 5,
    });

    // Enrich top products with product details
    const topProducts = await Promise.all(
      topProductsRaw.map(async (item) => {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.productVariantId },
          include: { product: true },
        });

        if (!variant || !variant.product) return null;

        return {
          id: variant.product.id.toString(),
          name: variant.product.name, // + (variant.size ? ` (${variant.size})` : ''),
          sales: item._sum.quantity || 0,
          revenue: item._sum.totalPriceCents || 0,
        };
      })
    );

    return {
      totalOrders,
      totalProducts,
      totalUsers,
      totalSales: totalSales._sum.totalCents || 0,
      lowStockProducts: lowStockCount,
      recentOrders: recentOrdersRaw.map((o) => ({
        id: o.id.toString(),
        customerName: o.user?.email || 'Guest',
        total: o.totalCents,
        status: o.status,
        createdAt: o.createdAt,
      })),
      topProducts: topProducts.filter(Boolean),
    };
  }
}

import prisma from '../lib/prisma';

export class AdminRepository {
  // Products
  async findAllProducts(limit = 10, offset = 0) {
    return prisma.product.findMany({
      take: limit,
      skip: offset,
      include: {
        category: true,
        variants: true,
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
      },
    });
  }

  async createProduct(data: any) {
    return prisma.product.create({
      data,
    });
  }

  async updateProduct(id: number, data: any) {
    return prisma.product.update({
      where: { id: BigInt(id) },
      data,
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

  async updateOrderStatus(id: number, status: string) {
    return prisma.order.update({
      where: { id: BigInt(id) },
      data: { status },
    });
  }

  // Inventory
  async updateInventory(variantId: number, data: { initialStock?: number; reservedStock?: number }) {
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

  async updateUserRole(id: string, role: string) {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }
  
  // Stats
  async getDashboardStats() {
      const [totalOrders, totalProducts, totalUsers, totalSales] = await Promise.all([
          prisma.order.count(),
          prisma.product.count(),
          prisma.user.count(),
          prisma.order.aggregate({
              _sum: {
                  totalCents: true
              },
              where: {
                  status: 'paid'
              }
          })
      ]);
      
      return {
          totalOrders,
          totalProducts,
          totalUsers,
          totalSales: totalSales._sum.totalCents || 0
      };
  }
}

import prisma from '../lib/prisma';

export class ShopRepository {
  async findAllProducts(limit = 20, offset = 0, categorySlug?: string) {
    const where: any = { isActive: true };
    
    if (categorySlug) {
      where.category = {
        slug: categorySlug
      };
    }

    return prisma.product.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        category: true,
        variants: true,
        images: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findProductById(id: number) {
    return prisma.product.findFirst({
      where: { 
        id: BigInt(id),
        isActive: true 
      },
      include: {
        category: true,
        variants: true,
        images: {
          orderBy: { order: 'asc' }
        }
      },
    });
  }

  async findProductBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: true,
        images: {
          orderBy: { order: 'asc' }
        }
      },
    });
  }

  async findAllCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          include: {
            variants: true,
          }
        }
      }
    });
  }
}

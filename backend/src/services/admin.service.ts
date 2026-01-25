import { AdminRepository } from '../repositories/admin.repository';
import { OrderStatus, UserRole, Prisma } from '@prisma/client';
import { CacheService } from './cache.service';

export class AdminService {
  private repository: AdminRepository;
  private cache: CacheService;

  constructor() {
    this.repository = new AdminRepository();
    this.cache = new CacheService();
  }

  // Products
  async getProducts(limit: number, offset: number) {
    const products = await this.repository.findAllProducts(limit, offset);
    // Convert BigInt to string for JSON serialization if needed, or rely on serializer
    return products.map((p) => ({
      ...p,
      id: p.id.toString(),
      categoryId: p.categoryId?.toString(),
      price: p.priceCents / 100, // Convert to unit
      stock: p.variants.reduce((acc, v) => acc + (v.initialStock - v.reservedStock), 0), // Calculate total stock
      images:
        p.images?.map((img) => ({
          id: img.id.toString(),
          url: img.url,
          order: img.order,
        })) || [],
    }));
  }

  async createProduct(
    data: Prisma.ProductUncheckedCreateInput & { initialStock?: number; images?: string[] }
  ) {
    const { initialStock, ...productData } = data;

    // Create product and default variant if stock provided
    const product = await this.repository.createProductWithVariant(
      // Ensure slug is present as required by the repository method signature we updated
      productData as Prisma.ProductUncheckedCreateInput & { images?: string[]; slug: string },
      initialStock || 0
    );

    if (!product) {
      throw new Error('Failed to create product');
    }

    await this.cache.del('products:list:*');

    return {
      ...product,
      id: product.id.toString(),
      stock: initialStock || 0,
      images:
        product.images?.map((img) => ({
          id: img.id.toString(),
          url: img.url,
          order: img.order,
        })) || [],
    };
  }

  async getProduct(id: number) {
    const product = await this.repository.findProductById(id);
    if (!product) return null;
    return {
      ...product,
      id: product.id.toString(),
      categoryId: product.categoryId?.toString(),
      variants: product.variants.map((v) => ({
        ...v,
        id: v.id.toString(),
        productId: v.productId.toString(),
      })),
      images:
        product.images?.map((img) => ({
          id: img.id.toString(),
          url: img.url,
          order: img.order,
        })) || [],
    };
  }

  async updateProduct(
    id: number,
    data: Prisma.ProductUpdateInput & {
      imageOrder?: { type: 'existing' | 'new'; id?: string; index?: number }[];
      newImages?: string[];
    },
    stock?: number
  ) {
    const { imageOrder, newImages, ...updateData } = data;
    const product = await this.repository.updateProduct(
      id,
      updateData,
      imageOrder,
      newImages,
      stock
    );

    if (!product) {
      throw new Error('Failed to update product');
    }

    return {
      ...product,
      id: product.id.toString(),
      images:
        product.images?.map((img) => ({
          id: img.id.toString(),
          url: img.url,
          order: img.order,
        })) || [],
    };
  }

  async deleteProduct(id: number) {
    const product = await this.repository.deleteProduct(id);
    return { ...product, id: product.id.toString() };
  }

  // Categories
  async getCategories() {
    const categories = await this.repository.findAllCategories();
    return categories.map((c) => ({ ...c, id: c.id.toString() }));
  }

  async createCategory(data: Prisma.CategoryCreateInput) {
    const category = await this.repository.createCategory(data);
    await this.cache.del('categories:list');
    return { ...category, id: category.id.toString() };
  }

  async updateCategory(id: number, data: Prisma.CategoryUpdateInput) {
    const category = await this.repository.updateCategory(id, data);
    await this.cache.del('categories:list');
    return { ...category, id: category.id.toString() };
  }

  async deleteCategory(id: number) {
    const category = await this.repository.deleteCategory(id);
    await this.cache.del('categories:list');
    return { ...category, id: category.id.toString() };
  }

  // Orders
  async getOrders(limit: number, offset: number) {
    const orders = await this.repository.findAllOrders(limit, offset);
    return orders.map((o) => ({
      ...o,
      id: o.id.toString(),
      items: o.items.map((i) => ({
        ...i,
        id: i.id.toString(),
        orderId: i.orderId.toString(),
        productVariantId: i.productVariantId.toString(),
      })),
    }));
  }

  async getOrder(id: number) {
    const order = await this.repository.findOrderById(id);
    if (!order) return null;
    return {
      ...order,
      id: order.id.toString(),
      items: order.items.map((i) => ({
        ...i,
        id: i.id.toString(),
        orderId: i.orderId.toString(),
        productVariantId: i.productVariantId.toString(),
      })),
    };
  }

  async updateOrderStatus(id: number, status: OrderStatus) {
    const order = await this.repository.updateOrderStatus(id, status);
    return { ...order, id: order.id.toString() };
  }

  // Inventory
  async updateInventory(
    variantId: number,
    data: { initialStock?: number; reservedStock?: number }
  ) {
    const variant = await this.repository.updateInventory(variantId, data);
    return { ...variant, id: variant.id.toString(), productId: variant.productId.toString() };
  }

  // Users
  async getUsers(limit: number, offset: number) {
    return this.repository.findAllUsers(limit, offset);
  }

  async updateUserStatus(id: string, role: UserRole) {
    return this.repository.updateUserRole(id, role);
  }

  // Dashboard
  async getDashboardStats() {
    const stats = await this.repository.getDashboardStats();
    return {
      ...stats,
      totalSales: stats.totalSales, // Assuming int is safe, or convert to string if massive
    };
  }
}

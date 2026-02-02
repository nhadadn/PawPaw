import { ShopRepository } from '../repositories/shop.repository';
import { Prisma } from '@prisma/client';
import { CacheService } from './cache.service';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    variants: true;
    images: true;
  };
}>;

export class ShopService {
  private repository: ShopRepository;
  private cache: CacheService;

  constructor() {
    this.repository = new ShopRepository();
    this.cache = new CacheService();
  }

  private transformProduct(product: ProductWithRelations) {
    const images =
      product.images?.map((img) => ({
        ...img,
        id: img.id.toString(),
        productId: img.productId.toString(),
      })) || [];

    // Fallback: If imageUrl is missing but we have images, use the first one
    const imageUrl = product.imageUrl || (images.length > 0 ? images[0].url : '');

    return {
      ...product,
      id: product.id.toString(),
      categoryId: product.categoryId?.toString(),
      price: (product.priceCents || 0) / 100,
      stock: product.variants?.reduce((acc, v) => acc + (v.initialStock - v.reservedStock), 0) || 0,
      // Transform category object to name string as expected by frontend type, or keep object if needed?
      // Frontend type says string, but some components might expect object.
      // ProductCard renders {product.category}, so it expects string.
      category: product.category?.name || 'Uncategorized',
      variants:
        product.variants?.map((v) => ({
          ...v,
          id: v.id.toString(),
          productId: v.productId.toString(),
        })) || [],
      imageUrl, // Ensure imageUrl is populated
      videoUrl: (product as any).videoUrl || undefined,
      images,
    };
  }

  async getProducts(limit: number, offset: number, categorySlug?: string) {
    const cacheKey = `products:list:${limit}:${offset}:${categorySlug || 'all'}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.repository.findAllProducts(limit, offset, categorySlug);
    const result = products.map((p) => this.transformProduct(p));

    await this.cache.set(cacheKey, result);
    return result;
  }

  async getProduct(id: number) {
    const product = await this.repository.findProductById(id);
    if (!product) return null;
    return this.transformProduct(product);
  }

  async getProductBySlug(slug: string) {
    const cacheKey = `product:detail:${slug}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.repository.findProductBySlug(slug);
    if (!product) return null;

    const result = this.transformProduct(product);
    await this.cache.set(cacheKey, result);
    return result;
  }

  async getCategories() {
    const cacheKey = 'categories:list';
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await this.repository.findAllCategories();
    const result = categories.map((c) => ({ ...c, id: c.id.toString() }));

    await this.cache.set(cacheKey, result);
    return result;
  }
}

import { ShopRepository } from '../repositories/shop.repository';

export class ShopService {
  private repository: ShopRepository;

  constructor() {
    this.repository = new ShopRepository();
  }

  private transformProduct(product: any) {
    const images = product.images?.map((img: any) => ({
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
      price: product.priceCents / 100,
      stock: product.variants.reduce((acc: number, v: any) => acc + (v.initialStock - v.reservedStock), 0),
      // Transform category object to name string as expected by frontend type, or keep object if needed?
      // Frontend type says string, but some components might expect object.
      // ProductCard renders {product.category}, so it expects string.
      category: product.category?.name || 'Uncategorized', 
      variants: product.variants.map((v: any) => ({
        ...v,
        id: v.id.toString(),
        productId: v.productId.toString(),
      })),
      imageUrl, // Ensure imageUrl is populated
      images
    };
  }

  async getProducts(limit: number, offset: number, categorySlug?: string) {
    const products = await this.repository.findAllProducts(limit, offset, categorySlug);
    return products.map(p => this.transformProduct(p));
  }

  async getProduct(id: number) {
    const product = await this.repository.findProductById(id);
    if (!product) return null;
    return this.transformProduct(product);
  }

  async getCategories() {
    const categories = await this.repository.findAllCategories();
    return categories.map(c => ({ ...c, id: c.id.toString() }));
  }
}

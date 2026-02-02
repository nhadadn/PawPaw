export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  stock: number;
  isNew?: boolean;
  discount?: number;
  totalReviews?: number;
  averageRating?: number;
  availableSizes?: string[];
}

export interface ProductImage {
  id: string;
  url: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  videoUrl?: string | null;
  images?: ProductImage[];
  category: string;
  variants: ProductVariant[];
  stock: number;
}

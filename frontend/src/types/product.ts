export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  variants: ProductVariant[];
  stock: number;
}

import type { Product } from './product';

export interface AdminStats {
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  lowStockProducts: number;
  recentOrders: AdminOrderSummary[];
  topProducts: AdminProductSummary[];
}

export interface AdminOrderSummary {
  id: string;
  customerName: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface AdminProductSummary {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface AdminState {
  isAuthenticated: boolean;
  token: string | null;
  user: AdminUser | null;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

// Extended types for Admin CRUD

export interface AdminProduct extends Product {
  // Add any admin-specific fields if necessary
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  createdAt?: string;
}

export interface AdminOrder {
  id: string;
  userId: string;
  user?: { name: string; email: string };
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminInventoryItem {
  id: string; // Product ID
  name: string;
  sku?: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
}

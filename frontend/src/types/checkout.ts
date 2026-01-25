export interface CartItem {
  id: string; // Product ID (simple) or Variant ID
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock?: number;
}

export interface ReservationItem {
  product_variant_id: number;
  quantity: number;
}

export interface Reservation {
  id: string;
  items: ReservationItem[];
  total_cents: number;
  expires_at: string;
  created_at: string;
  status: 'active' | 'expired' | 'completed';
  client_secret?: string;
}

export interface OrderItem {
  id: string;
  product_variant_id: string;
  quantity: number;
  price: number;
  name: string;
}

export interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'shipped';
  items: OrderItem[];
  created_at: string;
}

export interface PaymentIntent {
  client_secret: string;
  id: string;
}

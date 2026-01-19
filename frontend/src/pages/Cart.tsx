import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { CartItem } from '../components/features/cart/CartItem';
import { CartSummary } from '../components/features/cart/CartSummary';
import { Button } from '../components/ui/Button';

export function Cart() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-6 animate-fade-in">
        <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-display font-bold text-neutral-900">Tu carrito está vacío</h1>
        <p className="text-neutral-500 max-w-md mx-auto">
          Parece que aún no has agregado nada. Explora nuestra colección y encuentra tu estilo.
        </p>
        <Link to="/products">
          <Button size="lg">
            Ir a la Tienda
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold mb-8">Tu Carrito</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
             <div className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <CartItem 
                    key={item.id} 
                    item={item} 
                    onUpdateQuantity={updateQuantity} 
                    onRemove={removeItem} 
                  />
                ))}
             </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <CartSummary total={totalPrice()} itemCount={totalItems()} />
        </div>
      </div>
    </div>
  );
}

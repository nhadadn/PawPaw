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
      <div className="container mx-auto px-4 py-20 text-center space-y-6 animate-fade-in min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-400 dark:text-neutral-500">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-bold text-neutral-900 dark:text-white">
            Tu carrito está vacío
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            Parece que aún no has agregado nada. Explora nuestra colección y encuentra tu estilo.
          </p>
        </div>
        <Link to="/products">
          <Button
            size="xl"
            className="h-14 px-8 text-lg font-bold bg-black hover:bg-neutral-800 text-white shadow-xl shadow-black/20"
          >
            Ir a la Tienda
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-4xl font-display font-bold mb-8 text-neutral-900 dark:text-white">
        Tu Carrito
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
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

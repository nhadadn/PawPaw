import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../../stores/cartStore';
import { Button } from '../../ui/Button';
import { CartItem } from './CartItem';
import { formatCurrency } from '../../../lib/utils';
import { cn } from '../../../lib/utils';

export function CartDrawer() {
  const {
    isDrawerOpen,
    closeDrawer,
    items,
    updateQuantity,
    removeItem,
    totalPrice,
    drawerAutoClose,
  } = useCartStore();

  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Sync state with prop during render to avoid effect flash/warning
  if (isDrawerOpen && !isVisible) {
    setIsVisible(true);
  }

  // Handle animation and body scroll
  useEffect(() => {
    if (isDrawerOpen) {
      // Disable body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // When closing, wait for animation
      if (isVisible) {
        const timer = setTimeout(() => setIsVisible(false), 300); // Match transition duration
        document.body.style.overflow = 'unset';
        return () => clearTimeout(timer);
      }
      document.body.style.overflow = 'unset';
    }
  }, [isDrawerOpen, isVisible]);

  // Handle auto-close
  useEffect(() => {
    if (isDrawerOpen && drawerAutoClose && !isHovered) {
      const timer = setTimeout(() => {
        closeDrawer();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isDrawerOpen, drawerAutoClose, isHovered, closeDrawer]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isDrawerOpen, closeDrawer]);

  if (!isVisible && !isDrawerOpen) return null;

  const handleCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isDrawerOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          'relative w-full sm:w-[400px] bg-white dark:bg-neutral-900 h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-neutral-200 dark:border-neutral-800',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-display font-bold">Tu Carrito</h2>
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-neutral-500 dark:text-neutral-400">
              <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
              </div>
              <p>Tu carrito está vacío</p>
              <Button
                variant="outline"
                size="sm"
                onClick={closeDrawer}
                className="dark:text-white dark:border-neutral-200 dark:hover:bg-neutral-800"
              >
                Seguir Comprando
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  className="py-4"
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        {items.length > 0 && (
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Subtotal</span>
                <span>{formatCurrency(totalPrice())}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold text-neutral-900 dark:text-white">
                <span>Total</span>
                <span>{formatCurrency(totalPrice())}</span>
              </div>
            </div>

            <Button className="w-full gap-2 group" size="lg" onClick={handleCheckout}>
              Ir a Pagar
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>

            <p className="text-xs text-center text-neutral-500 dark:text-neutral-500 mt-3">
              Envío e impuestos calculados en el checkout
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

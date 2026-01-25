import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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

  // Swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchCurrent, setTouchCurrent] = useState<number | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Sync state with prop during render to avoid effect flash/warning
  if (isDrawerOpen && !isVisible) {
    setIsVisible(true);
  }

  // Handle animation, body scroll and focus trap
  useEffect(() => {
    if (isDrawerOpen) {
      // Disable body scroll
      document.body.style.overflow = 'hidden';

      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus trap init - focus first element
      const focusable = drawerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        // Small timeout to ensure render is complete/transition started
        setTimeout(() => (focusable[0] as HTMLElement).focus(), 50);
      }
    } else {
      // When closing, wait for animation
      if (isVisible) {
        const timer = setTimeout(() => setIsVisible(false), 300); // Match transition duration
        document.body.style.overflow = 'unset';

        // Restore focus
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }

        return () => clearTimeout(timer);
      }
      document.body.style.overflow = 'unset';
    }
  }, [isDrawerOpen, isVisible]);

  // Handle auto-close
  useEffect(() => {
    // Pause auto-close if hovered or currently touching/swiping
    if (isDrawerOpen && drawerAutoClose && !isHovered && touchStart === null) {
      const timer = setTimeout(() => {
        closeDrawer();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isDrawerOpen, drawerAutoClose, isHovered, touchStart, closeDrawer]);

  // Handle Escape key and Focus Trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDrawerOpen) return;

      if (e.key === 'Escape') {
        closeDrawer();
      }

      if (e.key === 'Tab') {
        const focusable = drawerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const firstElement = focusable[0] as HTMLElement;
        const lastElement = focusable[focusable.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentTouch = e.targetTouches[0].clientX;
    // Only allow swiping right (closing)
    if (currentTouch < touchStart) return;
    setTouchCurrent(currentTouch);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchCurrent === null) {
      setTouchStart(null);
      setTouchCurrent(null);
      return;
    }
    const distance = touchCurrent - touchStart;
    const threshold = 100; // px to close
    if (distance > threshold) {
      closeDrawer();
    }
    setTouchStart(null);
    setTouchCurrent(null);
  };

  const translateX =
    touchStart !== null && touchCurrent !== null ? Math.max(0, touchCurrent - touchStart) : 0;

  if (!isVisible && !isDrawerOpen) return null;

  const handleCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300',
          isDrawerOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className={cn(
          'relative w-full sm:w-[450px] bg-white dark:bg-[#141414] h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-neutral-200 dark:border-neutral-800',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={
          touchStart !== null && touchCurrent !== null
            ? { transform: `translateX(${translateX}px)` }
            : undefined
        }
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#141414]">
          <div className="flex items-center gap-3 text-neutral-900 dark:text-white">
            <ShoppingBag className="w-6 h-6 text-primary dark:text-white" />
            <h2 className="text-xl font-display font-bold tracking-tight">
              Tu Carrito ({items.length})
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 dark:text-neutral-400"
            aria-label="Cerrar carrito"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-neutral-400" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  Tu carrito está vacío
                </p>
                <p className="text-neutral-500 dark:text-neutral-400 max-w-[200px] mx-auto">
                  ¡Explora nuestra colección y encuentra algo increíble!
                </p>
              </div>
              <Button onClick={closeDrawer} size="lg" className="min-w-[200px]">
                Explorar Productos
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  className="py-2"
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        {items.length > 0 && (
          <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141414]">
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 font-medium">
                <span>Subtotal</span>
                <span>{formatCurrency(totalPrice())}</span>
              </div>
              <div className="flex items-center justify-between text-2xl font-display font-bold text-neutral-900 dark:text-white">
                <span>Total</span>
                <span>{formatCurrency(totalPrice())}</span>
              </div>
            </div>

            <Button
              className="w-full gap-2 group h-14 text-lg font-bold"
              size="lg"
              onClick={handleCheckout}
            >
              IR A PAGAR
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <p className="text-xs text-center text-neutral-500 dark:text-neutral-500 mt-4 font-medium">
              Envío e impuestos calculados en el checkout
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

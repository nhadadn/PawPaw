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
          'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isDrawerOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className={cn(
          'relative w-full sm:w-[400px] bg-white dark:bg-neutral-900 h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-neutral-200 dark:border-neutral-800',
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
    </div>,
    document.body
  );
}

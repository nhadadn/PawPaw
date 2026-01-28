import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../../stores/cartStore';

interface CartSummaryProps {
  total: number;
  itemCount: number;
}

export function CartSummary({ total, itemCount }: CartSummaryProps) {
  const navigate = useNavigate();
  const { items } = useCartStore();
  const shipping = total > 999 ? 0 : 150;
  const finalTotal = total + shipping;

  // Check if any item exceeds stock
  const hasStockIssues = items.some((item) => {
    // If stock is undefined, we assume it's available (or handle as unlimited)
    // If stock is defined, we check quantity
    return item.stock !== undefined && item.quantity > item.stock;
  });

  return (
    <div className="bg-background-surface rounded-xl p-6 space-y-6 sticky top-24 border border-neutral-200 dark:border-neutral-800 transition-colors shadow-sm">
      <h2 className="text-xl font-bold font-display text-text-primary">Resumen del Pedido</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-text-secondary">
          <span>Subtotal ({itemCount} productos)</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between text-text-secondary">
          <span>Envío estimado</span>
          <span className={shipping === 0 ? 'text-success font-bold' : ''}>
            {shipping === 0 ? 'Gratis' : formatCurrency(shipping)}
          </span>
        </div>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
        <div className="flex justify-between items-end mb-1">
          <span className="font-bold text-lg text-text-primary">Total</span>
          <span className="font-bold text-3xl text-text-primary">{formatCurrency(finalTotal)}</span>
        </div>
        <p className="text-xs text-text-secondary text-right">Impuestos incluidos</p>
      </div>

      {hasStockIssues && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium">
          Algunos productos superan el stock disponible. Por favor ajusta las cantidades.
        </div>
      )}

      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20"
          onClick={() => navigate('/checkout')}
          disabled={hasStockIssues}
        >
          Proceder al Pago
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <Link
          to="/products"
          className="block text-center text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-accent dark:hover:text-accent transition-colors"
        >
          Continuar comprando
        </Link>
      </div>

      {/* Promo Code */}
      <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
        <label className="text-sm font-bold text-neutral-900 dark:text-white">
          Código Promocional
        </label>
        <div className="flex gap-2">
          <Input
            placeholder="PAWPAW2024"
            className="bg-white dark:bg-neutral-800 h-11"
            aria-label="Ingresar código promocional"
          />
          <Button
            variant="outline"
            className="h-11 px-6 dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}

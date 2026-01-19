import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

interface CartSummaryProps {
  total: number;
  itemCount: number;
}

export function CartSummary({ total, itemCount }: CartSummaryProps) {
  const navigate = useNavigate();
  const shipping = total > 999 ? 0 : 150;
  const finalTotal = total + shipping;

  return (
    <div className="bg-neutral-50 rounded-xl p-6 space-y-6 sticky top-24">
      <h2 className="text-xl font-bold font-display">Resumen del Pedido</h2>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal ({itemCount} productos)</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Envío estimado</span>
          <span className={shipping === 0 ? 'text-green-600 font-bold' : ''}>
            {shipping === 0 ? 'Gratis' : formatCurrency(shipping)}
          </span>
        </div>
      </div>

      <div className="border-t border-neutral-200 pt-4">
        <div className="flex justify-between items-end mb-1">
          <span className="font-bold text-lg">Total</span>
          <span className="font-bold text-2xl text-primary">{formatCurrency(finalTotal)}</span>
        </div>
        <p className="text-xs text-neutral-500 text-right">Impuestos incluidos</p>
      </div>

      <div className="space-y-3">
        <Button size="lg" className="w-full" onClick={() => navigate('/checkout')}>
          Proceder al Pago
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <Link to="/products" className="block text-center text-sm text-neutral-500 hover:text-primary underline">
          Continuar comprando
        </Link>
      </div>

      {/* Promo Code */}
      <div className="pt-6 border-t border-neutral-200 space-y-3">
        <label className="text-sm font-bold text-neutral-900">Código Promocional</label>
        <div className="flex gap-2">
          <Input placeholder="PAWPAW2024" className="bg-white" />
          <Button variant="outline">Aplicar</Button>
        </div>
      </div>
    </div>
  );
}
import { Link } from 'react-router-dom';

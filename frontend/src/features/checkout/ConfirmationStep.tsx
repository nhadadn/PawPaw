import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { CheckCircle2, ShoppingBag, Package, Truck, ArrowRight } from 'lucide-react';
import type { Order } from '../../types/checkout';
import { useNavigate } from 'react-router-dom';
import { useCheckoutStore } from '../../stores/checkoutStore';
import { formatCurrency } from '../../lib/utils';

interface ConfirmationStepProps {
  order: Order | null;
}

export function ConfirmationStep({ order }: ConfirmationStepProps) {
  const navigate = useNavigate();
  const { clearCheckout } = useCheckoutStore();

  const handleContinueShopping = () => {
    clearCheckout();
    navigate('/');
  };

  const handleTrackOrder = () => {
    // Mock tracking navigation
    navigate('/account/orders');
  };

  // Calculate estimated delivery (3-5 days from now)
  const today = new Date();
  const deliveryStart = new Date(today);
  deliveryStart.setDate(today.getDate() + 3);
  const deliveryEnd = new Date(today);
  deliveryEnd.setDate(today.getDate() + 5);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  };

  if (!order) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-4 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
          ¡Gracias por tu compra!
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto">
          Tu orden ha sido confirmada y está siendo procesada. Hemos enviado los detalles a tu
          correo electrónico.
        </p>
      </div>

      <Card className="overflow-hidden border-neutral-200 dark:border-neutral-800 shadow-xl shadow-neutral-100/50 dark:shadow-neutral-900/50">
        <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
              Número de Orden
            </p>
            <p className="text-xl font-mono font-bold text-neutral-900 dark:text-white">
              #{order.order_number}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTrackOrder}
            className="gap-2 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            <Package className="w-4 h-4" />
            Rastrear Pedido
          </Button>
        </div>

        <CardContent className="p-6 md:p-8 space-y-8">
          {/* Delivery Estimate */}
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100/50 dark:border-blue-800/30">
            <div className="p-4 bg-white dark:bg-blue-900/40 rounded-full shadow-sm text-primary">
              <Truck className="w-8 h-8" />
            </div>
            <div className="text-center md:text-left space-y-1 flex-1">
              <p className="font-semibold text-neutral-900 dark:text-white text-lg">
                Estimación de Entrega
              </p>
              <p className="text-neutral-600 dark:text-neutral-300 font-medium">
                {formatDate(deliveryStart)} - {formatDate(deliveryEnd)}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Envío Estándar a tu dirección registrada
              </p>
            </div>
          </div>

          {/* Order Summary (Simplified) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-neutral-900 dark:text-white">
              <ShoppingBag className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
              Resumen del Pedido
            </h3>
            <div className="border border-neutral-100 dark:border-neutral-800 rounded-xl overflow-hidden">
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="font-medium text-neutral-900 dark:text-white">
                        {item.name}{' '}
                        <span className="text-neutral-400 dark:text-neutral-500 font-normal text-sm ml-1">
                          x{item.quantity}
                        </span>
                      </div>
                    </div>
                    <div className="font-medium text-neutral-900 dark:text-white">
                      ${((item.price * item.quantity) / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800">
                <span className="font-bold text-neutral-900 dark:text-white">Total Pagado</span>
                <span className="font-bold text-xl text-primary">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="w-full sm:w-auto min-w-[200px]"
              onClick={handleContinueShopping}
            >
              Seguir Comprando
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

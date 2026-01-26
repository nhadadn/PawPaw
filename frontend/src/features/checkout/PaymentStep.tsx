import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Timer } from '../../components/ui/Timer';
import { Alert } from '../../components/ui/Alert';
import { AxiosError } from 'axios';
import type { ApiError } from '../../types/api';
import { useCheckoutConfirm } from '../../hooks/useCheckout';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useCheckoutStore } from '../../stores/checkoutStore';
import { useCartStore } from '../../stores/cartStore';
import { CreditCard, ShieldCheck, Lock, Package, Clock } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

// TODO: Replace with env variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentStepProps {
  reservationId: string;
  expiresAt: Date;
  clientSecret?: string;
  onExpire?: () => void;
}

function MockPaymentForm({ reservationId }: { reservationId: string }) {
  const { setConfirmedOrder, setStep } = useCheckoutStore();
  const {
    mutate: confirmPayment,
    isPending: isConfirming,
    error: confirmError,
  } = useCheckoutConfirm();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated && !email) {
      setErrorMessage('Por favor ingresa tu email');
      return;
    }

    setErrorMessage(null);

    // Simulamos un ID de payment intent basado en la reserva
    const mockPaymentIntentId = `pi_mock_${reservationId}`;

    confirmPayment(
      {
        reservation_id: reservationId,
        payment_intent_id: mockPaymentIntentId,
        email: email || undefined,
      },
      {
        onSuccess: (data) => {
          setConfirmedOrder(data);
          setStep('confirmation');
        },
        onError: (err) => {
          const error = err as AxiosError<ApiError>;
          setErrorMessage(error.response?.data?.message || 'Error al confirmar la orden');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert variant="warning" title="Modo de Prueba">
        Estás usando un entorno de desarrollo con claves dummy. El pago será simulado
        automáticamente.
      </Alert>

      {!isAuthenticated && (
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Correo Electrónico (para tu recibo)
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex h-10 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm ring-offset-white dark:ring-offset-neutral-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:text-white"
            placeholder="tu@email.com"
            required
          />
        </div>
      )}

      <div className="p-4 border rounded-lg bg-neutral-50">
        <p className="text-sm text-neutral-600 mb-2 font-medium">Tarjeta Simulada</p>
        <div className="bg-white border border-neutral-200 h-12 rounded flex items-center px-4 text-neutral-500 text-sm gap-2">
          <CreditCard className="w-4 h-4" />
          **** **** **** 4242
        </div>
      </div>

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {confirmError && (
        <Alert variant="error">
          {(confirmError as AxiosError<ApiError>).response?.data?.message || 'Error en el servidor'}
        </Alert>
      )}

      <Button
        className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        size="lg"
        variant="primary"
        type="submit"
        disabled={isConfirming}
        isLoading={isConfirming}
      >
        Pagar Ahora
      </Button>
    </form>
  );
}

function PaymentForm({ reservationId }: { reservationId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { setConfirmedOrder, setStep } = useCheckoutStore();
  const {
    mutate: confirmPayment,
    isPending: isConfirming,
    error: confirmError,
  } = useCheckoutConfirm();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    if (!isAuthenticated && !email) {
      setErrorMessage('Por favor ingresa tu email');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin, // Not used for redirect=if_required
          receipt_email: isAuthenticated ? user?.email : email,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        setErrorMessage(stripeError.message || 'Error en el pago');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // 2. Confirm order with Backend
        confirmPayment(
          {
            reservation_id: reservationId,
            payment_intent_id: paymentIntent.id,
            email: email || undefined,
          },
          {
            onSuccess: (data) => {
              setConfirmedOrder(data);
              setStep('confirmation');
              setIsProcessing(false);
            },
            onError: (err) => {
              const error = err as AxiosError<ApiError>;
              setErrorMessage(error.response?.data?.message || 'Error al confirmar la orden');
              setIsProcessing(false);
            },
          }
        );
      } else {
        // Handle other statuses (processing, requires_action, etc.)
        // For now, if it's not succeeded immediately and no error was thrown,
        // it might be processing.
        if (paymentIntent && paymentIntent.status === 'processing') {
          setErrorMessage('El pago se está procesando. Te notificaremos cuando se complete.');
          // Optionally redirect to a pending status page
        } else {
          setErrorMessage(
            `El estado del pago es: ${paymentIntent?.status}. Por favor contacta soporte.`
          );
        }
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment Error:', err);
      setErrorMessage('Ocurrió un error inesperado durante el pago.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert variant="info" className="bg-blue-50 border-blue-100 text-blue-800">
        <Lock className="w-4 h-4 mr-2 inline" />
        Tus productos están reservados. No cierres esta ventana.
      </Alert>

      {!isAuthenticated && (
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-neutral-700">
            Correo Electrónico (para tu recibo)
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            placeholder="tu@email.com"
            required
          />
        </div>
      )}

      <div className="p-4 border border-neutral-200 rounded-lg bg-white shadow-sm">
        <PaymentElement />
      </div>

      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

      {confirmError && (
        <Alert variant="error">
          {(confirmError as AxiosError<ApiError>).response?.data?.message || 'Error en el servidor'}
        </Alert>
      )}

      <Button
        className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        size="lg"
        variant="primary"
        type="submit"
        disabled={!stripe || isProcessing || isConfirming}
        isLoading={isProcessing || isConfirming}
      >
        Pagar Ahora
      </Button>

      <div className="flex items-center justify-center gap-2 text-neutral-400 text-xs">
        <ShieldCheck className="w-4 h-4" />
        <span>Pagos procesados de forma segura por Stripe</span>
      </div>
    </form>
  );
}

export function PaymentStep({
  reservationId,
  expiresAt,
  clientSecret,
  onExpire,
}: PaymentStepProps) {
  const { items, totalPrice } = useCartStore();
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#FF6B35',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
      },
    },
  };

  // Determine which form to show
  const showMockForm = !clientSecret && import.meta.env.DEV;
  const showStripeForm = !!clientSecret;

  if (!showMockForm && !showStripeForm) {
    return (
      <Alert variant="error">
        Error de configuración: No se pudo iniciar el pago (Falta clientSecret).
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Payment Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-surface p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-bold">Tiempo restante para completar tu compra:</span>
          </div>
          <Timer expiresAt={expiresAt} onExpire={onExpire} />
        </div>

        <Card>
          <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <CardTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="w-5 h-5 text-primary" />
              Detalles del Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {showStripeForm ? (
              <Elements options={options} stripe={stripePromise}>
                <PaymentForm reservationId={reservationId} />
              </Elements>
            ) : (
              <MockPaymentForm reservationId={reservationId} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Order Summary (Simplified) */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <Card>
            <CardHeader className="pb-4 border-b border-neutral-100 bg-neutral-50/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-neutral-600" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{item.name}</p>
                      <p className="text-xs text-neutral-500">Cant: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-neutral-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-100 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-neutral-900">Total a Pagar</span>
                  <span className="font-bold text-xl text-primary">
                    {formatCurrency(totalPrice())}
                  </span>
                </div>
                <p className="text-xs text-right text-neutral-500 mt-1">
                  * Incluye envío e impuestos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

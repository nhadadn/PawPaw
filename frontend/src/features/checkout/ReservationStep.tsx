import { Button } from '../../components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { useCartStore } from '../../stores/cartStore';
import { useCheckoutReserve, useCheckoutCreatePaymentIntent } from '../../hooks/useCheckout';
import { Alert } from '../../components/ui/Alert';
import { formatCurrency, getImageUrl } from '../../lib/utils';
import { AxiosError } from 'axios';
import type { ApiError } from '../../types/api';

interface ReservationStepProps {
  onSuccess: (reservationId: string, expiresAt: Date, clientSecret?: string) => void;
}

export function ReservationStep({ onSuccess }: ReservationStepProps) {
  const { items, totalPrice } = useCartStore();
  const { mutate: reserve, isPending: isReserving, error: reserveError } = useCheckoutReserve();
  const {
    mutate: createPaymentIntent,
    isPending: isCreatingPayment,
    error: paymentError,
  } = useCheckoutCreatePaymentIntent();

  const handleReserve = () => {
    reserve(
      {
        items: items.map((item) => ({
          product_variant_id: Number(item.id), // Using item.id as variant ID for simplicity
          quantity: item.quantity,
        })),
      },
      {
        onSuccess: (data) => {
          if (data.client_secret) {
            onSuccess(data.id, new Date(data.expires_at), data.client_secret);
          } else {
            createPaymentIntent(
              { reservation_id: data.id },
              {
                onSuccess: (paymentData) => {
                  onSuccess(data.id, new Date(data.expires_at), paymentData.client_secret);
                },
                // If payment intent creation fails, we still have a reservation, but can't pay yet.
                // The error will be shown.
              }
            );
          }
        },
      }
    );
  };

  const isPending = isReserving || isCreatingPayment;
  const error = reserveError || paymentError;

  if (items.length === 0) {
    return (
      <Alert variant="info" title="Carrito vacío">
        Agrega productos a tu carrito para continuar.
      </Alert>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Tu Carrito</CardTitle>
          <CardDescription>Revisa tus items antes de reservar el stock.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border-b pb-4 last:border-0"
            >
              <div className="flex gap-4">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md bg-neutral-200"
                />
                <div>
                  <h4 className="font-bold">{item.name}</h4>
                  {/* <p className="text-sm text-neutral-500">
                    Size: {item.size}
                  </p> */}
                  <p className="text-sm font-bold mt-1">{formatCurrency(item.price)}</p>
                </div>
              </div>
              <div className="text-sm font-medium">x{item.quantity}</div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-2xl text-primary">{formatCurrency(totalPrice())}</span>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          {error && (
            <Alert variant="error" title="Error al reservar">
              {(error as AxiosError<ApiError>).response?.data?.message ||
                'Ocurrió un error inesperado.'}
            </Alert>
          )}

          <Button className="w-full" size="lg" onClick={handleReserve} isLoading={isPending}>
            Reservar Stock
          </Button>
          <p className="text-xs text-center text-neutral-500">
            Al reservar, tendrás 10 minutos para completar tu pago.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

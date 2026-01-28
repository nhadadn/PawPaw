import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useCartStore } from '../../stores/cartStore';
import { useCheckoutStore } from '../../stores/checkoutStore';
import {
  useCheckoutReserve,
  useCheckoutCreatePaymentIntent,
  useValidateReservation,
} from '../../hooks/useCheckout';
import { Alert } from '../../components/ui/Alert';
import { formatCurrency, cn } from '../../lib/utils';
import { Truck, MapPin, Package, ShieldCheck } from 'lucide-react';

const reservationSchema = z.object({
  fullName: z.string().min(3, 'El nombre completo es requerido'),
  email: z.string().email('Email inválido'),
  address: z.string().min(5, 'La dirección es requerida'),
  city: z.string().min(2, 'La ciudad es requerida'),
  state: z.string().min(2, 'El estado es requerido'),
  zipCode: z.string().min(4, 'Código postal requerido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  shippingMethod: z.enum(['standard', 'express']),
});

type ReservationForm = z.infer<typeof reservationSchema>;

export function ReservationStep() {
  const { items, totalPrice, removeItem } = useCartStore();
  const { setStep, setReservation, setClientSecret, reservation, formData, setFormData } =
    useCheckoutStore();
  const [expirationError, setExpirationError] = useState(false);
  const { mutate: reserve, isPending: isReserving, error: reserveError } = useCheckoutReserve();
  const {
    mutate: createPaymentIntent,
    isPending: isCreatingPayment,
    error: paymentError,
  } = useCheckoutCreatePaymentIntent();

  const error = reserveError || paymentError;

  // Extract invalid variant ID from error message if present
  // Backend returns: "Variant {id} not found"
  const errorMessage =
    error instanceof Error ? error.message : 'Ocurrió un error al procesar tu solicitud';
  // Check if it's an axios error with response data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiErrorMessage = (error as any)?.response?.data?.message || errorMessage;

  const variantNotFoundMatch = apiErrorMessage?.match(/Variant (\d+) not found/);
  const invalidVariantId = variantNotFoundMatch ? variantNotFoundMatch[1] : null;

  const handleRemoveInvalidItem = () => {
    if (invalidVariantId) {
      removeItem(invalidVariantId);
      // Force reload or just let the UI update since items comes from store
    }
  };

  // Validate existing reservation
  const { isExpired } = useValidateReservation(reservation?.id ?? null);

  useEffect(() => {
    if (isExpired) {
      setExpirationError(true);
    }
  }, [isExpired]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    // reset,
    formState: { errors },
  } = useForm<ReservationForm>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      shippingMethod: 'standard',
      ...formData,
    },
  });

  // Restore form data from store if available (e.g. on mount)
  /* useEffect(() => {
    if (formData) {
      reset(formData);
    }
  }, [formData, reset]); */

  // Persist form data to store on change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch((value) => {
      setFormData(value as ReservationForm);
    });
    return () => subscription.unsubscribe();
  }, [watch, setFormData]);

  const shippingMethod = useWatch({ control, name: 'shippingMethod' });
  const shippingCost = shippingMethod === 'express' ? 15000 : 0; // $150.00 vs Free
  const total = totalPrice() + shippingCost;

  const onSubmit = (data: ReservationForm) => {
    // 1. Create Reservation
    reserve(
      {
        ...data,
        items: items.map((item) => ({
          product_variant_id: Number(item.id),
          quantity: item.quantity,
        })),
      },
      {
        onSuccess: (reservation) => {
          setReservation(reservation);

          // 2. Create Payment Intent
          createPaymentIntent(
            { reservation_id: reservation.id },
            {
              onSuccess: (paymentIntent) => {
                setClientSecret(paymentIntent.client_secret);
                setStep('payment');
              },
            }
          );
        },
      }
    );
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 text-lg mb-4">Tu carrito está vacío.</p>
        <Button onClick={() => (window.location.href = '/products')}>Ver Productos</Button>
      </div>
    );
  }

  const isLoading = isReserving || isCreatingPayment;
  // const error = reserveError || paymentError; // We will handle error display manually

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Form */}
      <div className="lg:col-span-2 space-y-6">
        {(reserveError || paymentError) && (
          <Alert variant="error" title="Error">
            <div className="flex flex-col gap-3">
              <p>{apiErrorMessage}</p>
              {invalidVariantId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveInvalidItem}
                  className="w-fit bg-background-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-primary border-neutral-200 dark:border-neutral-800"
                  type="button"
                >
                  Eliminar producto no disponible del carrito
                </Button>
              )}
            </div>
          </Alert>
        )}

        {expirationError && (
          <Alert variant="warning" title="Sesión Expirada">
            Tu sesión de reserva ha expirado. Por favor intenta nuevamente.
          </Alert>
        )}

        <form id="reservation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Shipping Address */}
          <Card>
            <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="w-5 h-5 text-primary" />
                Dirección de Envío
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-text-primary">Nombre Completo</label>
                <Input
                  {...register('fullName')}
                  placeholder="Ej. Juan Pérez"
                  error={errors.fullName?.message}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-text-primary">Email</label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="juan@ejemplo.com"
                  error={errors.email?.message}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-text-primary">Dirección</label>
                <Input
                  {...register('address')}
                  placeholder="Calle Principal 123, Col. Centro"
                  error={errors.address?.message}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Ciudad</label>
                <Input
                  {...register('city')}
                  placeholder="Ciudad de México"
                  error={errors.city?.message}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Estado</label>
                <Input {...register('state')} placeholder="CDMX" error={errors.state?.message} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Código Postal</label>
                <Input
                  {...register('zipCode')}
                  placeholder="01234"
                  error={errors.zipCode?.message}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Teléfono</label>
                <Input
                  {...register('phone')}
                  placeholder="55 1234 5678"
                  error={errors.phone?.message}
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping Method */}
          <Card>
            <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Truck className="w-5 h-5 text-primary" />
                Método de Envío
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <label
                className={cn(
                  'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50',
                  shippingMethod === 'standard'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary dark:bg-primary/10'
                    : 'border-neutral-200 dark:border-neutral-800'
                )}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    value="standard"
                    {...register('shippingMethod')}
                    className="w-4 h-4 text-primary"
                  />
                  <div>
                    <p className="font-medium text-text-primary">Envío Estándar</p>
                    <p className="text-sm text-text-secondary">3-5 días hábiles</p>
                  </div>
                </div>
                <span className="font-medium text-success">Gratis</span>
              </label>

              <label
                className={cn(
                  'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50',
                  shippingMethod === 'express'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary dark:bg-primary/10'
                    : 'border-neutral-200 dark:border-neutral-800'
                )}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    value="express"
                    {...register('shippingMethod')}
                    className="w-4 h-4 text-primary"
                  />
                  <div>
                    <p className="font-medium text-text-primary">Envío Express</p>
                    <p className="text-sm text-text-secondary">1-2 días hábiles</p>
                  </div>
                </div>
                <span className="font-medium text-text-primary">{formatCurrency(15000)}</span>
              </label>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Right Column: Summary */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b border-neutral-100 bg-background-surface">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-text-secondary" />
                Resumen del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                      <p className="text-xs text-text-secondary">Cant: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-text-primary">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-medium text-text-primary">
                    {formatCurrency(totalPrice())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Envío</span>
                  <span
                    className={
                      shippingCost === 0
                        ? 'text-success font-medium'
                        : 'font-medium text-text-primary'
                    }
                  >
                    {shippingCost === 0 ? 'Gratis' : formatCurrency(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <span className="font-bold text-lg text-text-primary">Total</span>
                  <span className="font-bold text-lg text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg text-sm">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <p>Tu información está protegida con encriptación SSL de 256-bits.</p>
            </div>

            {(error || expirationError) && (
              <Alert variant="error" title="Error">
                {expirationError
                  ? 'Tu reserva ha expirado. Por favor, inicia el proceso nuevamente.'
                  : error instanceof Error
                    ? error.message
                    : 'Ocurrió un error al procesar tu solicitud.'}
              </Alert>
            )}

            <Button
              type="submit"
              form="reservation-form"
              className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              isLoading={isLoading}
            >
              Continuar al Pago
            </Button>

            <p className="text-xs text-center text-neutral-400">
              Al continuar, aceptas nuestros términos y condiciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

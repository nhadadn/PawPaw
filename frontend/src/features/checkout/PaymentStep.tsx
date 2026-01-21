import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "../../components/ui/Button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/Card"
import { Timer } from "../../components/ui/Timer"
import { Alert } from "../../components/ui/Alert"
import type { Order } from "../../types/checkout"
import { AxiosError } from "axios"
import type { ApiError } from "../../types/api"
import { useCheckoutConfirm } from "../../hooks/useCheckout"
import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"

// TODO: Replace with env variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentStepProps {
  reservationId: string
  expiresAt: Date
  clientSecret?: string
  onSuccess: (orderData: Order) => void
  onExpire: () => void
}

function MockPaymentForm({ reservationId, onSuccess }: { reservationId: string, onSuccess: (data: Order) => void }) {
  const { mutate: confirmPayment, isPending: isConfirming, error: confirmError } = useCheckoutConfirm()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const { isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated && !email) {
      setErrorMessage("Por favor ingresa tu email")
      return
    }

    setErrorMessage(null)

    // Simulamos un ID de payment intent basado en la reserva
    // Esto debe coincidir con lo que el backend espera o ser manejado por el backend
    const mockPaymentIntentId = `pi_mock_${reservationId}`

    confirmPayment(
      {
        reservation_id: reservationId,
        payment_intent_id: mockPaymentIntentId,
        email: email || undefined,
      },
      {
        onSuccess: (data) => {
          onSuccess(data)
        },
        onError: (err) => {
            const error = err as AxiosError<ApiError>;
            setErrorMessage(error.response?.data?.message || "Error al confirmar la orden")
        }
      }
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        <Alert variant="warning" title="Modo de Prueba">
          Estás usando un entorno de desarrollo con claves dummy. El pago será simulado automáticamente.
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
              className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="tu@email.com"
              required
            />
          </div>
        )}
        
        <div className="p-4 border rounded-lg bg-neutral-50">
            <p className="text-sm text-neutral-600 mb-2">Tarjeta Simulada:</p>
            <div className="bg-neutral-200 h-10 rounded animate-pulse flex items-center px-4 text-neutral-500 text-sm">
                **** **** **** 4242
            </div>
        </div>

        {errorMessage && (
            <Alert variant="error">{errorMessage}</Alert>
        )}
        
        {confirmError && (
            <Alert variant="error">{(confirmError as AxiosError<ApiError>).response?.data?.message || "Error en el servidor"}</Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          size="lg" 
          variant="success"
          type="submit"
          disabled={isConfirming}
          isLoading={isConfirming}
        >
          Pagar (Simulado)
        </Button>
      </CardFooter>
    </form>
  )
}

function PaymentForm({ reservationId, onSuccess }: { reservationId: string, onSuccess: (data: Order) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const { mutate: confirmPayment, isPending: isConfirming, error: confirmError } = useCheckoutConfirm()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { isAuthenticated, user } = useAuthStore()
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    if (!isAuthenticated && !email) {
      setErrorMessage("Por favor ingresa tu email")
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // 1. Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin, // Not used for redirect=if_required
          receipt_email: isAuthenticated ? user?.email : email,
        },
        redirect: "if_required",
      })

      if (stripeError) {
        setErrorMessage(stripeError.message || "Error en el pago")
        setIsProcessing(false)
        return
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // 2. Confirm order with Backend
        confirmPayment(
          {
            reservation_id: reservationId,
            payment_intent_id: paymentIntent.id,
            email: email || undefined,
          },
          {
            onSuccess: (data) => {
              onSuccess(data)
            },
            onError: (err) => {
                const error = err as AxiosError<ApiError>;
                setErrorMessage(error.response?.data?.message || "Error al confirmar la orden")
                setIsProcessing(false)
            }
          }
        )
      }
    } catch {
      setErrorMessage("Ocurrió un error inesperado")
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        <Alert variant="info">
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
              className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="tu@email.com"
              required
            />
          </div>
        )}
        
        <div className="p-4 border rounded-lg bg-white">
            <PaymentElement />
        </div>

        {errorMessage && (
            <Alert variant="error">{errorMessage}</Alert>
        )}
        
        {confirmError && (
            <Alert variant="error">{(confirmError as AxiosError<ApiError>).response?.data?.message || "Error en el servidor"}</Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          size="lg" 
          variant="success"
          type="submit"
          disabled={!stripe || isProcessing || isConfirming}
          isLoading={isProcessing || isConfirming}
        >
          Pagar
        </Button>
      </CardFooter>
    </form>
  )
}

export function PaymentStep({ reservationId, expiresAt, clientSecret, onSuccess, onExpire }: PaymentStepProps) {
  
  if (!clientSecret) {
      return (
          <Alert variant="error">
              Error de configuración: No se pudo iniciar el pago (Falta clientSecret).
          </Alert>
      )
  }

  const options = {
    clientSecret,
    appearance: {
        theme: 'stripe' as const,
    },
  };

  const isMock = clientSecret.includes('_mock');

  if (isMock) {
     return (
        <div className="space-y-6 animate-slide-up">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
            <span className="font-bold text-neutral-700">Tiempo restante para comprar:</span>
            <Timer expiresAt={expiresAt} onExpire={onExpire} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pago Seguro (Test)</CardTitle>
              <CardDescription>Entorno de desarrollo - Pago simulado</CardDescription>
            </CardHeader>
            <MockPaymentForm reservationId={reservationId} onSuccess={onSuccess} />
          </Card>
        </div>
     )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
        <span className="font-bold text-neutral-700">Tiempo restante para comprar:</span>
        <Timer expiresAt={expiresAt} onExpire={onExpire} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pago Seguro</CardTitle>
          <CardDescription>Completa tu compra con tarjeta de crédito o débito.</CardDescription>
        </CardHeader>
        
        <Elements stripe={stripePromise} options={options}>
            <PaymentForm reservationId={reservationId} onSuccess={onSuccess} />
        </Elements>
      </Card>
    </div>
  )
}

import { useState } from "react"
import { ReservationStep } from "./ReservationStep"
import { PaymentStep } from "./PaymentStep"
import { ConfirmationStep } from "./ConfirmationStep"
import { Alert } from "../../components/ui/Alert"
import { Button } from "../../components/ui/Button"
import type { Order } from "../../types/checkout"

type CheckoutStep = "reservation" | "payment" | "confirmation"

export function CheckoutPage() {
  const [step, setStep] = useState<CheckoutStep>("reservation")
  const [reservationData, setReservationData] = useState<{ id: string; expiresAt: Date; clientSecret?: string } | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReservationSuccess = (id: string, expiresAt: Date, clientSecret?: string) => {
    setReservationData({ id, expiresAt, clientSecret })
    setStep("payment")
    setError(null)
  }

  const handlePaymentSuccess = (order: Order) => {
    setConfirmedOrder(order)
    setStep("confirmation")
  }

  const handleExpiration = () => {
    setError("La reserva ha expirado. Por favor, intenta nuevamente.")
    setStep("reservation")
    setReservationData(null)
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold text-primary">Checkout</h1>
          <div className="flex justify-center gap-2 text-sm font-medium text-neutral-400">
            <span className={step === "reservation" ? "text-secondary font-bold" : "text-success"}>1. Reserva</span>
            <span>→</span>
            <span className={step === "payment" ? "text-secondary font-bold" : step === "confirmation" ? "text-success" : ""}>2. Pago</span>
            <span>→</span>
            <span className={step === "confirmation" ? "text-success font-bold" : ""}>3. Confirmación</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" title="Ha ocurrido un error">
            {error}
            <div className="mt-2">
                <Button size="sm" variant="outline" onClick={() => setError(null)}>Entendido</Button>
            </div>
          </Alert>
        )}

        {/* Steps */}
        <div className="transition-all duration-300">
            {step === "reservation" && (
            <ReservationStep onSuccess={handleReservationSuccess} />
            )}

            {step === "payment" && reservationData && (
            <PaymentStep 
                reservationId={reservationData.id}
                expiresAt={reservationData.expiresAt} 
                clientSecret={reservationData.clientSecret}
                onSuccess={handlePaymentSuccess}
                onExpire={handleExpiration}
            />
            )}

            {step === "confirmation" && (
            <ConfirmationStep order={confirmedOrder} />
            )}
        </div>
      </div>
    </div>
  )
}

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReservationStep } from './ReservationStep';
import { PaymentStep } from './PaymentStep';
import { ConfirmationStep } from './ConfirmationStep';
import { useCheckoutStore } from '../../stores/checkoutStore';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export function CheckoutPage() {
  const { step, setStep, confirmedOrder, reservation, clientSecret } = useCheckoutStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Steps configuration for the progress bar
  const steps = [
    { id: 'reservation', label: 'Envío', number: 1 },
    { id: 'payment', label: 'Pago', number: 2 },
    { id: 'confirmation', label: 'Confirmación', number: 3 },
  ] as const;

  const getCurrentStepIndex = () => steps.findIndex((s) => s.id === step);

  // Initialize step from URL if present and valid
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const stepNumber = parseInt(stepParam);
      const matchedStep = steps.find((s) => s.number === stepNumber);
      if (matchedStep && matchedStep.id !== step) {
        // Basic validation: Don't allow jumping to payment/confirmation without data
        if (matchedStep.id === 'payment' && !reservation) {
          setStep('reservation');
        } else if (matchedStep.id === 'confirmation' && !confirmedOrder) {
          setStep('reservation'); // Or handle differently
        } else {
          setStep(matchedStep.id);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Sync URL with store step
  useEffect(() => {
    const currentStepObj = steps.find((s) => s.id === step);
    if (currentStepObj) {
      setSearchParams({ step: currentStepObj.number.toString() }, { replace: true });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, setSearchParams]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-12 transition-colors duration-300">
      {/* Progress Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-16 z-30 shadow-sm transition-colors duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center max-w-2xl mx-auto">
            {steps.map((s, index) => {
              const isActive = s.id === step;
              const isCompleted = getCurrentStepIndex() > index;

              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300',
                        isActive
                          ? 'bg-primary text-white'
                          : isCompleted
                            ? 'bg-success text-white'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                      )}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : s.number}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium hidden sm:block transition-colors duration-300',
                        isActive
                          ? 'text-primary'
                          : isCompleted
                            ? 'text-success'
                            : 'text-neutral-400 dark:text-neutral-500'
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-12 sm:w-24 h-0.5 mx-2 sm:mx-4 bg-neutral-200 dark:bg-neutral-800 relative overflow-hidden rounded-full">
                      <div
                        className="absolute top-0 left-0 h-full bg-success transition-all duration-500 ease-in-out"
                        style={{ width: isCompleted ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-fade-in">
            {step === 'reservation' && <ReservationStep />}

            {step === 'payment' && reservation && (
              <PaymentStep
                reservationId={reservation.id}
                expiresAt={new Date(reservation.expires_at)}
                clientSecret={clientSecret || undefined}
              />
            )}

            {step === 'confirmation' && confirmedOrder && (
              <ConfirmationStep order={confirmedOrder} />
            )}

            {/* Fallback/Loading states could be handled here if reservation is missing for payment step */}
            {step === 'payment' && !reservation && (
              <div className="text-center py-12">
                <p className="text-neutral-500 dark:text-neutral-400">
                  No se encontró información de la reserva. Volviendo al inicio...
                </p>
                {/* Logic to redirect or reset could go here, handled by store usually */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

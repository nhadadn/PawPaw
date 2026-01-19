import { Button } from "../../components/ui/Button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/Card"
import { CheckCircle2, ShoppingBag } from "lucide-react"
import type { Order } from "../../types/checkout"
import { useNavigate } from "react-router-dom"

interface ConfirmationStepProps {
    order: Order | null
}

export function ConfirmationStep({ order }: ConfirmationStepProps) {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 animate-fade-in text-center">
      <Card className="border-success/50 bg-success/5">
        <CardHeader className="items-center pb-2">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mb-4 shadow-lg shadow-success/20">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl text-success">¡Pago Exitoso!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order ? (
              <>
                <p className="text-neutral-600">
                    Tu orden <span className="font-bold font-mono">#{order.order_number}</span> ha sido confirmada.
                </p>
                <p className="text-lg font-bold text-neutral-800">
                    Total pagado: ${(order.total_amount / 100).toFixed(2)}
                </p>
              </>
          ) : (
              <p className="text-neutral-600">Orden procesada correctamente.</p>
          )}
          
          <p className="text-sm text-neutral-500">
            Te hemos enviado un correo con los detalles de tu compra.
          </p>
        </CardContent>
        <CardFooter className="justify-center pt-4">
          <Button 
            size="lg" 
            rightIcon={<ShoppingBag className="w-4 h-4" />}
            onClick={() => navigate('/')}
          >
            Seguir Comprando
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

import * as React from "react"
import { cn } from "../../lib/utils"
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error"
  title?: string
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", title, children, ...props }, ref) => {
    const variants = {
      info: "bg-blue-50 text-blue-900 border-blue-200",
      success: "bg-green-50 text-green-900 border-green-200",
      warning: "bg-yellow-50 text-yellow-900 border-yellow-200",
      error: "bg-red-50 text-red-900 border-red-200",
    }

    const icons = {
      info: <Info className="h-5 w-5 text-blue-600" />,
      success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
      error: <XCircle className="h-5 w-5 text-red-600" />,
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-lg border p-4 flex gap-3 items-start",
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="flex-shrink-0 mt-0.5">{icons[variant]}</div>
        <div className="flex-1">
          {title && <h5 className="font-bold leading-none tracking-tight mb-1">{title}</h5>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    )
  }
)
Alert.displayName = "Alert"

export { Alert }

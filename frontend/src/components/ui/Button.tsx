import * as React from "react"
import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "danger" | "success"
  size?: "sm" | "md" | "lg" | "xl" | "icon"
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary text-white hover:bg-primary-hover shadow-md hover:shadow-lg",
      secondary: "bg-secondary text-white hover:bg-secondary-hover shadow-md hover:shadow-lg",
      accent: "bg-accent text-white hover:bg-accent-hover shadow-md",
      outline: "border-2 border-primary text-primary hover:bg-primary/10",
      ghost: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
      danger: "bg-error text-white hover:bg-error-light/90",
      success: "bg-success text-white hover:bg-success/90",
    }

    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg",
      xl: "h-16 px-10 text-xl",
      icon: "h-10 w-10 p-2",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }

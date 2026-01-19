import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"

interface SpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Spinner({ className, size = "md" }: SpinnerProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <Loader2 
      className={cn(
        "animate-spin text-primary",
        sizes[size],
        className
      )} 
    />
  )
}

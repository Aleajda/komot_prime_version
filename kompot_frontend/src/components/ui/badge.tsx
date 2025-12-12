import * as React from "react"
import { cn } from "@/lib/utils"

const variantClasses: Record<"default" | "secondary" | "outline", string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-muted text-foreground",
  outline: "border border-border text-foreground",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline"
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = "default", ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
})

Badge.displayName = "Badge"






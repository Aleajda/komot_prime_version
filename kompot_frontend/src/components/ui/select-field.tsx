import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type SelectFieldOption = { value: string; label: string; disabled?: boolean }

interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string
  options: SelectFieldOption[]
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ className, label, options, ...props }, ref) => {
    return (
      <div className={cn("w-full", className)}>
        {label ? <div className="mb-1.5 text-sm font-medium text-foreground">{label}</div> : null}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "h-11 w-full appearance-none rounded-md border border-input bg-transparent px-3 pr-10 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-[#1a1e26] dark:hover:border-primary/60 dark:focus-visible:border-primary",
              props.multiple ? "h-32 py-2 pr-3" : ""
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          {!props.multiple ? (
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          ) : null}
        </div>
      </div>
    )
  }
)

SelectField.displayName = "SelectField"


import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) => {
  return (
    <div className={`py-10 text-center ${className ?? ""}`}>
      <Icon className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
      <p className="mb-1 text-sm font-medium">{title}</p>
      <p className="mx-auto mb-4 max-w-sm text-xs text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" onClick={onAction} className="rounded-2xl">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

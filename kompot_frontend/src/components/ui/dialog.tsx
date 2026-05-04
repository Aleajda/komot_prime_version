import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export const Dialog = ({ open, onOpenChange, title, description, children, footer }: DialogProps) => {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          className={cn(
            "flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl dark:border-white/10 dark:bg-[#0f131a]"
          )}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-5 dark:border-white/10">
            <div className="min-w-0 pr-2">
              <div className="text-lg font-semibold tracking-tight text-foreground">{title}</div>
              {description ? (
                <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</div>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 rounded-xl"
              onClick={() => onOpenChange(false)}
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>

          {footer ? (
            <div className="flex flex-shrink-0 flex-col gap-3 border-t border-border bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-end dark:border-white/10 dark:bg-[#141922]/80">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  )
}


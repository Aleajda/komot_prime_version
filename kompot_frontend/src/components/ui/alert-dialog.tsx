import * as React from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  isDanger?: boolean
}

export const AlertDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Удалить",
  cancelText = "Отмена",
  onConfirm,
  isDanger = true,
}: AlertDialogProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleConfirm = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {cancelText}
          </Button>
          <Button variant={isDanger ? "destructive" : "default"} onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Подождите..." : confirmText}
          </Button>
        </>
      }
    >
      <div className="text-sm text-muted-foreground">
        {description || "Подтвердите действие."}
      </div>
    </Dialog>
  )
}


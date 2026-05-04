import { cn } from "@/lib/utils"

const LABELS = {
  owner: "Владелец",
  admin: "Админ",
  member: "Участник",
} as const

export type RoleTagKind = keyof typeof LABELS

export function RoleTag({ kind, className }: { kind: RoleTagKind; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded border border-border/50 bg-muted/15 px-1.5 py-0.5 text-[10px] font-medium leading-none tracking-tight text-muted-foreground/80",
        className
      )}
    >
      {LABELS[kind]}
    </span>
  )
}

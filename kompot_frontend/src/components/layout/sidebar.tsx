"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  MessageSquare,
  Settings,
  Shield,
  UserPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
  { name: "Проекты", href: "/projects", icon: FolderKanban },
  { name: "Задачи", href: "/tasks", icon: CheckSquare },
  { name: "Команды", href: "/teams", icon: Users },
  { name: "Чат", href: "/chat", icon: MessageSquare },
  { name: "Друзья", href: "/friends", icon: UserPlus },
  { name: "Профиль", href: "/profile", icon: Settings },
  { name: "Админ", href: "/admin", icon: Shield },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const pathname = usePathname()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border bg-sidebar transition-transform dark:border-white/10 dark:bg-[#1a1e26]",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "border border-primary/40 bg-primary/15 text-primary shadow-lg ring-1 ring-primary/40 dark:border-primary/40 dark:bg-[#232730] dark:text-[#5bcffd] dark:ring-primary/40"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:text-[#8e929b] dark:hover:bg-[#232730] dark:hover:text-[#5bcffd]"
                )}
                onClick={onClose}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}


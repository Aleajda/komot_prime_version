"use client"

import { Bell, Menu, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { logout } from "@/store/slices/authSlice"
import { useRouter } from "next/navigation"

interface HeaderProps {
  onMenuClick?: () => void
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const handleProfileClick = () => {
    router.push("/profile")
  }

  const handleLogoutClick = async () => {
    await dispatch(logout())
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-white/10 dark:bg-[#0f131a]/95">
      <div className="container flex h-16 items-center gap-4 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск проектов, задач..."
              className="pl-9 bg-card dark:bg-[#232730] dark:border-white/10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="Уведомления">
            <Bell className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Профиль"
            onClick={handleProfileClick}
          >
            <User className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden text-sm text-muted-foreground md:inline">
                {user.username || user.email}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutClick}
              aria-label="Выйти"
            >
              Выйти
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

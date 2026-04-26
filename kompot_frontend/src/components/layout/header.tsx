"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, Menu, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { logout } from "@/store/slices/authSlice"
import { useRouter } from "next/navigation"
import { searchService } from "@/services"
import { SearchResponse } from "@/types/api"

interface HeaderProps {
  onMenuClick?: () => void
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isOpenHints, setIsOpenHints] = useState(false)
  const debounceRef = useRef<number | null>(null)

  const handleProfileClick = () => {
    router.push("/profile")
  }

  const handleLogoutClick = async () => {
    await dispatch(logout())
    router.push("/auth/login")
  }

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }
    const trimmed = query.trim()
    if (!trimmed) {
      setResults(null)
      setIsOpenHints(false)
      return
    }
    debounceRef.current = window.setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await searchService.search(trimmed)
        setResults(data)
        setIsOpenHints(true)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const handleSelectProject = (projectId: string) => {
    router.push(`/projects/${projectId}`)
    setIsOpenHints(false)
    setQuery("")
  }

  const handleSelectTask = (taskId: string) => {
    router.push(`/tasks/${taskId}`)
    setIsOpenHints(false)
    setQuery("")
  }

  const hasAnyResults = Boolean((results?.projects.length || 0) + (results?.tasks.length || 0))

  const renderSearchInput = (className?: string) => (
    <div className={className}>
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpenHints(true)
          }}
          onBlur={() => window.setTimeout(() => setIsOpenHints(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpenHints(false)
          }}
          placeholder="Поиск проектов, задач..."
          className="h-10 pl-9 bg-card dark:bg-[#232730] dark:border-white/10"
          aria-label="Поиск проектов и задач"
        />
      </div>

      {isOpenHints && query.trim() && (
        <div className="absolute left-0 right-0 top-12 z-[120] overflow-hidden rounded-xl border border-border bg-background shadow-2xl dark:border-white/10 dark:bg-[#0f131a]">
          <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border dark:border-white/10">
            {isSearching ? "Поиск..." : hasAnyResults ? "Подсказки" : "Ничего не найдено"}
          </div>

          {!isSearching && results && hasAnyResults && (
            <div className="max-h-80 overflow-auto">
              {results.projects.length > 0 && (
                <div className="px-2 py-2">
                  <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Проекты
                  </div>
                  <div className="grid gap-1">
                    {results.projects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-muted/50 dark:hover:bg-[#232730]"
                        onClick={() => handleSelectProject(project.id)}
                        aria-label={`Открыть проект: ${project.name}`}
                      >
                        <div className="truncate font-medium text-foreground">{project.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{project.teamName}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.tasks.length > 0 && (
                <div className="px-2 py-2 border-t border-border dark:border-white/10">
                  <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Задачи
                  </div>
                  <div className="grid gap-1">
                    {results.tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-muted/50 dark:hover:bg-[#232730]"
                        onClick={() => handleSelectTask(task.id)}
                        aria-label={`Открыть задачу: ${task.title}`}
                      >
                        <div className="truncate font-medium text-foreground">{task.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {task.teamName} • {task.projectName}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-white/10 dark:bg-[#0f131a]/95">
      <div className="absolute left-0 top-0 hidden h-16 items-center px-4 md:flex">
        {renderSearchInput("relative w-[min(32rem,42vw)]")}
      </div>
      <div className="w-full md:pl-64">
        <div className="container flex h-16 items-center gap-4 px-4 md:px-6">
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
            {renderSearchInput("relative flex-1 max-w-md md:hidden")}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Уведомления">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Профиль" onClick={handleProfileClick}>
              <User className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              {user && (
                <span className="hidden text-sm text-muted-foreground md:inline">{user.username || user.email}</span>
              )}
              <Button variant="outline" size="sm" onClick={handleLogoutClick} aria-label="Выйти">
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

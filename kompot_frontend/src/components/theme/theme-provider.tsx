"use client"

import { createContext, useContext, useLayoutEffect, useRef, useState } from "react"
import { readStoredThemeMode, THEME_STORAGE_KEY, type ThemeMode } from "@/lib/theme-storage"

type Theme = ThemeMode

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Старт с «dark» совпадает с SSR и с inline-скриптом по умолчанию; реальное значение подтягиваем в layout-эффекте без рассинхрона гидрации.
  const [theme, setTheme] = useState<Theme>("dark")
  const didHydrateTheme = useRef(false)

  useLayoutEffect(() => {
    const root = document.documentElement
    if (!didHydrateTheme.current) {
      didHydrateTheme.current = true
      const next = readStoredThemeMode()
      // Синхронизация контекста с localStorage после SSR; без setState — рассинхрон с inline-скриптом на <html>.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- однократная гидрация темы
      setTheme(next)
      root.classList.toggle("dark", next === "dark")
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      return
    }
    root.classList.toggle("dark", theme === "dark")
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }

  // Всегда оборачиваем в Provider: до mounted дочерние компоненты (Header / ThemeToggle) иначе падают на useTheme.
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}









/** Ключ localStorage — общий для inline-скрипта в layout и ThemeProvider. */
export const THEME_STORAGE_KEY = "theme"

export type ThemeMode = "dark" | "light"

/** Логика должна совпадать с getThemeBootInlineScript(). */
export function readStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "dark"
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  if (saved === "light" || saved === "dark") return saved
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/** Минимальный IIFE: выставить класс `dark` на documentElement до первой отрисовки. */
export function getThemeBootInlineScript(): string {
  const key = JSON.stringify(THEME_STORAGE_KEY)
  return `!function(){try{var k=${key},s=localStorage.getItem(k),d="dark"===s||(!s&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}}()`
}

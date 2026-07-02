"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"

type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const COOKIE_NAME = "insightos-theme"

export function ThemeProvider({ 
  children,
  initialTheme = "dark"
}: { 
  children: React.ReactNode
  initialTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)
  const hasCookie = useRef(false)
  const isFirstRender = useRef(true)

  // On mount: sync state from what the inline script set on <html>,
  // and detect whether a saved preference cookie exists.
  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme")
    if (attr === "light" || attr === "dark") {
      setThemeState(attr)
    }
    hasCookie.current = document.cookie.includes(`${COOKIE_NAME}=`)
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    document.cookie = `${COOKIE_NAME}=${newTheme}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.setAttribute("data-theme", newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
  }, [theme, setTheme])

  // Sync with document attribute when theme changes.
  // Skip first run — the inline script already set it before paint.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  // Follow OS theme changes when the user has no saved preference.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)")
    const handler = (e: MediaQueryListEvent) => {
      if (!hasCookie.current) {
        const next = e.matches ? "light" : "dark"
        setThemeState(next)
        document.documentElement.setAttribute("data-theme", next)
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within a ThemeProvider")
  return context
}

"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ 
  children,
  initialTheme = "dark"
}: { 
  children: React.ReactNode
  initialTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    document.cookie = `insightos-theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.setAttribute("data-theme", newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
  }, [theme, setTheme])

  // Sync with document attribute on mount if it changed
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

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

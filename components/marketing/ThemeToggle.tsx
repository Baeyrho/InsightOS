"use client"

import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/lib/theme"
import styles from "./ThemeToggle.module.css"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      type="button"
    >
      {theme === "dark" ? (
        <Sun className={styles.icon} size={20} />
      ) : (
        <Moon className={styles.icon} size={20} />
      )}
    </button>
  )
}

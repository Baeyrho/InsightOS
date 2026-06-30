"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar/Sidebar"
import { Menu } from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import styles from "./app-layout.module.css"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className={cn(styles.layout, collapsed && styles.layoutCollapsed)}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}
      <main className={styles.main}>
        <button
          className={styles.mobileMenu}
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        {children}
      </main>
    </div>
  )
}

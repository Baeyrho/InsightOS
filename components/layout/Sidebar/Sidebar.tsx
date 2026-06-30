"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  FolderKanban,
  Lightbulb,
  FileText,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  X,
} from "lucide-react"
import { useTheme } from "@/lib/theme"
import styles from "./Sidebar.module.css"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/insights", label: "Insights", icon: Lightbulb },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/auth")
  }

  const handleNav = () => {
    onMobileClose?.()
  }

  return (
    <>
      {mobileOpen && <div className={styles.mobileBackdrop} onClick={onMobileClose} />}
      <aside className={cn(styles.sidebar, collapsed && styles.collapsed, mobileOpen && styles.mobileOpen)}>
        <div className={styles.logo}>
          {!collapsed ? (
            <Link href="/dashboard" className={styles.logoLockup} onClick={handleNav}>
              <div className={styles.logoBadge}>IO</div>
              <span className={styles.wordmark}>InsightOS</span>
            </Link>
          ) : (
            <Link href="/dashboard" className={styles.logoBadgeCollapsed} onClick={handleNav}>
              <div className={styles.logoBadge}>IO</div>
            </Link>
          )}
          <button
            onClick={onToggle}
            className={styles.toggleButton}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className={styles.mobileClose}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNav}
                className={cn(styles.navItem, isActive && styles.navItemActive)}
              >
                <Icon className={styles.navIcon} size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
        <div className={styles.footer}>
          <button
            onClick={toggleTheme}
            className={cn(styles.navItem, styles.themeToggle)}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className={styles.navIcon} size={20} /> : <Moon className={styles.navIcon} size={20} />}
            {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <button
            onClick={handleSignOut}
            className={cn(styles.navItem, styles.signOutItem)}
          >
            <LogOut className={styles.navIcon} size={20} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

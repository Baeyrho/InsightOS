import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import styles from "./Badge.module.css"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type BadgeVariant = "default" | "primary" | "success" | "warning" | "error"

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  default: styles.default,
  primary: styles.primary,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn(styles.badge, VARIANT_CLASS[variant], className)}>
      {children}
    </span>
  )
}

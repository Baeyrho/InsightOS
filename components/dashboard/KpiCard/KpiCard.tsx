import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import styles from "./KpiCard.module.css"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface KpiCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: { value: string; positive: boolean }
  className?: string
}

export function KpiCard({ label, value, icon, trend, className }: KpiCardProps) {
  return (
    <div className={cn(styles.card, className)}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
        {trend && (
          <span className={cn(styles.trend, trend.positive ? styles.trendUp : styles.trendDown)}>
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}

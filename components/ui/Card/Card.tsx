import React from "react"
import { clsx, type ClassValue } from "clsx"
import styles from "./Card.module.css"

function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn(styles.card, className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return <h2 className={cn(styles.title, className)}>{children}</h2>
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className={styles.description}>{children}</p>
}

export function CardFooter({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn(styles.footer, className)}>{children}</div>
}

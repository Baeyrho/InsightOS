"use client"

import React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import styles from "./Button.module.css"

// Simple cn utility since we don't have a shared one yet
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          styles.button,
          styles[variant],
          styles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className={styles.spinner} /> // Need to define spinner style
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

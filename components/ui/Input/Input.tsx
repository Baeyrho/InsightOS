"use client"

import React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import styles from "./Input.module.css"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  labelAction?: React.ReactNode
  endAdornment?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, id, labelAction, endAdornment, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    return (
      <div className={styles.inputWrapper}>
        {(label || labelAction) && (
          <div className={styles.labelContainer}>
            {label && (
              <label htmlFor={inputId} className={styles.label}>
                {label}
              </label>
            )}
            {labelAction}
          </div>
        )}
        <div className={styles.inputContainer}>
          <input
            id={inputId}
            type={type}
            className={cn(
              styles.input,
              error && styles.errorInput,
              endAdornment && styles.withAdornment,
              className
            )}
            ref={ref}
            {...props}
          />
          {endAdornment && (
            <div className={styles.endAdornment}>
              {endAdornment}
            </div>
          )}
        </div>
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    )
  }
)

Input.displayName = "Input"

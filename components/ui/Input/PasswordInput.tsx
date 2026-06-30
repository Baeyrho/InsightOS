"use client"

import React, { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input, type InputProps } from "@/components/ui/Input/Input"
import styles from "./PasswordInput.module.css"

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, labelAction, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const togglePassword = () => setShowPassword(!showPassword)

    return (
      <Input
        {...props}
        label={label}
        labelAction={labelAction}
        type={showPassword ? "text" : "password"}
        ref={ref}
        endAdornment={
          <button
            type="button"
            onClick={togglePassword}
            className={styles.toggleButton}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        }
      />
    )
  }
)

PasswordInput.displayName = "PasswordInput"

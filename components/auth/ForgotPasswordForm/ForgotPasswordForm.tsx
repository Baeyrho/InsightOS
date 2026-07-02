"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button/Button"
import { Input } from "@/components/ui/Input/Input"
import { PasswordInput } from "@/components/ui/Input/PasswordInput"
import { PasswordRequirements } from "@/components/auth/PasswordRequirements/PasswordRequirements"
import { 
  ForgotPasswordRequestSchema, 
  PasswordResetSchema,
  type ForgotPasswordRequestInput,
  type PasswordResetInput
} from "@/lib/validations/auth"
import styles from "./ForgotPasswordForm.module.css"

export function ForgotPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<any>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [token])

  const isRequestValid = ForgotPasswordRequestSchema.safeParse({ email }).success
  const isResetValid = PasswordResetSchema.safeParse({ password, confirmPassword }).success


  async function handleRequestReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setServerError(null)

    const result = ForgotPasswordRequestSchema.safeParse({ email })
    if (!result.success) {
      setErrors({ email: result.error.issues[0].message })
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/v1/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      // Always show success to prevent account enumeration
      setIsSuccess(true)
      setIsLoading(false)
    } catch (err) {
      setServerError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setServerError(null)

    const result = PasswordResetSchema.safeParse({ password, confirmPassword })
    if (!result.success) {
      const fieldErrors: any = {}
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      if (!res.ok) {
        const body = await res.json()
        setServerError(body.error?.message || "Failed to reset password")
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      setIsLoading(false)
      
      // Redirect to login after success
      setTimeout(() => {
        router.push("/auth?mode=login")
      }, 3000)
    } catch (err) {
      setServerError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  if (isSuccess && !token) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Check your email</h2>
        </div>
        <div className={styles.successContent}>
          <p>
            If an account exists for that email, a reset link is on its way.
          </p>
          <Button onClick={() => setIsSuccess(false)} variant="secondary" className={styles.submit}>
            Try another email
          </Button>
        </div>
        <div className={styles.footer}>
          <Link href="/auth?mode=login" className={styles.link}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  if (isSuccess && token) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Password reset successful</h2>
        </div>
        <div className={styles.successContent}>
          <p>
            Your password has been successfully updated. Redirecting to sign in...
          </p>
          <Link href="/auth?mode=login" className={styles.primaryLink}>
            Sign in now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {token ? "Choose a new password" : "Reset your password"}
        </h2>
      </div>
      
      {token ? (
        <form onSubmit={handleResetPassword} className={styles.form} noValidate>
          <PasswordInput
            ref={firstFieldRef}
            label="Enter Password"
            name="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          {!errors.password && <PasswordRequirements value={password} />}
          
          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />
          
          {serverError && (
            <p className={styles.error} role="alert">
              {serverError}
            </p>
          )}
          
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!isResetValid || isLoading}
            className={styles.submit}
          >
            Reset password
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRequestReset} className={styles.form} noValidate>
          <Input
            ref={firstFieldRef}
            label="Enter Email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          
          {serverError && (
            <p className={styles.error} role="alert">
              {serverError}
            </p>
          )}
          
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!isRequestValid || isLoading}
            className={styles.submit}
          >
            Send reset link
          </Button>
        </form>
      )}
      
      <div className={styles.footer}>
        <p>
          Remember your password?{" "}
          <Link href="/auth?mode=login" className={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}


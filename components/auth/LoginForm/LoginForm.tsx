"use client"

import React, { useState, useEffect, useRef } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button/Button"
import { Input } from "@/components/ui/Input/Input"
import { PasswordInput } from "@/components/ui/Input/PasswordInput"
import { LoginSchema, type LoginInput } from "@/lib/validations/auth"
import styles from "./LoginForm.module.css"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  const isValid = LoginSchema.safeParse({ email, password }).success

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setServerError(null)

    const result = LoginSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: any = {}
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      // Focus first error
      const firstErrorKey = result.error.issues[0].path[0]
      const element = document.getElementsByName(firstErrorKey as string)[0]
      element?.focus()
      return
    }

    setIsLoading(true)

    try {
      const authResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (authResult?.error) {
        if (authResult.error === "CredentialsSignin") {
          setServerError("Email or password is incorrect")
        } else if (authResult.error === "unverified") {
          setServerError("Please verify your email first")
          // In a real app, you'd show a resend link here
        } else if (authResult.error === "Callback") {
          setServerError("Unable to reach the database. Please check your connection and try again.")
        } else {
          setServerError("An unexpected error occurred. Please try again.")
        }
        setIsLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      console.error("Sign-in error:", err)
      setServerError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Sign in</h2>
      </div>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
          aria-describedby={errors.email ? "email-error" : undefined}
          aria-invalid={!!errors.email}
        />
        <PasswordInput
          label="Enter Password"
          labelAction={
            <Link href="/auth?mode=forgot-password" className={styles.labelAction}>
              Forgot your password?
            </Link>
          }
          name="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          aria-invalid={!!errors.password}
        />
        
        {serverError && (
          <p className={styles.error} role="alert">
            {serverError}
            {serverError === "Please verify your email first" && (
              <>
                {" "}
                <button type="button" className={styles.resendLink}>
                  Resend verification email
                </button>
              </>
            )}
          </p>
        )}
        
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!isValid || isLoading}
          className={styles.submit}
        >
          Sign in
        </Button>
      </form>
      <div className={styles.footer}>
        <p>
          Don't have an account?{" "}
          <Link href="/auth?mode=register" className={styles.link}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

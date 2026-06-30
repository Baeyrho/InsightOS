"use client"

import React, { useState, useEffect, useRef } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button/Button"
import { Input } from "@/components/ui/Input/Input"
import { PasswordInput } from "@/components/ui/Input/PasswordInput"
import { Check, X } from "lucide-react"
import { RegisterSchema, type RegisterInput } from "@/lib/validations/auth"
import styles from "./RegisterForm.module.css"

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  const isValid = RegisterSchema.safeParse({ name, email, password }).success


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setServerError(null)

    const result = RegisterSchema.safeParse({ name, email, password })
    if (!result.success) {
      const fieldErrors: any = {}
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      const firstErrorKey = result.error.issues[0].path[0]
      const element = document.getElementsByName(firstErrorKey as string)[0]
      element?.focus()
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        let message = "Registration failed"
        try {
          const body = await res.json()
          message = body.error?.message || message
        } catch {
          message = res.statusText || message
        }
        setServerError(message)
        setIsLoading(false)
        return
      }

      // Automatically sign in after registration
      const authResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (authResult?.error) {
        // Fallback if auto-sign-in fails, redirect to login
        router.push("/auth?mode=login&registered=true")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      console.error("Registration error:", err)
      setServerError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Create your account</h2>
      </div>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <Input
          ref={firstFieldRef}
          label="Enter Full Name"
          name="name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Input
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          aria-invalid={!!errors.password}
        />
        
        {serverError && (
          <p className={styles.error} role="alert">
            {serverError}
          </p>
        )}
        
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!isValid || isLoading}
          className={styles.submit}
        >
          Create account
        </Button>
      </form>
      <div className={styles.footer}>
        <p>
          Already have an account?{" "}
          <Link href="/auth?mode=login" className={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}


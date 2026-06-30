"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { LoginForm } from "../LoginForm/LoginForm"
import { RegisterForm } from "../RegisterForm/RegisterForm"
import { ForgotPasswordForm } from "../ForgotPasswordForm/ForgotPasswordForm"
import { VerifyEmailForm } from "../VerifyEmailForm/VerifyEmailForm"
import { AuthLayout } from "../AuthLayout/AuthLayout"
import styles from "./AuthView.module.css"

export type AuthMode = "login" | "register" | "forgot-password" | "verify-email"

export function AuthView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const initialMode = token ? "forgot-password" : ((searchParams.get("mode") as AuthMode) || "login")
  const [mode, setMode] = useState<AuthMode>(initialMode)

  useEffect(() => {
    if (token) {
      setMode("forgot-password")
      return
    }
    const queryMode = searchParams.get("mode") as AuthMode
    if (queryMode && queryMode !== mode) {
      setMode(queryMode)
    }
  }, [searchParams, token])

  return (
    <AuthLayout>
      {mode === "login" && <LoginForm />}
      {mode === "register" && <RegisterForm />}
      {mode === "forgot-password" && <ForgotPasswordForm />}
      {mode === "verify-email" && <VerifyEmailForm />}
    </AuthLayout>
  )
}

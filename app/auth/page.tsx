import { Suspense } from "react"
import { AuthView } from "@/components/auth/AuthView/AuthView"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication | InsightOS",
  description: "Sign in or create an account to get started.",
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthView />
    </Suspense>
  )
}

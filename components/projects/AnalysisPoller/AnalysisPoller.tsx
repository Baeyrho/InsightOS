"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export function AnalysisPoller({
  status,
  children,
}: {
  status: string | null | undefined
  children: ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    if (status === "QUEUED" || status === "PROCESSING") {
      const interval = setInterval(() => {
        router.refresh()
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [status, router])

  return <>{children}</>
}

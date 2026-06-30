"use client"

import { useRouter } from "next/navigation"
import { createCheckoutSession } from "@/lib/actions/billing"
import { Button } from "@/components/ui/Button/Button"
import { useState } from "react"

interface UpgradeButtonProps {
  tier: "PRO" | "TEAM"
  currentTier: "FREE" | "PRO" | "TEAM"
}

export function UpgradeButton({ tier, currentTier }: UpgradeButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await createCheckoutSession(tier)
      if (result?.checkoutUrl) {
        router.push(result.checkoutUrl)
      } else {
        setError("Failed to create checkout session")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        variant="primary"
        size="md"
        isLoading={loading}
        onClick={handleUpgrade}
        disabled={loading}
      >
        {loading ? "Redirecting..." : currentTier === "FREE" ? `Upgrade to ${tier}` : `Switch to ${tier}`}
      </Button>
      {error && (
        <p style={{ color: "var(--color-error)", fontSize: "var(--typo-body-small-font-size)", marginTop: "var(--space-2)" }}>
          {error}
        </p>
      )}
    </div>
  )
}

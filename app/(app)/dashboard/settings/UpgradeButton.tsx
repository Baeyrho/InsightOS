"use client"

import { createCheckoutSession } from "@/lib/actions/billing"
import { Button } from "@/components/ui/Button/Button"
import { useState } from "react"

interface UpgradeButtonProps {
  tier: "PRO" | "TEAM"
  currentTier: "FREE" | "PRO" | "TEAM"
}

export function UpgradeButton({ tier, currentTier }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await createCheckoutSession(tier)
      if (result?.checkoutUrl) {
        // Use window.location.href — not router.push — because router.push is
        // for internal SPA navigation only and will mangle an external URL.
        window.location.href = result.checkoutUrl
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

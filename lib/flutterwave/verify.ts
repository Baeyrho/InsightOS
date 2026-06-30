import { logger } from "@/lib/logger"
import { PLANS, type PlanTier } from "@/lib/plans"

export async function verifyTransaction(transactionId: string) {
  const baseUrl = process.env.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3"
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY

  if (!secretKey) {
    throw new Error("FLUTTERWAVE_SECRET_KEY is not configured")
  }

  const res = await fetch(`${baseUrl}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })

  if (!res.ok) {
    const text = await res.text()
    logger.error({ scope: "flw-verify", status: res.status }, `Flutterwave verify failed: ${text}`)
    throw new Error(`Flutterwave verify failed: ${res.status}`)
  }

  const json = await res.json()
  return json.data as Record<string, unknown>
}

export async function verifySubscription(subscriptionId: string) {
  const baseUrl = process.env.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3"
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY

  if (!secretKey) {
    throw new Error("FLUTTERWAVE_SECRET_KEY is not configured")
  }

  const res = await fetch(`${baseUrl}/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })

  if (!res.ok) {
    const text = await res.text()
    logger.error({ scope: "flw-verify", status: res.status }, `Flutterwave subscription verify failed: ${text}`)
    throw new Error(`Flutterwave subscription verify failed: ${res.status}`)
  }

  const json = await res.json()
  return json.data as Record<string, unknown>
}

export function isFulfillable(
  data: Record<string, unknown> | undefined | null,
  expected: { amount: number; currency: string }
): boolean {
  if (!data) return false
  return (
    data?.status === "successful" &&
    Number(data.amount) >= expected.amount &&
    data.currency === expected.currency
  )
}

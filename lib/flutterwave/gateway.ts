import type { PlanTier } from "@/lib/plans"
import { PlanRegistry } from "@/lib/plans"

export interface CheckoutResult {
  checkoutUrl: string
}

export interface VerifiedTransaction {
  status: string
  amount: number
  currency: string
  payment_plan?: string | null
  customer?: { email?: string }
}

export interface PaymentGateway {
  createCheckout(tier: PlanTier, userId: string, email: string, name?: string): Promise<CheckoutResult>
  verifyTransaction(transactionId: string): Promise<VerifiedTransaction>
}

export class FlutterwaveGateway implements PaymentGateway {
  private baseUrl: string
  private secretKey: string

  constructor() {
    this.baseUrl = process.env.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3"
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || ""
  }

  async createCheckout(tier: PlanTier, userId: string, email: string, name?: string): Promise<CheckoutResult> {
    const planId = PlanRegistry.flwPlanId(tier)
    if (!planId) throw new Error(`${tier} plan ID not configured`)

    const { amount, currency } = PlanRegistry.amount(tier)
    const txRef = `insightos_${userId}_${Date.now()}`
    // Include tier + tx_ref as query params so the callback handler has a
    // reconciliation hint. payment_plan is NOT forwarded in the POST body because
    // Flutterwave silently removes all non-card payment options when payment_plan
    // is present in a hosted checkout request. The plan is reconciled server-side
    // by the verify API response (which returns payment_plan) and by the webhook.
    const callbackBase = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/v1/billing/callback`
    const callbackUrl = `${callbackBase}?tier=${encodeURIComponent(tier)}&tx_ref=${encodeURIComponent(txRef)}`

    const res = await fetch(`${this.baseUrl}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.secretKey}`,
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency,
        redirect_url: callbackUrl,
        customer: { email, name: name || undefined },
        customizations: {
          title: "InsightOS",
          description: `${tier} Plan Subscription`,
        },
        payment_options: "card,banktransfer,account,ussd,mobilemoney",
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Flutterwave checkout failed: ${err}`)
    }

    const data = await res.json()
    return { checkoutUrl: data.data?.link }
  }

  async verifyTransaction(transactionId: string): Promise<VerifiedTransaction> {
    const res = await fetch(`${this.baseUrl}/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Flutterwave verify failed: ${res.status}: ${text}`)
    }

    const json = await res.json()
    return json.data as VerifiedTransaction
  }
}

export function isFulfillable(
  data: VerifiedTransaction | undefined | null,
  expected: { amount: number; currency: string }
): boolean {
  if (!data) return false
  return (
    data.status === "successful" &&
    Number(data.amount) >= expected.amount &&
    data.currency === expected.currency
  )
}

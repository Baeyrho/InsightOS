import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { verifyTransaction } from "@/lib/flutterwave/verify"
import { PlanRegistry } from "@/lib/plans"
import { repos } from "@/lib/services/registry"

/**
 * GET /api/v1/billing/callback
 *
 * Flutterwave redirects the user here after a hosted checkout attempt.
 * Query params provided by Flutterwave: status, transaction_id, tx_ref.
 *
 * This handler:
 *   1. Reads and defensively guards all optional query params.
 *   2. On failure, redirects to /dashboard/settings?payment=failed.
 *   3. Verifies the transaction server-side before granting any access.
 *   4. On success, redirects to /dashboard/settings?payment=success.
 *
 * IMPORTANT: redirect() is intentionally called OUTSIDE any try/catch block.
 * Next.js redirect() works by throwing a special internal error (NEXT_REDIRECT).
 * If caught by a catch block, it surfaces as a 503 crash instead of a redirect.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  // Defensive: all Flutterwave callback params are optional — guard undefined
  const status = searchParams.get("status") ?? ""
  const transactionId = searchParams.get("transaction_id") ?? ""
  const txRef = searchParams.get("tx_ref") ?? ""

  const failureUrl = new URL("/dashboard/settings", req.nextUrl.origin)
  failureUrl.searchParams.set("payment", "failed")

  const successUrl = new URL("/dashboard/settings", req.nextUrl.origin)
  successUrl.searchParams.set("payment", "success")

  // If Flutterwave signalled a non-successful status, redirect immediately.
  if (!status || status !== "successful") {
    logger.warn(
      { scope: "flw-callback", status, txRef },
      "Flutterwave callback returned non-successful status"
    )
    return NextResponse.redirect(failureUrl)
  }

  // A valid transaction_id is required to verify; without it we cannot fulfill.
  if (!transactionId) {
    logger.warn(
      { scope: "flw-callback", txRef },
      "Flutterwave callback missing transaction_id — cannot verify"
    )
    return NextResponse.redirect(failureUrl)
  }

  // Verify the transaction server-side and attempt instant fulfillment.
  // The webhook (charge.completed) is the authoritative fulfillment path; this
  // is a best-effort instant upgrade for UX only. If verification fails for any
  // reason, redirect to failure — the webhook will still fulfill asynchronously.
  let redirectUrl: URL

  try {
    const verifiedData = await verifyTransaction(transactionId)

    if (!verifiedData || verifiedData.status !== "successful") {
      logger.warn(
        { scope: "flw-callback", transactionId, txRef, verifiedStatus: verifiedData?.status },
        "Transaction verification returned non-successful status"
      )
      redirectUrl = failureUrl
    } else {
      // Resolve the plan from the payment_plan id or from amount/currency.
      const flwPlanId = String(verifiedData.payment_plan ?? "")
      let planTier = flwPlanId ? PlanRegistry.fromFlwPlanId(flwPlanId) : undefined

      if (!planTier) {
        const verifiedAmount = Number(verifiedData.amount ?? 0)
        const verifiedCurrency = String(verifiedData.currency ?? "")
        planTier = PlanRegistry.fromAmount(verifiedAmount, verifiedCurrency) ?? undefined
      }

      // Resolve the customer email from the verified payload.
      const customerEmail =
        (verifiedData.customer as Record<string, unknown> | undefined)?.email as
          | string
          | undefined

      if (planTier && customerEmail) {
        const user = await repos.user.findByEmail(customerEmail.toLowerCase())

        if (user) {
          // Best-effort instant upgrade. The webhook will also fire and
          // upsert the same record idempotently, so this is safe to race.
          await repos.subscription.upsert(user.id, {
            user: { connect: { id: user.id } },
            tier: planTier,
            status: "ACTIVE",
            flwPlanId: flwPlanId || null,
            flwCustomerEmail: customerEmail.toLowerCase(),
            lastTxRef: txRef || null,
            currentPeriodEnd: (() => {
              const d = new Date()
              d.setMonth(d.getMonth() + 1)
              return d
            })(),
          })

          logger.info(
            { scope: "flw-callback", transactionId, txRef, planTier },
            "Instant callback fulfillment succeeded"
          )
        } else {
          logger.warn(
            { scope: "flw-callback", transactionId },
            "No user found for verified customer email — webhook will fulfill"
          )
        }
      } else {
        logger.warn(
          { scope: "flw-callback", transactionId, flwPlanId, planTier },
          "Could not resolve plan tier from callback — webhook will fulfill"
        )
      }

      redirectUrl = successUrl
    }
  } catch (err) {
    logger.error(
      { scope: "flw-callback", transactionId, txRef, err },
      "Error verifying transaction in callback — redirecting to failure"
    )
    redirectUrl = failureUrl
  }

  // redirect() is called HERE — outside every try/catch frame — so that Next.js
  // can throw its internal NEXT_REDIRECT signal without being caught and re-thrown
  // as a 503 runtime error.
  return NextResponse.redirect(redirectUrl)
}

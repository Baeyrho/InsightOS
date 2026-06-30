import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { repos } from "@/lib/services/registry"
import { logger } from "@/lib/logger"
import { z } from "zod"
import crypto from "crypto"
import { sendEmail } from "@/lib/email"
import { subscriptionActivatedEmail, subscriptionCancelledEmail } from "@/lib/email-templates"
import { PlanRegistry } from "@/lib/plans"
import { verifyTransaction, verifySubscription, isFulfillable } from "@/lib/flutterwave/verify"
import { parsePlanTier } from "@/lib/plans"

const FlutterwaveWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.union([z.number(), z.string()]),
    tx_ref: z.string().optional(),
    status: z.string().optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
  }),
})

function verifySignature(req: NextRequest): boolean {
  const provided = req.headers.get("verif-hash")
  const expected = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH
  if (!provided || !expected) return false
  if (provided.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}

function nextPeriodEnd(): Date {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

async function handleChargeCompleted(flwId: string, txRef: string, rawPayload: unknown) {
  const verifiedData = await verifyTransaction(flwId)

  if (!verifiedData || verifiedData?.status !== "successful") {
    logger.warn({ scope: "flw-webhook", flwId, status: verifiedData?.status }, "Transaction not successful after verification")
    return
  }

  const flwPlanId: string = String(verifiedData?.payment_plan ?? "")
  let planTier = PlanRegistry.fromFlwPlanId(flwPlanId)

  if (!planTier) {
    const verifiedAmount = Number(verifiedData?.amount ?? 0)
    const verifiedCurrency = String(verifiedData?.currency ?? "")
    planTier = PlanRegistry.fromAmount(verifiedAmount, verifiedCurrency) ?? undefined
    if (!planTier) {
      logger.warn({ scope: "flw-webhook", flwId, flwPlanId, amount: verifiedAmount, currency: verifiedCurrency }, "No internal plan mapping for payment_plan or amount — rejecting")
      return
    }
  }

  const expected = PlanRegistry.amount(planTier)
  if (!isFulfillable(verifiedData, expected)) {
    logger.warn({ scope: "flw-webhook", flwId, expected }, "Transaction not fulfillable — amount/currency mismatch")
    return
  }

  const customerEmail: string | undefined = (verifiedData?.customer as Record<string, unknown> | undefined)?.email as string | undefined
  if (!customerEmail) {
    logger.warn({ scope: "flw-webhook", flwId }, "No customer email in verified transaction data")
    return
  }

  const user = await repos.user.findByEmail(customerEmail.toLowerCase())
  if (!user) {
    logger.warn({ scope: "flw-webhook", flwId, email: customerEmail }, "No user found for verified customer email")
    return
  }

  await repos.subscription.upsert(user.id, {
    user: { connect: { id: user.id } },
    tier: planTier,
    status: "ACTIVE",
    flwPlanId: flwPlanId || null,
    flwCustomerEmail: customerEmail.toLowerCase(),
    lastTxRef: txRef,
    currentPeriodEnd: nextPeriodEnd(),
  })

  try {
    await prisma.paymentEvent.create({
      data: {
        flwId,
        txRef,
        eventType: "charge.completed",
        status: "successful",
        amount: Number(verifiedData?.amount ?? 0),
        currency: String(verifiedData?.currency ?? ""),
        rawPayload: rawPayload as any,
      },
    })
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      logger.info({ scope: "flw-webhook", flwId }, "Duplicate PaymentEvent after fulfillment — race resolved")
    } else {
      throw err
    }
  }

  try {
    const planLabel = PlanRegistry.label(planTier)
    const renewDate = formatDate(nextPeriodEnd())
    await sendEmail({
      to: customerEmail.toLowerCase(),
      subject: `You're now on InsightOS ${planLabel}`,
      html: subscriptionActivatedEmail(user.name || "", planLabel, renewDate),
    })
  } catch {
    logger.warn({ flwId, email: customerEmail }, "Failed to send subscription-activated email")
  }
}

async function handleSubscriptionCancelled(data: Record<string, unknown>, flwId: string) {
  const flwSubId: string | undefined = String(data?.id ?? "")
  if (!flwSubId) return

  // Re-verify subscription status via Flutterwave API — never trust the webhook body alone.
  let verifiedData: Record<string, unknown> | null = null
  try {
    verifiedData = await verifySubscription(flwSubId)
  } catch {
    logger.warn({ scope: "flw-webhook", flwId, flwSubId }, "Failed to verify subscription with Flutterwave — proceeding with caution")
  }

  // If Flutterwave reports the subscription as active, this is a stale cancellation
  // (race condition: a charge.completed renewal arrived first).
  if (verifiedData && String(verifiedData?.status ?? "") === "active") {
    logger.info({ scope: "flw-webhook", flwId, flwSubId }, "Subscription is active on Flutterwave — skipping stale cancellation")
    return
  }

  const count = await repos.subscription.updateManyByFlwSubId(flwSubId, { status: "CANCELLED", cancelAtPeriodEnd: true })

  if (count === 0) {
    logger.warn({ scope: "flw-webhook", flwId, flwSubId }, "No subscription found for cancellation")
    return
  }

  try {
    const sub = await repos.subscription.findFirstByFlwSubId(flwSubId)
    if (sub?.user.email) {
      const planLabel = PlanRegistry.label(parsePlanTier(sub.tier))
      const endDate = sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "soon"
      await sendEmail({
        to: sub.user.email,
        subject: `Your InsightOS ${planLabel} has been cancelled`,
        html: subscriptionCancelledEmail(sub.user.name || "", planLabel, endDate),
      })
    }
  } catch {
    logger.warn({ flwId }, "Failed to send subscription-cancelled email")
  }
}

export async function POST(req: NextRequest) {
  if (!verifySignature(req)) {
    logger.warn({ scope: "flw-webhook" }, "Rejected webhook: bad verif-hash")
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid signature" } },
      { status: 401 }
    )
  }

  let rawPayload: unknown
  try {
    rawPayload = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 }
    )
  }

  const parsed = FlutterwaveWebhookSchema.safeParse(rawPayload)
  if (!parsed.success) {
    logger.warn({ scope: "flw-webhook" }, "Webhook payload validation failed")
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid webhook payload" } },
      { status: 422 }
    )
  }

  const { event, data } = parsed.data
  const flwId = String(data.id)

  // Dedup: return 200 immediately if this webhook event was already processed
  try {
    const { redis } = await import("@/lib/redis")
    const dedupKey = `webhook:processed:${flwId}`
    const alreadyProcessed = await redis.get(dedupKey)
    if (alreadyProcessed) {
      logger.info({ scope: "flw-webhook", flwId }, "Duplicate webhook event — already processed")
      return NextResponse.json({ received: true, deduplicated: true })
    }
  } catch {
    // Redis unavailable — proceed without dedup rather than block fulfillment
    logger.warn({ scope: "flw-webhook", flwId }, "Redis unavailable for webhook dedup — proceeding")
  }

  logger.info({ event, flwId }, "Flutterwave webhook received")

  try {
    if (event === "charge.completed" && data.status === "successful") {
      await handleChargeCompleted(flwId, data.tx_ref ?? "", rawPayload)
    } else if (event === "subscription.cancelled") {
      await handleSubscriptionCancelled(data, flwId)
    }
  } catch (err) {
    logger.error({ scope: "flw-webhook", flwId, err }, "Fulfillment failed — returning 500 for retry")
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Fulfillment failed" } },
      { status: 500 }
    )
  }

  // Mark as processed in Redis after successful fulfillment
  try {
    const { redis } = await import("@/lib/redis")
    const dedupKey = `webhook:processed:${flwId}`
    await redis.set(dedupKey, "1", { ex: 7 * 24 * 3600 })
  } catch {
    // Non-critical — dedup best-effort
  }

  return NextResponse.json({ received: true })
}

/**
 * Flutterwave webhook handler — REFERENCE IMPLEMENTATION
 *
 * Adapt into: app/api/webhooks/flutterwave/route.ts
 *
 * Responsibilities (see .agents/rules/security.md):
 *   1. Verify the `verif-hash` header (constant-time) before parsing.
 *   2. Dedupe on the Flutterwave transaction id (PaymentEvent.flwId).
 *   3. Re-verify the transaction with the Flutterwave API before fulfilling.
 *   4. Update Subscription idempotently; mark the event processed.
 *   5. Respond 200 quickly so Flutterwave does not retry needlessly.
 *
 * This file is a resource for the flutterwave-integration skill. It assumes:
 *   - prisma client at @/lib/prisma
 *   - verifyTransaction/isFulfillable at @/lib/flutterwave/verify
 *   - logger at @/lib/logger
 *   - PLAN_BY_FLW_PLAN_ID + plan amounts in @/lib/plans
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { verifyTransaction, isFulfillable } from "@/lib/flutterwave/verify";
import { PLAN_BY_FLW_PLAN_ID, planAmount } from "@/lib/plans";
import { logger } from "@/lib/logger";

export const runtime = "nodejs"; // need node crypto + Prisma

/** Constant-time comparison of the webhook signature header. */
function verifySignature(req: NextRequest): boolean {
    const provided = req.headers.get("verif-hash") ?? "";
    const expected = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH ?? "";
    if (!provided || !expected) return false;

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    // timingSafeEqual throws if lengths differ — guard first.
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
    // 1) Signature check BEFORE reading/trusting the body.
    if (!verifySignature(req)) {
        logger.warn({ scope: "flw-webhook" }, "Rejected webhook: bad verif-hash");
        return NextResponse.json(
            { error: { code: "UNAUTHORIZED", message: "Invalid signature" } },
            { status: 401 }
        );
    }

    let payload: any;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json(
            { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
            { status: 400 }
        );
    }

    const eventType: string = payload?.event ?? "unknown";
    const data = payload?.data ?? {};
    const flwId = String(data?.id ?? "");
    const txRef = String(data?.tx_ref ?? "");

    if (!flwId) {
        // Nothing to dedupe on; acknowledge so FLW stops retrying, but log it.
        logger.warn({ scope: "flw-webhook", eventType }, "Webhook missing transaction id");
        return NextResponse.json({ received: true }, { status: 200 });
    }

    // 2) Idempotency: record the event; if it already exists, no-op.
    try {
        await prisma.paymentEvent.create({
            data: {
                flwId,
                txRef,
                eventType,
                status: String(data?.status ?? "unknown"),
                amount: data?.amount ?? 0,
                currency: String(data?.currency ?? ""),
                rawPayload: payload,
            },
        });
    } catch (err: any) {
        // Unique violation on flwId → we've already seen this event.
        if (err?.code === "P2002") {
            logger.info({ scope: "flw-webhook", flwId }, "Duplicate webhook ignored");
            return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
        }
        logger.error({ scope: "flw-webhook", flwId, err: err?.message }, "Failed to record event");
        // Let FLW retry by returning 5xx.
        return NextResponse.json(
            { error: { code: "INTERNAL", message: "Could not record event" } },
            { status: 500 }
        );
    }

    // 3) Only fulfill on successful charge events. Everything else: recorded only.
    try {
        if (eventType === "charge.completed" && data?.status === "successful") {
            await fulfillCharge(flwId, txRef);
        } else if (eventType === "subscription.cancelled") {
            await handleCancellation(data);
        } else {
            logger.info({ scope: "flw-webhook", eventType, flwId }, "Event recorded, no action");
        }

        await prisma.paymentEvent.update({
            where: { flwId },
            data: { processedAt: new Date() },
        });
    } catch (err: any) {
        logger.error({ scope: "flw-webhook", flwId, err: err?.message }, "Fulfillment failed");
        // 500 → FLW retries; fulfillment is idempotent so retry is safe.
        return NextResponse.json(
            { error: { code: "INTERNAL", message: "Fulfillment failed" } },
            { status: 500 }
        );
    }

    return NextResponse.json({ received: true }, { status: 200 });
}

/**
 * Fulfill a completed charge.
 * CRITICAL: re-verify with the Flutterwave API — never trust the webhook body.
 */
async function fulfillCharge(flwId: string, txRef: string) {
    const verified = await verifyTransaction(flwId);

    // Map the payment plan to an internal tier and confirm the amount/currency.
    const plan = PLAN_BY_FLW_PLAN_ID[String(verified?.payment_plan ?? "")];
    if (!plan) {
        logger.warn({ scope: "flw-webhook", flwId }, "No internal plan for FLW payment_plan");
        return;
    }

    const expected = planAmount(plan); // { amount, currency } from lib/plans.ts
    if (!isFulfillable(verified, expected)) {
        logger.warn(
            { scope: "flw-webhook", flwId, status: verified?.status },
            "Transaction not fulfillable after verification"
        );
        return;
    }

    const email: string | undefined = verified?.customer?.email?.toLowerCase();
    if (!email) return;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        logger.warn({ scope: "flw-webhook", flwId }, "No user for verified customer email");
        return;
    }

    // Idempotent upsert: granting the same tier twice is a no-op.
    await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id,
            tier: plan,
            status: "ACTIVE",
            flwPlanId: String(verified?.payment_plan ?? ""),
            flwCustomerEmail: email,
            lastTxRef: txRef,
            currentPeriodEnd: nextPeriodEnd(),
        },
        update: {
            tier: plan,
            status: "ACTIVE",
            flwPlanId: String(verified?.payment_plan ?? ""),
            flwCustomerEmail: email,
            lastTxRef: txRef,
            currentPeriodEnd: nextPeriodEnd(),
        },
    });

    // Also mirror tier onto the user for fast quota reads (optional cache).
    await prisma.user.update({ where: { id: user.id }, data: { planTier: plan } });

    logger.info({ scope: "flw-webhook", userId: user.id, tier: plan }, "Subscription fulfilled");
}

async function handleCancellation(data: any) {
    const subId = String(data?.id ?? "");
    if (!subId) return;
    await prisma.subscription.updateMany({
        where: { flwSubscriptionId: subId },
        data: { status: "CANCELLED", cancelAtPeriodEnd: true },
    });
}

function nextPeriodEnd(): Date {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
}

# Skill: Flutterwave Integration

> Use this skill for anything involving payments, subscriptions, plan upgrades,
> or billing webhooks. InsightOS uses **Flutterwave** — not Stripe. Read this
> before touching payment code.

## When to use

- Initiating a checkout / plan upgrade.
- Handling the Flutterwave webhook.
- Verifying a transaction before granting plan access.
- Reading or updating subscription state.

## Mental model

Flutterwave differs from Stripe in vocabulary:

| Concept | Flutterwave term |
|---------|-----------------|
| Your unique ref for a charge | `tx_ref` (you generate it) |
| Flutterwave's ref | `flw_ref` / transaction `id` |
| Recurring billing | **Payment Plan** (`plan` id) + customer email |
| Verify a payment | `GET /v3/transactions/{id}/verify` |
| Webhook auth | `verif-hash` header == your dashboard secret hash |

Subscriptions in Flutterwave are created by charging a customer against a
**Payment Plan**; the customer is identified by email. There is no
"customer object" you must create up front the way Stripe requires.

## Environment variables

```
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxx        # client-safe (checkout init)
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxx        # SERVER ONLY
FLUTTERWAVE_ENCRYPTION_KEY=xxxx                 # SERVER ONLY (if using encrypt)
FLUTTERWAVE_WEBHOOK_SECRET_HASH=your_secret_hash# set in FLW dashboard → Settings → Webhooks
FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3
PLAN_CURRENCY=USD                               # or NGN; keep in lib/plans.ts
```

Only `FLUTTERWAVE_PUBLIC_KEY` may be exposed to the client. Everything else is
server-only (see `security.md`).

## Schema (replaces the PRD's Stripe fields)

Update the `Subscription` model and add a `PaymentEvent` model for idempotency.

```prisma
model Subscription {
  id                String             @id @default(cuid())
  userId            String             @unique
  tier              PlanTier           @default(FREE)
  status            SubscriptionStatus @default(ACTIVE)

  // Flutterwave (was: stripeCustomerId / stripeSubscriptionId)
  flwPlanId         String?            // Flutterwave Payment Plan id
  flwSubscriptionId String?            @unique // FLW subscription id (recurring)
  flwCustomerEmail  String?            // customer identity in FLW
  lastTxRef         String?            @unique // our last tx_ref for this sub

  currentPeriodEnd  DateTime?
  cancelAtPeriodEnd Boolean            @default(false)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  user              User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
}

// Idempotency + audit for incoming webhook events
model PaymentEvent {
  id          String   @id @default(cuid())
  flwId       String   @unique          // FLW transaction/event id — dedupe key
  txRef       String
  eventType   String                    // e.g. "charge.completed"
  status      String                    // "successful" | "failed" | ...
  amount      Decimal  @db.Decimal(12, 2)
  currency    String
  rawPayload  Json
  processedAt DateTime?
  createdAt   DateTime @default(now())

  @@index([txRef])
  @@index([processedAt])
}
```

After editing the schema, follow `skills/db-migration-runner`.

## Payment flow (upgrade to Pro/Team)

1. **Generate a `tx_ref`** server-side: `insightos_${userId}_${Date.now()}` (or a
   UUID). Persist intent so the webhook can reconcile.
2. **Initiate checkout.** Use the Flutterwave Standard flow. Pass amount,
   currency (from `lib/plans.ts`), customer email, the `tx_ref`, the
   `payment_plan` id for recurring tiers, and a `redirect_url` back to
   `/settings/billing?tx_ref=...`.
3. **User pays** on Flutterwave's hosted page.
4. **Two confirmation paths — both required:**
   - **Webhook** (`charge.completed`) is the source of truth for fulfillment.
   - **Redirect** back to the app triggers a verify call for instant UX, but
     **never** grant access from the redirect alone.
5. **Verify before fulfilling** (see below), then set `Subscription.tier` and
   `status`, and `currentPeriodEnd`.

## Verifying a transaction (mandatory before fulfillment)

```ts
// lib/flutterwave/verify.ts
export async function verifyTransaction(transactionId: string) {
  const res = await fetch(
    `${process.env.FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
    { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
  );
  if (!res.ok) throw new Error("FLW verify failed");
  const { data } = await res.json();
  return data; // { status, amount, currency, tx_ref, customer, ... }
}

// Fulfillment guard: confirm everything matches the expected plan/amount.
export function isFulfillable(data: any, expected: { amount: number; currency: string }) {
  return (
    data?.status === "successful" &&
    Number(data.amount) >= expected.amount &&
    data.currency === expected.currency
  );
}
```

## Webhook

The handler lives at `app/api/webhooks/flutterwave/route.ts`. Implement it from
the reference in `resources/webhook-handler.ts`. It must:

1. Read the `verif-hash` header and compare to
   `FLUTTERWAVE_WEBHOOK_SECRET_HASH` (constant-time). Reject `401` on mismatch.
2. Dedupe on the FLW transaction id via `PaymentEvent.flwId` — replays are no-ops.
3. **Re-verify** the transaction via the verify API before fulfilling.
4. Update `Subscription` accordingly and mark `PaymentEvent.processedAt`.
5. Return `200` quickly; do fulfillment idempotently so FLW retries are safe.

Handle at least: `charge.completed`, `subscription.cancelled`. Treat unknown
event types as recorded-but-ignored.

## Quota tie-in

After a successful upgrade, `Subscription.tier` changes; `lib/quota.ts` reads it
on the next request, so new limits apply immediately. No other wiring needed.

## Testing

- Use **test keys** (`FLWSECK_TEST-...`). Never hit live keys in dev/CI.
- Use Flutterwave test cards for success/failure/3DS scenarios.
- Unit-test `isFulfillable` and the webhook's signature check and idempotency.
- Simulate replayed webhooks to prove idempotency (one fulfillment only).

## Do / Don't

- ✅ Generate and persist your own `tx_ref`; reconcile by it.
- ✅ Re-verify server-side before granting access.
- ✅ Dedupe webhooks; respond fast; fulfill idempotently.
- ❌ Don't trust webhook amounts/status without re-verifying.
- ❌ Don't grant a plan from the browser redirect alone.
- ❌ Don't reference Stripe anywhere — this product does not use it.

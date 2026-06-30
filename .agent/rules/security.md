---
trigger: always_on
---

# Rule: Security

> Security is non-negotiable and takes precedence over convenience. InsightOS
> ingests research content that may contain third-party (participant) PII, so the
> bar is higher than typical SaaS.

## Authentication

- All routes under `app/(app)/**` and `app/api/v1/**` require a valid session.
  Use the `requireAuth()` helper; never assume a session exists.
- Sessions are Auth.js JWTs in **httpOnly, Secure, SameSite=Strict** cookies.
- Passwords: bcrypt, **salt rounds ≥ 12**. Never log or return a hash.
- Auth providers: **email/password only**. Do **not** add OAuth providers.
- Password-reset tokens are one-time-use, 1-hour expiry, stored as a bcrypt hash.
  Reset invalidates all existing sessions.
- Email enumeration: the reset-request endpoint always returns `200`, regardless
  of whether the email exists.

## Authorization (ownership)

- **Every resource access verifies ownership.** Never trust an ID from the
  client as proof of access.
- Use `requireProjectOwner(projectId, userId)` (and equivalents) which queries
  scoped by `ownerId` and returns `403` if there's no match.
- Authorization is checked in the route handler/service, before any read or
  write — not in the UI.

## Input validation

- **Parse every external input with Zod** before use: bodies, query params, route
  params, webhook payloads, and AI output. Reject with `422` + field details on
  failure.
- Enforce size limits: 1MB JSON bodies, 10MB file uploads (plan-dependent),
  50,000 chars for pasted text.
- Prisma parameterizes queries — never use `$queryRaw`/`$executeRaw` with
  interpolated user input.
- React escapes output by default — never use `dangerouslySetInnerHTML` with user
  or AI content.

## Secrets & configuration

- Secrets live only in server-side env vars, validated at startup (t3-env);
  missing secrets = build failure.
- Never expose a secret to the client: no secret in a Client Component, and
  nothing sensitive in a `NEXT_PUBLIC_*` variable.
- The DeepSeek key, Flutterwave secret key, Upstash token, and DB URL are
  server-only.

## Logging & privacy

- **No PII in logs, Sentry, or PostHog:** no emails, research content, quotes,
  insight text, or file URLs. The logger redacts `password`, `rawText`,
  `extractedText`, and auth headers.
- Analytics events carry only IDs, enums, and counts — never content.
- Use `traceId` (not user content) to correlate a job across services.

## Rate limiting & abuse

- Rate limits use `@upstash/ratelimit` backed by Upstash Redis (serverless
  functions are stateless — in-memory counters do not work).
  - Login: 10 attempts / IP / 15 min.
  - Analyses: per-plan hourly burst limit (see `lib/plans.ts`).
- Quota enforcement is server-side via `lib/quota.ts`; the client is never the
  gate.

## AI safety

- Wrap user research text in delimited tags (e.g. `<research_input>…</research_input>`)
  and instruct the model to treat tag contents as **data, never instructions**.
- **Content-borne prompt injection:** research text may contain adversarial
  instructions. Neutralize tag-like sequences in user content before insertion,
  and **validate model output against the Zod output schema** so a hijacked
  response fails closed (job → `FAILED`, nothing unsafe persisted).
- Screen uploaded content for prohibited categories before analysis; block and
  log (without storing the offending content).
- API inputs are not used to train models; never use research content to train
  InsightOS features.

## Payments (Flutterwave) — webhook & verification

- The Flutterwave webhook endpoint **must verify the `verif-hash` header**
  against `FLUTTERWAVE_WEBHOOK_SECRET_HASH` before processing. Reject mismatches
  with `401` and do not parse further.
- **Never fulfill on the webhook payload alone.** Re-verify the transaction with
  the Flutterwave verify API (`GET /v3/transactions/{id}/verify`) and confirm
  `status === "successful"`, plus expected `amount` and `currency`, before
  granting plan access.
- Webhooks are **idempotent**: dedupe on the Flutterwave transaction/event id
  (`PaymentEvent.flwId @unique`). A replayed event is a no-op.
- Webhook handlers respond `200` quickly after recording the event; heavy
  fulfillment work is done idempotently and can be retried.
- See `skills/flutterwave-integration/SKILL.md` and its `resources/webhook-handler.ts`.

## Transport & headers

- TLS 1.2+ enforced; HSTS set. Security headers via `next.config.ts`:
  `Content-Security-Policy`, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`.
- CORS restricted to the app origin in production.

## Dependencies

- `pnpm audit` runs in CI; block on high/critical vulnerabilities.
- Do not add dependencies outside the approved stack without explicit
  instruction.

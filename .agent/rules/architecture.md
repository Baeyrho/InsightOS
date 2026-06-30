---
trigger: always_on
---

# Rule: Architecture

> Always-on architectural constraints. Every change must conform.

## Layering

Keep a strict, one-directional dependency flow. Never skip or invert layers.

```
Route Handler / Server Action   (app/api/v1/**, server actions)
        │  validates input (Zod), checks auth + ownership, enforces quota
        ▼
Service                         (lib/services/**)
        │  business logic, orchestration, no req/res objects
        ▼
Repository (Prisma)             (lib/repositories/** or direct prisma in service)
        │  data access only, no business rules
        ▼
PostgreSQL
```

- **Route handlers** are thin: parse → validate → authorize → enforce quota →
  call a service → shape the response. No business logic in the handler.
- **Services** contain logic and are framework-agnostic (no `Request`/`Response`).
  This makes them unit-testable and reusable from Inngest functions.
- **Repositories / Prisma** do data access only. No `fetch`, no business rules.

## Rendering & data flow (Next.js App Router)

- **Server Components by default.** Fetch initial page data on the server.
- **Client Components** (`"use client"`) only when you need state, effects, or
  browser APIs. Keep them small and at the leaves.
- **Mutations:** prefer **Server Actions** for simple writes (create/rename/flag).
- **Client data that polls or needs optimistic updates:** use **TanStack Query**.
  The analysis status poller and the research-input list are the main cases.
- **No global client state library** (no Redux/Zustand) in the MVP. Server state
  lives in React Query; ephemeral UI state lives in local component state.
- Query keys are namespaced by resource: `["project", id]`,
  `["analysis", id, "status"]`. Mutations invalidate the relevant keys.

## Async jobs — the critical rule

The AI analysis pipeline **must not run inside a request handler.** Serverless
functions terminate at 60s; analysis takes 30–180s.

- Analysis is dispatched as an **Inngest event** (`analysis/requested`) from the
  API route, which returns `202 Accepted` in <200ms with `{ jobId, traceId }`.
- The Inngest function executes durable, individually-retriable steps:
  `mark-processing → assemble-context → call-ai → validate → persist →
  complete → notify`.
- The client **polls** `GET /api/v1/analyses/[id]/status` — it reads the
  `AnalysisJob` row and is independent of any function lifetime.
- Every job carries a `traceId` (UUID) generated at the API layer, stored on
  `AnalysisJob.traceId`, attached to the Inngest event, and included on every
  log line and Sentry event for that job.
- Jobs are idempotent via a client-generated `idempotencyKey`. A duplicate key
  returns the existing `jobId` — never a second job.

See `skills/api-route-scaffolder` for the dispatch pattern and the AI pipeline
section of the PRD for step detail.

## Routing & API versioning

- All **data** routes live under `app/api/v1/**`. Breaking changes ship under a
  new prefix (`/api/v2`); additive changes stay in the current version.
- **Framework-bound** routes stay unversioned by convention:
  `app/api/auth/[...nextauth]`, `app/api/uploadthing`, `app/api/inngest`,
  `app/api/webhooks/flutterwave`, `app/api/health`.
- Route segments use Next.js conventions: route groups `(marketing)`, `(auth)`,
  `(app)`; dynamic segments `[projectId]`.

## Quota & limits

- `lib/plans.ts` is the **single source of truth** for plan limits. The pricing
  page, the limits matrix, enforcement, and tests all read from it. Never
  hardcode a limit anywhere else.
- `lib/quota.ts` exposes `assertCanRunAnalysis(userId)`,
  `assertCanCreateProject(userId)`, etc. Call these in the route handler before
  the quota-consuming action.
- Monthly quotas live in `UsageRecord` (keyed `userId + period`). Burst limits
  use `@upstash/ratelimit`. Counter increments happen in the same transaction as
  the action they gate.

## State & terminal flows

- `AnalysisJob.status`: `QUEUED → PROCESSING → COMPLETED | FAILED | CANCELLED`.
  Treat `COMPLETED`, `FAILED`, `CANCELLED` as terminal — never transition out.
- Cancellation is only valid from `QUEUED` or `PROCESSING`.

## What not to do

- Do not call AI models, send email, or do heavy work synchronously in a request.
- Do not access Prisma from a Client Component.
- Do not put business logic in route handlers or React components.
- Do not introduce a new top-level dependency without checking it against the
  stack table in `AGENTS.md`.

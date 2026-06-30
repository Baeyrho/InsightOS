# AGENTS.md — InsightOS

> Entry point for any AI coding agent (Antigravity) working in this repository.
> Read this file first. It tells you what the product is, how the codebase is
> organized, the non-negotiable rules, and where to find deeper context.

---

## 1. What you are building

**InsightOS** is a web-based **UX Research Intelligence Platform**. Users upload
research artifacts (interview transcripts, survey exports, usability notes,
customer feedback), and an AI pipeline converts them into structured,
decision-ready outputs: **pain points, Jobs-To-Be-Done, opportunity areas,
feature recommendations, and design considerations**.

Positioning: _transform raw user feedback into prioritized product and design
decisions._ The product's value is **decision output**, not research storage.

The canonical specification is the **Product Requirements Document (PRD)**. When
this file and the PRD disagree, the PRD wins for *product* decisions; this file
and `.agents/rules/*` win for *implementation* conventions.

---

## 2. Tech stack (do not substitute without an explicit instruction)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router), React Server Components |
| Language | TypeScript, **strict mode** |
| Styling | CSS Modules + CSS Custom Properties (design tokens) |
| UI primitives | Radix UI (unstyled, accessible) |
| Auth | Auth.js v5 (NextAuth) — **email/password only** |
| Database | PostgreSQL via Prisma ORM |
| Async jobs | Inngest (durable execution for the AI pipeline) |
| Cache / rate limit / quotas | Upstash Redis |
| File storage | UploadThing (S3-backed) |
| AI | DeepSeek API (`deepseek-chat`) via OpenAI-compatible SDK |
| Validation | Zod (every boundary) |
| Client data | TanStack Query (React Query) |
| **Payments** | **Flutterwave** (NOT Stripe) |
| Email | Nodemailer (SMTP) |
| Analytics / flags | PostHog |
| Errors / tracing | Sentry |
| Hosting | Vercel (app) + Supabase (Postgres) |

> ⚠️ **Payments:** This project uses **Flutterwave**. The PRD's `Subscription`
> model originally referenced Stripe — those fields are replaced with Flutterwave
> equivalents. See `skills/flutterwave-integration/SKILL.md`.

> ⚠️ **Auth:** Only email/password authentication is supported.

---

## 3. Repository structure

```
app/
  (marketing)/            # public landing, pricing, about
  (auth)/                 # login, register, verify-email, forgot-password
  (app)/                  # authenticated app (dashboard, projects, settings)
  api/
    auth/[...nextauth]/   # Auth.js (unversioned)
    uploadthing/          # UploadThing webhook (unversioned)
    inngest/              # Inngest dispatch endpoint
    webhooks/flutterwave/ # Flutterwave webhook (signature-verified)
    health/               # health check (db + redis)
    v1/                   # ALL versioned data routes live here
components/
  ui/                     # shared, token-only primitives (Radix-wrapped)
  <feature>/              # feature-scoped components
lib/
  validations/            # Zod schemas (co-located contracts)
  auth/                   # session + authorization helpers
  quota.ts                # plan/quota enforcement
  plans.ts                # SINGLE source of truth for plan limits
  prisma.ts               # Prisma singleton
  redis.ts                # Upstash client
  logger.ts               # structured logging (pino)
  flutterwave/            # payment client + helpers
inngest/
  functions/              # background jobs (e.g. analyze.ts)
prisma/
  schema.prisma
  seed.ts
styles/
  tokens.css              # design tokens — the ONLY place literals live
evals/
  fixtures/               # AI golden dataset
```

---

## 4. Context system (how to use this folder)

- **`.agents/rules/*`** — always-on conventions. Treat them as constraints on
  every change. Read all four before writing code:
  - `architecture.md` — layering, async jobs, data flow, routing
  - `code-style.md` — TypeScript, naming, errors, imports, tests
  - `design-system.md` — tokens, components, accessibility, responsive
  - `security.md` — auth, authz, validation, secrets, webhooks, AI safety
- **`skills/*`** — invokable capabilities for specific tasks. Open the relevant
  `SKILL.md` before doing that kind of work:
  - `flutterwave-integration` — payments, subscriptions, webhooks
  - `component-builder` — building a UI component correctly
  - `api-route-scaffolder` — building a versioned API route correctly
  - `db-migration-runner` — schema changes and migrations
- **`workflows/*`** — ordered procedures that combine rules + skills:
  - `new-component.md`, `new-api-route.md`

---

## 5. Golden rules (non-negotiable)

1. **Validate every external input with Zod** at the boundary before use.
2. **Every protected route checks auth AND ownership.** Never trust a client ID.
3. **No literals in styles.** Colors, spacing, radii, fonts come from tokens.
4. **No `any`** without an inline justification comment. Strict TS, no exceptions.
5. **The AI pipeline runs in Inngest, never inline** — serverless functions
   time out at 60s; analysis takes up to 180s.
6. **Quota and rate limits are enforced server-side** via `lib/quota.ts` +
   Upstash. The UI reflects limits but is never the gate.
7. **Secrets are server-only.** Never import a secret into a client component or
   `NEXT_PUBLIC_*` var.
8. **No PII in logs or analytics** — no emails, research content, quotes, or file
   URLs in Sentry/PostHog/log lines.
9. **Payments go through Flutterwave**, and webhooks are signature-verified AND
   re-verified against the Flutterwave API before fulfilling anything.
10. **Migrations are forward-only.** Never edit an applied migration. See
    `skills/db-migration-runner`.

---

## 6. Commands

```bash
pnpm install            # install deps
docker compose up -d    # local Postgres + Redis
pnpm db:migrate         # prisma migrate dev
pnpm db:seed            # seed demo user + project + analysis
pnpm db:reset           # drop, re-migrate, re-seed
pnpm dev                # next dev (http://localhost:3000)
pnpm inngest:dev        # Inngest dev server (separate terminal)
pnpm typecheck          # tsc --noEmit (must be clean)
pnpm lint               # eslint + stylelint (must be clean)
pnpm test               # vitest unit + integration
pnpm test:e2e           # playwright
pnpm eval               # AI eval harness against golden dataset
```

Set `AI_MOCK=true` in `.env.local` to develop the full flow without calling
DeepSeek (returns deterministic fixture analysis).

---

## 7. Definition of Done (summary — full list in the PRD)

Before considering any change complete:
- `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass.
- New/changed inputs validated with Zod; auth + ownership enforced.
- Loading, empty, and error states implemented for any UI.
- Accessibility: keyboard-operable, axe-clean, labels present (WCAG 2.1 AA).
- PostHog events instrumented for new user-facing actions.
- Prisma migration included and tested if the schema changed.
- No secrets, PII, or literals leaked into the wrong layer.

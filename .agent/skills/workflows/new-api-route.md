# Workflow: New API Route

> Ordered procedure for adding an HTTP endpoint to InsightOS. Combines the
> `api-route-scaffolder` skill with the `architecture`, `security`, and
> `code-style` rules.

**Read first:** `skills/api-route-scaffolder/SKILL.md`,
`.agents/rules/architecture.md`, `.agents/rules/security.md`.

## Steps

1. **Define the contract.**
   - Method(s), path, request shape, response shape, auth requirement.
   - Is it a collection (`/resource`) or an item (`/resource/[id]`)?
   - Is the work fast (inline) or long-running (dispatch to Inngest)?

2. **Place the file.**
   - Data route → `app/api/v1/<resource>/route.ts` or
     `app/api/v1/<resource>/[id]/route.ts`.
   - Framework/webhook route → keep unversioned (`auth`, `uploadthing`,
     `inngest`, `webhooks/flutterwave`, `health`).

3. **Write/extend the Zod schema** in `lib/validations/<resource>.ts` and export
   the inferred type. This schema is the shared client/server contract.

4. **Implement the handler in the required order:**
   1. `requireAuth()` — authenticate.
   2. For item routes: `requireProjectOwner(id, userId)` (or equivalent) — 403 if
      not owner.
   3. `Schema.parse(body)` — validate; 422 with field details on failure.
   4. `assert*` from `lib/quota.ts` — enforce quota/rate limits server-side.
   5. Call a **service** in `lib/services/**` (no logic in the handler).
   6. Return the standard envelope with the correct status code.

5. **If long-running, dispatch — don't run inline.**
   - Create the job row (`QUEUED`) with a client-supplied `idempotencyKey` and a
     generated `traceId`.
   - `inngest.send({ name: "...", data: { jobId, traceId, idempotencyKey } })`.
   - Return `202` with `{ jobId, traceId }`. Duplicate key → existing `jobId`.

6. **Errors.**
   - Throw typed domain errors; map them centrally via `toErrorResponse`.
   - Never leak internals. Use the `{ error: { code, message, details? } }`
     envelope and the status table from the scaffolder skill.

7. **Webhooks only:** verify the signature **before** parsing the body, dedupe on
   the provider event id, and re-verify with the provider API before fulfilling
   (see `skills/flutterwave-integration/SKILL.md`).

8. **Logging & privacy.**
   - Log with context and `traceId`; **no PII** (no email, research content,
     quotes, file URLs).

9. **Instrument analytics** if this is a user-facing action (PostHog event with
   IDs/enums/counts only — never content).

10. **Write integration tests** (Vitest + ephemeral Postgres):
    - Happy path (200/201/202).
    - 401 unauthenticated, 403 not-owner, 422 invalid body.
    - 409/429 where applicable; idempotency for async dispatch.

11. **Verify Definition of Done.**
    ```bash
    pnpm typecheck && pnpm lint && pnpm test
    ```

## Anti-checklist (stop if any is true)

- ❌ Business logic living in the route handler.
- ❌ Missing auth or ownership check.
- ❌ Trusting a client-supplied ID without an ownership query.
- ❌ Unvalidated input reaching a service or Prisma.
- ❌ Long work (AI analysis, email, heavy compute) running inline in the request.
- ❌ A data route placed outside `/api/v1`.
- ❌ A webhook that fulfills before verifying signature + re-verifying the txn.
- ❌ PII in logs or analytics.

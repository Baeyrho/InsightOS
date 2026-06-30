# Skill: API Route Scaffolder

> Use this when creating or modifying an HTTP endpoint. It enforces the
> repo's route contract: versioning, validation, auth, ownership, quota, the
> standard error envelope, and correct status codes.
> Pairs with `.agents/rules/architecture.md`, `security.md`, and
> `workflows/new-api-route.md`.

## Where routes live

- **Data routes** → `app/api/v1/**` (versioned).
- **Framework routes** stay unversioned: `auth/[...nextauth]`, `uploadthing`,
  `inngest`, `webhooks/flutterwave`, `health`.
- File: `app/api/v1/<resource>/route.ts` (collection) and
  `app/api/v1/<resource>/[id]/route.ts` (item).

## The handler skeleton (order matters)

```ts
// app/api/v1/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { assertCanCreateProject } from "@/lib/quota";
import { CreateProjectSchema } from "@/lib/validations/projects";
import { createProject, listProjects } from "@/lib/services/projects";
import { toErrorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();              // 1. authenticate
    const projects = await listProjects(session.user.id, req.nextUrl.searchParams);
    return NextResponse.json({ projects }, { status: 200 });
  } catch (err) {
    return toErrorResponse(err);                      // standard envelope
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();              // 1. authenticate
    const body = await req.json();
    const input = CreateProjectSchema.parse(body);    // 2. validate (Zod) → 422 on fail
    await assertCanCreateProject(session.user.id);    // 3. quota/rate (server-side)
    const project = await createProject(session.user.id, input); // 4. service
    return NextResponse.json({ project }, { status: 201 });      // 5. respond
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

For an **item route** that touches a specific resource, add an **ownership**
check between auth and the action:

```ts
const session = await requireAuth();
await requireProjectOwner(params.projectId, session.user.id); // 403 if not owner
```

## Async endpoints (the analysis dispatch pattern)

Long work is dispatched to Inngest and acknowledged immediately — never run
inline (see `architecture.md`).

```ts
// app/api/v1/projects/[id]/analyses/route.ts  (POST)
const session = await requireAuth();
await requireProjectOwner(params.id, session.user.id);
const { idempotencyKey } = TriggerAnalysisSchema.parse(await req.json());
await assertCanRunAnalysis(session.user.id);          // quota + Redis burst limit

const { jobId, traceId } = await createAnalysisJob({  // QUEUED + idempotencyKey + traceId
  projectId: params.id, idempotencyKey,
});
await inngest.send({ name: "analysis/requested", data: { jobId, traceId, idempotencyKey } });

return NextResponse.json({ jobId, traceId, estimatedMs: 90000 }, { status: 202 });
```

If the same `idempotencyKey` already exists, return the existing `jobId` (no new
job).

## Standard error envelope

```ts
// lib/errors.ts maps typed domain errors → HTTP
// { error: { code, message, details? } }
```

| Situation | Status | code |
|-----------|--------|------|
| Success (GET/PATCH) | 200 | — |
| Created | 201 | — |
| Async accepted | 202 | — |
| Deleted | 204 | — |
| Validation failed | 422 | `VALIDATION_ERROR` (+ field details) |
| Unauthenticated | 401 | `UNAUTHORIZED` |
| Authenticated, not allowed | 403 | `FORBIDDEN` / `*_QUOTA_EXCEEDED` |
| Not found | 404 | `NOT_FOUND` |
| State conflict | 409 | `CONFLICT` |
| Rate limited | 429 | `*_RATE_LIMITED` |
| Server error | 500 | `INTERNAL` |

Never leak stack traces or internal messages to the client.

## Validation schema (co-located contract)

Add/extend the Zod schema in `lib/validations/<resource>.ts` and export the
inferred type. The same schema is reused on the client.

```ts
export const CreateProjectSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).optional(),
  researchType: z.enum(["INTERVIEW","SURVEY","USABILITY","FEEDBACK","NPS","OTHER"]).optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
```

## Rules (must follow)

- Authenticate first; check ownership for any specific resource.
- Validate **every** input with Zod before use.
- Enforce quota/rate limits server-side; the UI is not the gate.
- Keep handlers thin — logic goes in `lib/services/**`.
- Use the standard envelope and correct status codes.
- Webhooks (Flutterwave) verify signatures first — see the flutterwave skill.

## Test checklist (integration, Vitest + ephemeral Postgres)

- 200/201/202 happy path.
- 401 when unauthenticated.
- 403 when authenticated but not the owner.
- 422 on invalid body (assert field details).
- 409/429 for conflict/rate-limit paths where applicable.
- Idempotency for async dispatch (same key → one job).

## Done when

- `pnpm typecheck`, `pnpm lint`, integration tests pass.
- Zod schema co-located and reused; types inferred.
- Auth + ownership + quota enforced; standard envelope used.
- PostHog event instrumented if this is a user-facing action.

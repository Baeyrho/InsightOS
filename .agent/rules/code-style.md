---
trigger: always_on
---

# Rule: Code Style

> Conventions for all TypeScript/React code in this repo. Enforced by ESLint,
> Prettier, and stylelint in CI.

## TypeScript

- **Strict mode is on.** No implicit `any`, no unchecked indexed access.
- **No `any`.** If genuinely unavoidable, use `unknown` and narrow, or add an
  inline `// eslint-disable-next-line ... -- reason` with a real reason.
- Prefer `type` for unions/aliases, `interface` for object shapes that may be
  extended. Be consistent within a file.
- Derive types from sources of truth: infer from Zod schemas
  (`z.infer<typeof Schema>`) and from Prisma (`Prisma.ProjectGetPayload<...>`)
  rather than hand-writing duplicate shapes.
- No non-null assertions (`!`) to silence the compiler — narrow properly.
- Functions that can fail return typed results or throw typed errors; don't
  return `null` to mean "error".

## Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Files (components) | PascalCase | `ProjectCard.tsx` |
| Files (other) | kebab-case | `use-analysis-status.ts`, `quota.ts` |
| React components | PascalCase | `function InsightCard()` |
| Hooks | camelCase, `use` prefix | `useAnalysisStatus` |
| Variables / functions | camelCase | `assertCanRunAnalysis` |
| Types / interfaces / enums | PascalCase | `AnalysisStatus` |
| Constants | UPPER_SNAKE_CASE | `PLAN_LIMITS` |
| Zod schemas | PascalCase + `Schema` | `CreateProjectSchema` |
| CSS Modules | kebab-case classes | `.insight-card` |

- Booleans read as predicates: `isReady`, `hasQuota`, `canExport`.
- Event handlers: `handleSubmit`, `onSelect` for props.

## Imports

Order, separated by blank lines:
1. External packages (`react`, `next`, `zod`, …)
2. Internal aliases (`@/lib/...`, `@/components/...`)
3. Relative imports (`./...`)
4. Type-only imports use `import type { ... }`.

Use the `@/` path alias for anything outside the current feature folder. No deep
relative chains (`../../../`).

## Validation & boundaries

- **Every external input is parsed with Zod** before use: request bodies, query
  params, route params, webhook payloads, and AI output.
- Zod schemas live in `lib/validations/` and are the shared contract between
  client and server. Export inferred types from them.
- Parse, don't validate-and-cast: use `Schema.parse()` / `safeParse()` and work
  with the parsed result.

## Error handling

- Use the standard API error envelope everywhere:

  ```ts
  // { error: { code, message, details? } }
  return Response.json(
    { error: { code: "VALIDATION_ERROR", message: "Request body invalid",
               details: zodIssues } },
    { status: 422 }
  );
  ```

- Define typed domain errors (e.g. `QuotaError`, `NotFoundError`,
  `ForbiddenError`) and map them to HTTP status codes in one place.
- Never swallow errors. Log with context (and `traceId` for jobs), then surface
  a user-safe message. Never leak stack traces or internal detail to clients.
- No floating promises — `await` or explicitly `void` with a reason.

## React / components

- Functional components only. Co-locate the component with its `.module.css`.
- Always handle three states for any async UI: **loading, empty, error.**
- Keep components focused; extract logic into hooks (`use-*`) and helpers.
- No inline styles for anything themable — use CSS Modules + tokens (see
  `design-system.md`).
- Never use browser storage (`localStorage`/`sessionStorage`) for app state in a
  way that bypasses server state; session lives in Auth.js cookies.

## Comments

- Comment **why**, not **what**. The code says what it does.
- No commented-out code, no `TODO` left in merged branches (open an issue
  instead).
- Public service functions get a one-line JSDoc describing intent and failure
  modes.

## Formatting

- Prettier is authoritative for formatting; do not fight it.
- 2-space indent, single quotes, trailing commas, semicolons on.
- Keep lines readable (~100 cols). Break long chains.

## Tests

- Co-locate unit tests as `*.test.ts` next to the source.
- Test happy path **and** key failure paths.
- Name tests by behavior: `it("rejects a second analysis with the same idempotency key")`.
- Use factories, not shared fixtures, for test entities.
- Never call live external services or the real AI key in tests (use the
  AI mock; integration tests use an ephemeral Postgres).

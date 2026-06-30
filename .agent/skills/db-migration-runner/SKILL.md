# Skill: DB Migration Runner

> Use this for any change to `prisma/schema.prisma` or the database. Prisma
> Migrate is **forward-only** here — there are no down migrations. Follow this
> exactly to avoid corrupting migration history.

## When to use

- Adding/changing a model, field, enum, index, or relation.
- Creating a migration after a schema edit.
- Seeding or resetting local data.
- Anything that changes the database shape.

## The loop (local development)

```bash
# 1. Edit prisma/schema.prisma

# 2. Create + apply a migration against your local dev DB
pnpm db:migrate            # = prisma migrate dev --name <change>
#    You will be prompted for a name — use a short, descriptive,
#    kebab-case name, e.g. "add-subscription-flutterwave-fields"

# 3. Regenerate the client (usually automatic after migrate dev)
pnpm prisma generate

# 4. Reseed if needed
pnpm db:seed
```

Local infra must be running first: `docker compose up -d` (Postgres + Redis).

## Naming migrations

- kebab-case, action-first, specific:
  - `add-payment-event-model`
  - `add-usage-record-indexes`
  - `rename-subscription-stripe-to-flutterwave`
- One logical change per migration. Don't bundle unrelated edits.

## Forward-only rule (critical)

- **Never edit a migration that has already been applied/committed.** It breaks
  the migration history and the shadow-DB checksum.
- There are **no down migrations.** To undo a bad change, write a **new forward
  migration** that corrects it.
- To recover production from a destructive migration, use **Supabase
  point-in-time restore** — not a manual rollback.

## Shadow database

`prisma migrate dev` uses a shadow database to detect drift and validate
migrations. Ensure `SHADOW_DATABASE_URL` is set locally (the docker-compose
Postgres can host it, or use a second DB). If you see drift errors, do **not**
delete migrations — investigate; usually someone edited an applied migration or
changed the DB by hand.

## Destructive changes

Prisma warns when a change drops a column/table or risks data loss.

- For dropping/renaming columns with data: stage it.
  1. Add the new column (nullable) in one migration.
  2. Backfill data (script).
  3. Switch reads/writes in code.
  4. Drop the old column in a later migration once nothing uses it.
- Renames: Prisma may interpret a rename as drop+add. Use `@@map`/`@map` or an
  explicit SQL migration when you must preserve data.

Example — the Stripe→Flutterwave rename on `Subscription` is a destructive field
change; since there is no live billing data in the MVP, a direct migration is
acceptable. If data existed, stage it as above.

## Production migrations

- Never run `migrate dev` against production.
- Migrations are applied in CI/deploy with `prisma migrate deploy` (applies
  committed migrations, no prompts, no shadow DB).
- Order: run `migrate deploy` **before** the new app code goes live so the
  schema is ready. Keep migrations backward-compatible with the currently
  running code when possible (expand/contract pattern) to allow zero-downtime
  deploys.

## Seed & reset

```bash
pnpm db:seed     # idempotent seed: demo user + sample project + completed analysis
pnpm db:reset    # drop → migrate → seed (local only; destroys local data)
```

Seed data is synthetic (no real participant data) and safe to commit.

## Commands reference

| Command | Purpose |
|---------|---------|
| `pnpm db:migrate` | `prisma migrate dev` — create + apply locally |
| `pnpm prisma generate` | regenerate the typed client |
| `pnpm db:seed` | run `prisma/seed.ts` |
| `pnpm db:reset` | reset local DB and reseed |
| `prisma migrate deploy` | apply committed migrations (CI/prod) |
| `prisma migrate status` | check applied vs pending |

## Done when

- Schema change is captured in a single, well-named forward migration.
- `pnpm prisma generate` run; types compile (`pnpm typecheck`).
- Seed updated if new required data is needed; `pnpm db:reset` works clean.
- No applied migration was edited; no manual DB changes made.
- Indexes added for new foreign keys and common query filters.

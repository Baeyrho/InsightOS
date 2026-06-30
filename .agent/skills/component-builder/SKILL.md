# Skill: Component Builder

> Use this when creating or modifying a React UI component. It encodes the
> repo's component conventions so output is consistent and accessible.
> Pairs with `.agents/rules/design-system.md` and `workflows/new-component.md`.

## When to use

- Adding a new shared primitive to `components/ui/`.
- Adding a feature component to `components/<feature>/`.
- Refactoring an existing component.

## Decide: shared vs feature

- **Shared (`components/ui/`)** — generic, reusable, no business logic
  (`Button`, `Dialog`, `StatusBadge`, `EmptyState`). Tokens only.
- **Feature (`components/<feature>/`)** — knows about domain concepts
  (`InsightCard`, `PainPointRow`, `AnalysisJobCard`). May compose `ui/`
  primitives and call hooks.

## Anatomy of a component

Co-locate three files:

```
components/insights/InsightCard/
  InsightCard.tsx
  InsightCard.module.css
  InsightCard.test.tsx
```

### `InsightCard.tsx`

```tsx
import styles from "./InsightCard.module.css";
import type { Severity } from "@/lib/validations/insight";

interface InsightCardProps {
  title: string;
  description: string;
  severity: Severity;
  frequency: number;
  onFlag?: (flag: "ACCEPTED" | "REJECTED" | "NEEDS_REVIEW") => void;
}

const SEVERITY_CLASS: Record<Severity, string> = {
  CRITICAL: styles.severityCritical,
  HIGH: styles.severityHigh,
  MEDIUM: styles.severityMedium,
  LOW: styles.severityLow,
};

export function InsightCard({ title, description, severity, frequency }: InsightCardProps) {
  return (
    <article className={styles.card} aria-labelledby={`insight-${title}`}>
      <header className={styles.header}>
        <h3 id={`insight-${title}`} className={styles.title}>{title}</h3>
        <span className={`${styles.badge} ${SEVERITY_CLASS[severity]}`}>
          {/* color is NOT the only signal — text label too */}
          {severity}
        </span>
      </header>
      <p className={styles.description}>{description}</p>
      <p className={styles.meta}>Mentioned by {frequency} participant(s)</p>
    </article>
  );
}
```

### `InsightCard.module.css`

```css
.card {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}
.header { display: flex; justify-content: space-between; gap: var(--space-3); }
.title { font-size: var(--text-lg); color: var(--color-text); }
.badge { font-size: var(--text-sm); font-weight: 600; }
.severityCritical { color: var(--severity-critical); }
.severityHigh { color: var(--severity-high); }
.severityMedium { color: var(--severity-medium); }
.severityLow { color: var(--severity-low); }
.description { color: var(--color-text); }
.meta { color: var(--color-text-muted); font-size: var(--text-sm); }
```

## Required states for async surfaces

Any component that displays fetched data implements all three:

```tsx
if (isLoading) return <Skeleton />;            // loading
if (isError)   return <ErrorState onRetry={refetch} />;  // error
if (!data?.length) return <EmptyState ... />;  // empty (icon + headline + CTA)
```

Empty states follow the PRD pattern: illustrative icon, headline, subheading,
primary CTA.

## Rules (must follow)

- **Tokens only** — no literal colors/spacing/radii/fonts. (`design-system.md`)
- **Build interactive primitives on Radix** (Dialog, Tabs, DropdownMenu…) for
  free accessibility; style with CSS Modules + tokens.
- **Accessibility:** semantic elements, labels on icon-only buttons, keyboard
  operable, visible focus, `aria-live` for status changes, color never the sole
  signal.
- **Server vs client:** keep components server by default; add `"use client"`
  only when state/effects/browser APIs are needed, and keep those at the leaves.
- **No data fetching inside deep components** — pass data in, or use a `use-*`
  hook (React Query) at the appropriate level.
- **Props are typed**; derive domain types from Zod/Prisma, don't redefine.

## Test checklist (`*.test.tsx`, Vitest + Testing Library)

- Renders with representative props.
- Loading, empty, and error states render correctly.
- Interactive behavior works via keyboard.
- `axe` finds no violations.

## Done when

- `pnpm typecheck`, `pnpm lint` (incl. stylelint token rule) pass.
- All three async states handled (if applicable).
- axe-clean and keyboard-operable.
- Test file covers render + key interaction.

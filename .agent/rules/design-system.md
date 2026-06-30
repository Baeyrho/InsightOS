---
trigger: always_on
---

# Rule: Design System

> Visual and interaction conventions. The audience is designers and UX
> professionals — they will notice sloppiness immediately. Treat polish and
> accessibility as correctness, not decoration.

## Tokens are the only source of visual values

- All colors, spacing, radii, typography, and shadows come from CSS Custom
  Properties defined in **`styles/tokens.css`**.
- **No literal hex, rgb, or px values** anywhere else. A stylelint rule bans
  literals outside `tokens.css`; if you need a new value, add a token.
- This makes dark mode and Phase-3 white-labeling a token swap, not a refactor.

```css
/* styles/tokens.css (excerpt — extend, don't duplicate) */
:root {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-navy: #1e3a5f;

  --color-success: #059669;
  --color-warning: #d97706;
  --color-danger: #dc2626;

  /* Severity scale — used by the insight system */
  --severity-critical: #dc2626;
  --severity-high: #ea580c;
  --severity-medium: #d97706;
  --severity-low: #65a30d;

  --color-bg: #ffffff;
  --color-surface: #f9fafb;
  --color-border: #e5e7eb;
  --color-text: #111827;
  --color-text-muted: #6b7280;

  /* 4px spacing scale */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem;    --space-6: 1.5rem; --space-8: 2rem;

  --font-sans: system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "SF Mono", monospace;
  --text-sm: 0.875rem; --text-base: 1rem; --text-lg: 1.125rem;
  --text-xl: 1.25rem;  --text-2xl: 1.5rem;

  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
}
```

## Styling mechanism

- **CSS Modules** (`*.module.css`), one per component, co-located.
- No Tailwind, no CSS-in-JS. The stack standardizes on CSS Modules for
  zero-runtime, scoped styles.
- Reference tokens with `var(--token)`. Compose, don't hardcode.

```css
/* InsightCard.module.css */
.card {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}
.severityCritical { color: var(--severity-critical); }
```

## Components & primitives

- Build interactive primitives on **Radix UI** (Dialog, DropdownMenu, Tabs,
  Tooltip, etc.). Radix supplies WAI-ARIA behavior (focus trap, keyboard nav,
  roles) for free; we style it with tokens.
- Do **not** adopt a themed component library that fights the token system.
- Shared, reusable components live in `components/ui/` and consume tokens only.
  Feature-specific components live in `components/<feature>/`.
- Every async surface implements **loading, empty, and error** states. Empty
  states follow the PRD pattern: icon + headline + subheading + primary CTA.

## Accessibility — WCAG 2.1 AA (required)

- **Contrast:** text meets AA (4.5:1 normal, 3:1 large). Verify severity colors
  against their backgrounds.
- **Keyboard:** every interactive element is reachable and operable by keyboard;
  visible focus indicators are never removed without an equivalent replacement.
- **Focus management:** modals trap focus and restore it on close; on route
  change, move focus to the page heading.
- **Screen readers:** semantic landmarks; `aria-label` on icon-only buttons;
  announce async status changes (analysis progress) via `aria-live` regions.
- **Forms:** every input has a `<label>`; errors linked with `aria-describedby`
  and announced.
- **Color is never the only signal:** severity uses a text label as well as
  color.
- **Motion:** respect `prefers-reduced-motion`.
- **Testing:** `axe-core` runs in CI on every page; a manual keyboard +
  screen-reader pass is part of the Definition of Done.

## Responsive behavior

| Breakpoint | Width | Experience |
|-----------|-------|-----------|
| Desktop | ≥1280px | Full experience (primary target) |
| Laptop | 1024–1279px | Full; dashboard may collapse to two columns |
| Tablet | 768–1023px | Sidebar → collapsible drawer; single-column insights |
| Mobile | <768px | Read-optimized: view insights, run/monitor analyses, export, paste-text upload. Heavy authoring is desktop-first. |

- Mobile-first CSS, layered up with `min-width` media queries.
- Use the spacing scale for all gaps; never magic numbers.

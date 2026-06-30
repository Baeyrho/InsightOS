# Workflow: New Component

> Ordered procedure for adding a UI component to InsightOS. Combines the
> `component-builder` skill with the `design-system` and `code-style` rules.

**Read first:** `skills/component-builder/SKILL.md`,
`.agents/rules/design-system.md`, `.agents/rules/code-style.md`.

## Steps

1. **Clarify the component's job.**
   - What does it display/do? What props does it take?
   - Does it show fetched data? If so, it must handle loading/empty/error.

2. **Decide placement.**
   - Generic + reusable, no domain logic → `components/ui/<Name>/`.
   - Domain-aware → `components/<feature>/<Name>/`.

3. **Decide server vs client.**
   - Default to a Server Component.
   - Add `"use client"` only if it needs state, effects, or browser APIs — and
     push that boundary to the smallest leaf possible.

4. **Scaffold the files** (co-located):
   ```
   components/<area>/<Name>/
     <Name>.tsx
     <Name>.module.css
     <Name>.test.tsx
   ```

5. **Type the props.**
   - Derive domain types from Zod/Prisma; don't redefine shapes.
   - Booleans as predicates (`isLoading`, `hasQuota`).

6. **Build with Radix + tokens.**
   - Use a Radix primitive for any interactive widget (Dialog, Tabs, Menu…).
   - Style with CSS Modules; **only** `var(--token)` values — no literals.

7. **Implement required states** (if it shows async data):
   - Loading skeleton, error state (with retry), empty state (icon + headline +
     subheading + CTA).

8. **Accessibility pass.**
   - Semantic elements; labels on icon-only buttons; keyboard operable; visible
     focus; `aria-live` for status changes; color is never the only signal.

9. **Wire data correctly.**
   - No fetching deep inside the tree. Pass data in, or use a `use-*` React Query
     hook at the right level. Namespace query keys by resource.

10. **Write the test** (`<Name>.test.tsx`, Vitest + Testing Library):
    - Renders with representative props.
    - Loading/empty/error states (if applicable).
    - Key interaction via keyboard.
    - `axe` finds no violations.

11. **Verify Definition of Done.**
    ```bash
    pnpm typecheck && pnpm lint && pnpm test
    ```
    - stylelint token rule passes (no literal colors/px).
    - Instrument a PostHog event if the component triggers a user-facing action.

## Anti-checklist (stop if any is true)

- ❌ Literal hex/px in the `.module.css`.
- ❌ A hand-rolled dropdown/dialog instead of Radix.
- ❌ Missing empty/error state on a data component.
- ❌ Fetching data inside a leaf component.
- ❌ Icon-only button with no accessible label.

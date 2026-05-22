# Design System

<!--
TEACHING NOTE: Loaded by BUILD agents. Contains the visual quality floor.
This is the "how things should look" reference.

A design system doc should be PRESCRIPTIVE about the minimum bar
but PERMISSIVE about creative execution. "Every page needs a
consistent header" is a requirement. "The header must be exactly
64px tall with #1a1a2e background" is a recipe.
-->

## Visual Philosophy

Clean, user-friendly. There should not be too much bloat on the screen and it should be easy to look at.

<!-- ## Color

| Token | Value | Use |
|-------|-------|-----|
| `--bg-primary` | `#0f0f1a` | Page backgrounds |
| `--bg-surface` | `#1a1a2e` | Cards, panels |
| `--text-primary` | `#e0e0e0` | Body text |
| `--accent` | `#6366f1` | Links, buttons, highlights |
| `--success` | `#22c55e` | Positive states |
| `--warning` | `#f59e0b` | Caution states |
| `--error` | `#ef4444` | Error states | -->

## Typography

- **Headings:** Inter or system sans-serif, bold
- **Body:** Inter or system sans-serif, regular
- **Code:** JetBrains Mono or system monospace

## Layout Principles

- Max content width: 1200px
- Generous padding (24px minimum on containers)
- Visual hierarchy through size and weight, not just color
- Dark mode is the default. Light mode is optional.

## Copy & Terminology

- **Spell the role "Imposter" / "imposter"** (plural "Imposters") in every piece of user-facing copy — titles, buttons, body text, microcopy. **Never "impostor".** If you spot "impostor" in an existing screen, treat it as a bug to fix.

## Quality Floor

Every deliverable must have:
- Consistent color usage
- Readable typography (16px minimum body text)
- Clear visuals (you should be able to scan in 3 seconds)
- Responsive layout (unless explicitly desktop-only)

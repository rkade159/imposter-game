# Spec — Show Fellow Imposters

## Source brief

[02-development/workflow/01-brief/show-fellow-imposters-brief.md](../01-brief/show-fellow-imposters-brief.md)
(source plan:
[01-plan/plans/show-fellow-imposters-plan-final.md](../../../01-plan/plans/show-fellow-imposters-plan-final.md))

> The "Show fellow imposters" feature appears in **no** reference screenshot; it is
> defined by this spec and its brief alone. This spec runs **ahead** of the build
> (proper `plan → brief → spec → build` order).

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a
**contract, not a blueprint**. It states WHAT must be true — observable behaviour
and the surfaces other code depends on — not exact DOM, class names, or CSS, which
are the builder's call within the constraints below.

Five things *are* mandated because they are the explicit goals of this feature:
(a) a **persisted** Settings toggle labelled **"Reveal fellow imposters"**, **off by
default**, stored in `settings.js` (criteria 1–3); (b) while on, in a **2+ imposter**
round, each imposter's reveal lists the **other imposters by name, excluding
themselves**, in **all three** reveal styles (criteria 6–9); (c) **crewmates, the
toggle being off, and 1-imposter games** all show **nothing** new (criteria 7, 10);
(d) the toggle is **disabled with a note** when the configured imposter count is 1
(criterion 5); (e) the new line is **grayscale-safe** — existing tokens only, no new
colour tell (criterion 13). Everything else — exact wording layout, class names, the
`disabled`-row styling — is the builder's call.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

| File | State after build |
|---|---|
| `src/lib/settings.js` | A `showFellowImposters: false` key is added to the `defaults` object of the existing **persisted** `settings` store. No other change; the store's existing `load()` merge and auto-persist `subscribe` cover migration and saving. |
| `src/components/Toggle.svelte` | Gains an optional `disabled` prop (default `false`) that disables the underlying checkbox and visually softens the row. Default keeps every existing `<Toggle>` usage byte-for-byte unchanged in behaviour. |
| `src/screens/SetupScreen.svelte` | Passes the live imposter count to the settings screen: `<SettingsScreen … impostorCount={impostors} />`. No other logic changes. |
| `src/screens/SettingsScreen.svelte` | Accepts an `impostorCount` prop; adds one `<Toggle>` row bound to `$settings.showFellowImposters`, `disabled` when `impostorCount < 2`, with a note in its description for that case. Existing rows unchanged. |
| `src/screens/RevealScreen.svelte` | Derives a single `fellowImposters` name list (gated on toggle + isImpostor + 2+ imposters, excluding the current player) and renders it, after the hint, in the **Classic** and **Envelope** imposter views; passes the list to `WheelReveal`. |
| `src/components/WheelReveal.svelte` | Accepts a `fellowImposters` prop (default `[]`) and renders the same line, after the hint, in its imposter detail card. |

Files that must **NOT** be modified by this build: `src/lib/game-state.js`
(`displayName` and `roles` are **reused**, not changed), `src/lib/session-settings.js`,
`src/lib/word-source.js`, `src/lib/config.js`, `src/lib/shuffle.js`,
`src/screens/PassScreen.svelte`, `src/screens/DiscussionScreen.svelte`,
`src/screens/ResultsScreen.svelte` (its filter is **copied as a pattern**, not
imported/edited), `src/components/Stepper.svelte`, `src/components/Select.svelte`,
`src/components/Modal.svelte`, `src/App.svelte`, `src/app.css`, `public/data/*`,
`src/service-worker.js`, `src/main.js`, `vite.config.js`, `package.json`,
`index.html`.

## Acceptance criteria

A build is "done" when **every** item below is true.

### Persisted setting (`src/lib/settings.js`)

1. The `settings` store's `defaults` include **`showFellowImposters: false`**.
2. The value is **persisted**: setting it and reloading the app preserves it (it
   uses the existing `localStorage`-backed `settings` store; **no** new store is
   introduced for it). A user with settings saved before this key existed loads with
   it defaulted to `false` (the existing `load()` merge handles this).
3. It is **off by default** (follows from criterion 1).

### Settings screen (`src/screens/SettingsScreen.svelte` + `SetupScreen.svelte`)

4. A new toggle row exists with label **exactly** `Reveal fellow imposters`, bound
   two-way to `$settings.showFellowImposters`, rendered via the existing `Toggle`
   component as a peer of the other setting rows. Its description communicates that
   it applies with **2+ imposters** and shows who the other imposters are.
5. When the **currently configured imposter count is 1**, the toggle is **disabled**
   (not interactable) and its row shows a short note indicating it needs 2+
   imposters. When the count is **≥ 2**, the toggle is enabled and interactable. The
   count is sourced from the live setup value (passed in as `impostorCount`), not
   re-derived.
6. Existing setting rows (Grayscale, Reveal animation, Anti-Yusuf) are **unchanged**.

### Reveal behaviour — the core feature (`RevealScreen.svelte` + `WheelReveal.svelte`)

7. The fellow-imposter line is shown **only** when **all** of these hold: the toggle
   is **on**, the current player **is an imposter**, **and** the round has **2+
   imposters**. In every other case (crewmate, toggle off, single-imposter round)
   **no** such line appears anywhere.
8. When shown, the line names **every other imposter** in the round by their display
   name and **never includes the current player**. Names use
   `displayName(names, i)`, so a blank name field reads **`Player N`**. The list is
   built from `gameState.roles` (the imposters of the round), mirroring the existing
   `ResultsScreen` approach, minus the revealing player's own index.
9. The line appears in **all three** reveal styles — **Classic** (tap card),
   **Secret Letter** (envelope note), and **Wheel of Fate** (detail card) — in the
   imposter view, positioned **after the hint**, with styling consistent with the
   surrounding sub-text of that style.
10. **Crewmates** are unaffected in all three styles: they still see the word and no
    imposter information.

### Data integrity

11. The feature makes **no changes to game-state shape or role assignment**:
    `gameState.roles`, `impostorCount`, names, and the reveal/pass flow are read
    only. Turn order and who is an imposter are unchanged.
12. The current player's own role/identity is never leaked to others by this feature
    (it only ever shows *other* imposters to a confirmed imposter on their own turn).

### Look and feel (baseline only — design comes later)

13. **Grayscale correctness:** the new line uses existing `app.css` **tokens** only
    (no new palette colours) and introduces **no** colour that would let an observer
    infer the imposter under Grayscale mode — consistent with how the three reveal
    styles already handle role colour. Tap targets remain **≥44px**; **no horizontal
    scroll** at a 375px-wide viewport, including when several names wrap.
14. **No console errors or warnings** in dev or in the built preview.

### Code quality

15. **No new dependencies.** `package.json` is unchanged.
16. The fellow-imposter list is **derived once** (in `RevealScreen`) and consumed by
    all three styles; the imposter set is **not** re-derived per style. **Brief
    explanatory comments** sit on each new block per technical-standards (the *why*
    of the gate, the self-exclusion, and the `Toggle` `disabled` prop).
17. **Untouched files stay untouched** — every file in the "must NOT be modified"
    list, especially `game-state.js`, `app.css`, and `ResultsScreen.svelte`.
18. **Production build succeeds.** `npm run build` completes with no errors and no new
    warnings.

## What is NOT acceptance criteria (deferred / explicitly excluded)

- **Showing a count** of imposters, with or instead of names — names only.
- **Revealing imposters to crewmates**, or the word to imposters — out of scope.
- **Per-round / non-persisted control** — it is a single persisted global setting.
- **Hiding** the toggle entirely for 1-imposter games — the contract is **disable +
  note** (criterion 5). Hiding is only an accepted fallback if the `Toggle`
  `disabled` change is rejected, and only with Rehaan's say-so.
- **Reveal animation / design polish** for the new line — a `03-design` concern
  later; functional, token-consistent styling only here.

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder
**writes** this checklist but does **NOT** run `npm run dev` to walk it — **Rehaan
runs the app** and verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No
   console errors.
2. **Settings → Reveal fellow imposters** row is present, **off** by default.
3. **Persists:** turn it **on**, **reload** the app → still **on**.
4. **2+ imposters, on:** start a **3-imposter** game → each imposter's reveal lists
   the **other two** by name and **not** themselves; **crewmates** see no such line.
5. Repeat 4 across **all three** reveal styles (Classic / Secret Letter / Wheel of
   Fate) → the line appears after the hint in each, consistently styled.
6. **Custom names:** rename players → the list shows typed names; a **blank** field
   shows **"Player N"**.
7. **2+ imposters, off:** toggle off → imposters see only their hint, **no** line.
8. **1-imposter game:** set imposters to 1 → in Settings the toggle is **disabled
   with its note**; a 1-imposter reveal shows **no** line even if the stored value
   was on.
9. **Grayscale on:** enable Grayscale → the line is readable and adds **no** colour
   tell. Re-check at 375px (no horizontal scroll, even with long names).
10. Stop the dev server. Run `npm run build`: succeeds with no new errors/warnings.

If any one of criteria 1–18 fails, the build is not done.

## Open questions for the builder

- **Disabled-row styling.** How the disabled `Toggle` row looks (opacity, cursor,
  where the "needs 2+ imposters" note sits) is the builder's call, provided it reads
  as inactive and is genuinely non-interactable (criterion 5).
- **Line wording/format.** "Your fellow imposters: A, B" is the expected phrasing;
  exact punctuation/separator is the builder's call as long as it names every other
  imposter and excludes self (criterion 8).
- **Wheel prop shape.** Passing the resolved name array as `fellowImposters` is
  expected; any equivalent that keeps the single-source-of-truth rule (criterion 16)
  is acceptable.

## Next step

This spec is the contract for the build at
`02-development/workflow/03-builds/imposter-game-app/`. On approval, implement the
six file changes above and deliver the verification checklist for Rehaan to walk.

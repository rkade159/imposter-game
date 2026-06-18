# Brief — Show Fellow Imposters

## Source plan

[01-plan/plans/show-fellow-imposters-plan-final.md](../../../01-plan/plans/show-fellow-imposters-plan-final.md)

## What to build

A persisted **"Reveal fellow imposters"** toggle on the existing **Settings**
screen. While it's on, each imposter's **role reveal** also lists the **names of
the other imposters** — so in a multi-imposter round the imposters know who's on
their team. It only does anything with **2+ imposters**.

Today, an imposter is only told *that they are an imposter* (plus their hint) —
never *who the other imposters are*, so a multi-imposter team can't actually
collude. After this build:

- The **Settings** screen has a new **"Reveal fellow imposters"** toggle
  (description: **"With 2+ imposters, each imposter also sees who the others are
  during the reveal."**), **off by default**.
- **With it ON, in a 2+ imposter round:** each imposter's reveal — in **all three**
  reveal styles — shows, after the hint, a line naming the *other* imposters:

  > Your fellow imposters: **[Name]**, **[Name]**

  The current player is **never** in their own list. **Crewmates see nothing new.**
- **With it OFF:** reveals behave exactly as today — imposter sees only the hint.
- **It persists.** Like Grayscale and Reveal animation, it is stored in the
  existing persisted `settings` store (`localStorage`) and survives a reload.
- **One-imposter games:** the toggle has no possible effect, so it is **disabled
  with a short note** in Settings whenever the configured imposter count is 1.

## Why this is being built now

1. **It makes multi-imposter mode actually work as a team game.** Without it, two
   imposters are just two strangers; with it, they can coordinate their bluffing.
2. **It's small and reuses existing patterns.** The imposter identities are
   already in `gameState.roles`, and
   [ResultsScreen](../03-builds/imposter-game-app/src/screens/ResultsScreen.svelte)
   already builds an imposter-name list the exact same way — this reuses that
   filter at reveal time, minus the current player. No game-state shape changes.
3. **The reveal plumbing already exists.** Three reveal styles already render an
   imposter card; this adds one conditional line to each.

## How the fellow-imposter list is built (the core logic)

The data is already present: `roles[i].isImpostor` identifies imposters and
`displayName(names, i)` resolves each player's label. Build **one derived list in
`RevealScreen`** (the orchestrator for all three styles), gated so the styles only
ever check whether it's non-empty:

```js
$: fellowImposters =
  $settings.showFellowImposters && isImpostor && $gameState.impostorCount >= 2
    ? $gameState.roles
        .map((role, i) => ({ isImpostor: role.isImpostor, i }))
        .filter((e) => e.isImpostor && e.i !== $gameState.revealIndex)
        .map((e) => displayName($gameState.names, e.i))
    : [];
```

Because the gate lives here, a crewmate, a 1-imposter game, or the toggle being
off **all** yield `[]`, so every style renders nothing without repeating the rule.
This mirrors the existing `ResultsScreen` pattern — do **not** invent a new way to
find imposters.

## Scope

**In scope:**

- **New persisted setting** —
  [src/lib/settings.js](../03-builds/imposter-game-app/src/lib/settings.js):
  add `showFellowImposters: false` to the `defaults` object. The existing `load()`
  merge gives older saved settings the default automatically; the store already
  auto-persists (no other change needed). Add a short comment like the other
  defaults.
- **`Toggle` gains a `disabled` prop** —
  [src/components/Toggle.svelte](../03-builds/imposter-game-app/src/components/Toggle.svelte):
  add `export let disabled = false;`, bind it to the checkbox's `disabled`, and
  visually soften the row when set (reduced opacity + `cursor: not-allowed`). The
  default `false` keeps every existing `<Toggle>` usage unchanged.
- **Settings row + count wiring** —
  [src/screens/SettingsScreen.svelte](../03-builds/imposter-game-app/src/screens/SettingsScreen.svelte)
  and
  [src/screens/SetupScreen.svelte](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte):
  `SettingsScreen` is rendered inside `SetupScreen`, which already holds the live
  imposter count as the local `impostors`. Pass it down —
  `<SettingsScreen onClose={…} impostorCount={impostors} />` — and in
  `SettingsScreen` add `export let impostorCount;` plus **one** `<Toggle>` row in
  `.rows`: `id="setting-fellow-imposters"`, `label="Reveal fellow imposters"`, the
  description above, `bind:value={$settings.showFellowImposters}`,
  `disabled={impostorCount < 2}`. When disabled, append a short note to the
  description (e.g. **"(Needs 2+ imposters.)"**).
- **Reveal list + rendering** —
  [src/screens/RevealScreen.svelte](../03-builds/imposter-game-app/src/screens/RevealScreen.svelte):
  add the `fellowImposters` derived above (`settings` is already imported). In the
  **Classic card** and **Envelope note** imposter branches, **after the hint**, add
  `{#if fellowImposters.length}` → a line *"Your fellow imposters:
  {fellowImposters.join(', ')}"* using the existing `card-sub` / `note-sub`
  styling. Pass `fellowImposters` to `<WheelReveal>`.
- **Wheel style** —
  [src/components/WheelReveal.svelte](../03-builds/imposter-game-app/src/components/WheelReveal.svelte):
  add `export let fellowImposters = [];`; in the imposter branch of the detail card
  (`result-impostor`), after the hint, render the same `{#if fellowImposters.length}`
  line using `result-sub` styling.
- **Grayscale-safe + mobile** — the new line uses **only existing colour tokens**
  (the imposter card's `--error` family) so Grayscale mode reintroduces no colour
  tell; tap targets ≥44px, no horizontal scroll at 375px.
- Code follows [technical-standards.md](../../references/technical-standards.md):
  plain and simple, no new dependencies, a brief comment on each new block.

**Out of scope (do NOT build here):**

- **Showing a count** of imposters (with or instead of names) — names only.
- **Showing imposters to crewmates**, or showing the secret word to imposters —
  crewmates and the imposter hint behave exactly as today.
- **Per-round control** — it's a single persisted global setting, like Grayscale.
- **Hiding** the toggle entirely in 1-imposter games — use **disable + note**
  (hiding is only a fallback if the `Toggle` change is ever rejected).
- **Game-state shape changes**, edits to `game-state.js` logic, `word-source.js`,
  the pass/results/discussion screens, routing, Capacitor, or the service worker.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/lib/settings.js` | Add `showFellowImposters: false` to `defaults`. |
| `src/components/Toggle.svelte` | Add optional `disabled` prop (binds checkbox `disabled`; greys the row). Default `false`. |
| `src/screens/SetupScreen.svelte` | Pass `impostorCount={impostors}` to `<SettingsScreen>`. |
| `src/screens/SettingsScreen.svelte` | Accept `impostorCount`; add the "Reveal fellow imposters" `<Toggle>` row, `disabled` when `< 2`, with the note. |
| `src/screens/RevealScreen.svelte` | Add `fellowImposters` derived; render the line in Classic + Envelope imposter branches; pass prop to `WheelReveal`. |
| `src/components/WheelReveal.svelte` | Add `fellowImposters` prop; render the line in the imposter detail card. |

## Constraints worth highlighting

- **Never list the current player** in their own fellow-imposter list — the
  `e.i !== revealIndex` filter is mandatory.
- **Single source of truth.** Build the list **once** in `RevealScreen` and gate it
  there; the three styles only check `fellowImposters.length`. Don't re-derive the
  imposter set per style, and reuse the `ResultsScreen` pattern.
- **Persisted** in `settings.js` (unlike the session-only Anti-Yusuf). Off by
  default.
- **Spelling is "imposter(s)"** in user-facing text (per the standards).
- **Grayscale-safe:** existing tokens only, no new colour values, no colour added
  to the line that could become a tell.
- **No new dependencies** — pure Svelte + CSS. Works on modern browsers; verify at
  375px, tap targets ≥44px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. **Toggle present & persists:** Settings shows a **"Reveal fellow imposters"**
   row, **off by default**; flip it ON and **reload** → still ON.
2. **2+ imposters, ON:** start a **3-imposter** game → each imposter's reveal lists
   the **other two** by name and **not** themselves; **crewmates** see no such line.
3. **2+ imposters, OFF:** imposters see only their hint, **no** fellow line
   (today's behaviour).
4. **Custom names:** rename players → the list shows typed names; a **blank** field
   shows **"Player N"**.
5. **All three reveal styles** (Classic / Secret Letter / Wheel of Fate) show the
   line in the same place with consistent styling.
6. **1-imposter game:** the toggle is **disabled with its note** in Settings, and a
   1-imposter reveal shows **no** fellow line even if the stored value is ON.
7. **Grayscale ON:** the new line stays readable and reintroduces **no** colour tell.
8. **Regression + build:** a full play-through still works with the toggle off;
   `npm run build` succeeds; no horizontal scroll at 375px; tap targets ≥44px.

## Next step

This brief feeds
[02-development/workflow/02-specs/show-fellow-imposters-spec.md](../02-specs/show-fellow-imposters-spec.md),
which converts it into an acceptance-criteria contract for the build.

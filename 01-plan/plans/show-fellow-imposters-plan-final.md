# Show Fellow Imposters Plan (Final)

## Why this plan exists

In a multi-imposter round, the imposters are supposed to be a team — they should
be able to glance at each other and quietly collude. But today the game only ever
tells an imposter *that they are an imposter*; it never tells them **who the other
imposters are**. So with 2+ imposters, the imposters can't coordinate any better
than the crewmates can — each one is flying blind about their own teammates.

This plan adds a **Settings toggle** that, while on, shows each imposter the
**names of their fellow imposters** during their role reveal. It only does
anything in a 2+ imposter game; with a single imposter there is no one to reveal.

**Intended outcome:** Rehaan can flip on the toggle, run a 2+ imposter round, and
each imposter's reveal screen lists the *other* imposters by name — so the
imposters know their team. Crewmates see nothing new. With the toggle off, the
game behaves exactly as it does today.

## The feature

1. **A toggle on the existing Settings screen**, labelled **"Reveal fellow
   imposters"** with a description like **"With 2+ imposters, each imposter also
   sees who the others are during the reveal."**. **Off by default.**
2. **While ON, in a 2+ imposter round:** each imposter's reveal — in **all three**
   reveal styles — shows, after the hint, a line naming the *other* imposters:

   > Your fellow imposters: **[Name]**, **[Name]**

   The current player is **never** listed among them. **Crewmates see nothing new.**
3. **While OFF:** reveals behave exactly as today — an imposter sees only their
   hint, never the other imposters.
4. **The setting persists.** Like Grayscale and Reveal animation, it is written to
   `localStorage` via the existing persisted `settings` store, so it stays set
   across sessions.
5. **One-imposter games:** the toggle has no possible effect (no fellow imposters
   exist), so it is **disabled with a short note** in Settings when the configured
   imposter count is 1.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Persistence | **Persisted** in the existing `settings` store (localStorage) | Rehaan's choice. A genuine gameplay preference should stick, like Grayscale / Reveal animation — unlike the session-only Anti-Yusuf gag. |
| Reveal content | **Names only** — "Your fellow imposters: Alice, Bob" | Rehaan's choice. Matches the stated mechanic; a count would be redundant since the names imply it. |
| Self exclusion | The revealing player is **never** in their own list | They already know they're an imposter; listing themselves is noise. |
| 1-imposter case | **Disable + note** the toggle when imposter count is 1 | Rehaan's choice (hide/disable). Disabling keeps the feature *discoverable* — the user sees it exists and why it's inactive — rather than silently vanishing. Needs a tiny reusable `disabled` prop on `Toggle`. |
| Where the gate lives | One derived list in `RevealScreen`, gated on toggle + isImpostor + 2+ imposters | Single source of truth; the three reveal styles just render the list if it's non-empty, so the rule can't drift between styles. |
| Blank names | **Fall back to "Player N"** via existing `displayName()` | Consistent with every other screen; no new name logic. |

## How it fits the architecture

No new routes and **no game-state shape changes**. The imposter identities are
already in `gameState.roles` (`roles[i].isImpostor`), and names resolve through the
existing `displayName()`. This is the *exact* data
[ResultsScreen](../../02-development/workflow/03-builds/imposter-game-app/src/screens/ResultsScreen.svelte)
already uses to list "the imposters were …" — this plan reuses that pattern at
reveal time, minus the current player.

```
settings store   { grayscale, revealStyle, showFellowImposters }  ←→ localStorage  (persisted)
   │
SetupScreen  (holds live `impostors` count as local state)
   └─ <SettingsScreen impostorCount={impostors} onClose=… />
         └─ <Toggle ... disabled={impostorCount < 2} bind:value={$settings.showFellowImposters}>
   │
RevealScreen  (orchestrates all three reveal styles)
   ├─ $: fellowImposters = (toggle ON && isImpostor && impostorCount >= 2)
   │        ? roles → indices where isImpostor && i !== revealIndex → displayName()
   │        : []
   ├─ Classic card    →  {#if fellowImposters.length} list line
   ├─ Envelope note   →  {#if fellowImposters.length} list line
   └─ <WheelReveal {fellowImposters} ... />  →  list line in the imposter detail card
```

### The derived list (single source of truth)

In [RevealScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte),
mirroring the
[ResultsScreen](../../02-development/workflow/03-builds/imposter-game-app/src/screens/ResultsScreen.svelte)
filter but excluding the current player and gated by the setting:

```js
$: fellowImposters =
  $settings.showFellowImposters && isImpostor && $gameState.impostorCount >= 2
    ? $gameState.roles
        .map((role, i) => ({ isImpostor: role.isImpostor, i }))
        .filter((e) => e.isImpostor && e.i !== $gameState.revealIndex)
        .map((e) => displayName($gameState.names, e.i))
    : [];
```

Because the gate lives here, the three styles only ever check
`fellowImposters.length` — a crewmate, a 1-imposter game, or the toggle being off
all yield an empty list and render nothing.

## Files this affects

| File | Change |
|---|---|
| [src/lib/settings.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/settings.js) | Add one default: `showFellowImposters: false` to the `defaults` object. The existing `load()` merge means users with older saved settings pick up the default automatically; the store already auto-persists. |
| [src/components/Toggle.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/components/Toggle.svelte) | Add an optional `disabled = false` prop: bind it to the checkbox's `disabled`, and grey/soften the row (reduced opacity, `cursor: not-allowed`) when set. Reusable for any future toggle. |
| [src/screens/SetupScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) | Pass the live count down: `<SettingsScreen onClose=… impostorCount={impostors} />`. (`impostors` is already local state here.) |
| [src/screens/SettingsScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/SettingsScreen.svelte) | Accept `export let impostorCount;`. Add one `<Toggle>` row in `.rows`: `id="setting-fellow-imposters"`, label "Reveal fellow imposters", the description above, `bind:value={$settings.showFellowImposters}`, `disabled={impostorCount < 2}`. When disabled, append a short note in the description (e.g. "(Needs 2+ imposters.)"). |
| [src/screens/RevealScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte) | Import `settings` (already imported). Add the `fellowImposters` derived above. In the **Classic** and **Envelope** imposter branches, after the hint, add `{#if fellowImposters.length}` → a line "Your fellow imposters: {fellowImposters.join(', ')}" using the existing `card-sub` / `note-sub` styling. Pass `fellowImposters` to `<WheelReveal>`. |
| [src/components/WheelReveal.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/components/WheelReveal.svelte) | Add `export let fellowImposters = [];`. In the imposter branch of the detail card (`result-impostor`), after the hint, add the same `{#if fellowImposters.length}` line using `result-sub` styling. |

**Reused, not rebuilt:** the imposter-list filter pattern from
[ResultsScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/ResultsScreen.svelte);
`displayName()`
([game-state.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/game-state.js));
the persisted `settings` store pattern; the
[Toggle.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/components/Toggle.svelte)
component; and all `app.css` colour tokens. `game-state.js` logic,
`word-source.js`, the pass/results/discussion screens, routing, Capacitor, and the
service worker are untouched.

## Conventions to honor

- **User-facing text spells it "imposter(s)"**; internal identifiers stay as-is
  (per [technical-standards.md](../../02-development/references/technical-standards.md)).
- The new line uses **only existing colour tokens** (the `--error` family on the
  imposter card) so **Grayscale mode** stays consistent and reintroduces no colour
  tell — same rule the three reveal styles already follow.
- Plain, simple, easy-to-extend code, a comment on each new block, no new
  dependencies; tap targets ≥44px, works at 375px.

## What's deferred (out of scope)

- **Showing a count** alongside or instead of names — rejected; names only.
- **Showing imposters to crewmates**, or showing the word to imposters — unchanged;
  crewmates and the imposter hint behave exactly as today.
- **Per-round (not global) control** of the feature — it's a single persisted
  global setting, like Grayscale.
- **Hiding** the toggle entirely in 1-imposter games — chosen approach is
  disable + note, for discoverability. (Hiding is a known lower-effort fallback if
  the `Toggle` change is ever deemed undesirable.)

## Acceptance (what "done" looks like)

From `02-development/workflow/03-builds/imposter-game-app/`, `npm run dev`:

1. **Toggle present & persists:** Settings shows a **"Reveal fellow imposters"**
   row, off by default; flip it ON and reload → still ON.
2. **2+ imposters, ON:** start a 3-imposter game; each imposter's reveal lists the
   **other two** by name and **not** themselves; crewmates see no such line.
3. **2+ imposters, OFF:** imposters see only their hint, no fellow line (today's
   behaviour).
4. **Custom names:** rename players → the list shows typed names; a blank field
   shows "Player N".
5. **All three reveal styles** (Classic / Secret Letter / Wheel of Fate) show the
   line in the same place with consistent styling.
6. **1-imposter game:** the toggle is **disabled with its note** in Settings, and a
   1-imposter reveal shows **no** fellow line even if the stored value is ON.
7. **Grayscale ON:** the new line stays readable and reintroduces no colour tell.
8. **Regression / build:** a full play-through still works with the toggle off;
   `npm run build` succeeds; no horizontal scroll at 375px.

Verification is **manual** — the build **writes this checklist; Rehaan runs
`npm run dev`** to walk it (per the agreed split in technical-standards.md).

## Risks / open questions

- **`Toggle` gains a `disabled` prop** — a shared component change, but small and
  additive (default `false`, so every existing use is unaffected). If undesired,
  fall back to hiding the row with `{#if impostorCount >= 2}`.
- **Line placement consistency** across three styles is the main correctness risk;
  the single derived list mitigates the *logic* drift, but each style's markup
  still needs the line added in the right spot with matching styling.

## Status

`final` — approved by Rehaan (2026-06-18) via plan review (clarifying questions +
plan approval). Locked decisions: persisted setting, names-only content, disable +
note for the 1-imposter case. Next phase: route to
`02-development/workflow/01-brief/show-fellow-imposters-brief.md` → spec → build.
This planning session ends at this document; no app code is changed yet.

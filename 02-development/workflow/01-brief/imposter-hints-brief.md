# Brief — Imposter Hints toggle

## Source plan

[01-plan/plans/imposter-hints-plan-final.md](../../../01-plan/plans/imposter-hints-plan-final.md)

## What to build

A new **"Imposter hints"** toggle on the existing **Settings** screen: a **boolean
switch** (like the existing **Grayscale** / **Reveal fellow imposters** rows), **on by
default**. While on, the imposter keeps seeing a vague hint instead of the secret word —
today's behaviour. Turn it **off** to withhold that hint, so the imposter learns only
*that* they are the imposter, with no clue about the word — a harder round for them.

Today the imposter is **always** given a hint. After this build:

- **Settings** has an **"Imposter hints"** row — a `Toggle` (description: **"When on, the
  imposter is shown a vague hint instead of the word. Turn off to make rounds harder for
  the imposter."**), defaulting to **on**.
- **When ON (default):** the imposter reveal is exactly as today, in all three reveal
  styles — `🎭 YOU ARE THE IMPOSTER!`, the `Your hint: "…"` line, and the "use your hint to
  blend in" sub-line. No behaviour change for existing users.
- **When OFF:** the imposter reveal shows **only the title** (`🎭 YOU ARE THE IMPOSTER!`) —
  **no** hint line, **no** "use your hint" sub-line, **no** error line. The crewmate view
  is unchanged (still shows the word).
- **Suppress everywhere:** OFF also hides hints on a **Troll Mode** round (where every
  player is an imposter) — "off means off, always."
- **The choice persists** across rounds like Grayscale / Reveal animation (the persisted
  `settings` store, `localStorage`).

## Why this is being built now

1. **It's a cheap difficulty dial** for a party game whose balance shifts with table size
   and word list — sometimes the hint makes the imposter too easy to hide.
2. **The seam already exists.** `RevealScreen` derives the imposter hint **once** for all
   three reveal styles and each style already conditionally renders it. Gating that single
   derivation on a new boolean covers Classic, Secret Letter, and Wheel at once.
3. **It mirrors an established pattern.** Boolean settings (`grayscale`,
   `showFellowImposters`) already use a `Toggle` backed by the auto-persisting `settings`
   store — no new UI primitives, no new dependencies.

## How it works (the core idea)

**Suppress at reveal time, not build time.** Hints continue to be *built* exactly as today
(the shared `gameState.hint` in normal rounds; per-player `buildTrollHints` in Troll
rounds). A single derived flag in `RevealScreen` decides whether the imposter hint UI is
*rendered*. This keeps the change tiny, makes "suppress everywhere" (Troll rounds included)
fall out for free, and touches **none** of the setup / roll / role-assignment logic.

A toggle OFF is distinct from a *missing* hint: with the toggle ON, a word that happens to
have no hint still shows "An error occurred." (unchanged); with the toggle OFF, nothing is
shown where the hint would be.

## Scope

**In scope:**

- **New persisted setting** — [src/lib/settings.js](../03-builds/imposter-game-app/src/lib/settings.js):
  add `enableImpostorHint: true` to `defaults` (existing `load()` merge gives older saves
  the default; the store already auto-persists). Add a short comment like the others.
- **Settings row** — [src/screens/SettingsScreen.svelte](../03-builds/imposter-game-app/src/screens/SettingsScreen.svelte):
  one `<Toggle>` row (mirroring the "Reveal fellow imposters" row) — `id="setting-imposter-hints"`,
  `label="Imposter hints"`, the description above, `bind:value={$settings.enableImpostorHint}`.
- **Reveal gating** — [src/screens/RevealScreen.svelte](../03-builds/imposter-game-app/src/screens/RevealScreen.svelte):
  add a derived `showHint = $settings.enableImpostorHint`. In **both** the envelope branch
  and the original tap-to-flip card, gate the `{#if hint}…{:else}An error occurred.{/if}`
  block **and** the trailing "use your hint to blend in" sub-line on `{#if showHint}`. Pass
  `{showHint}` to `<WheelReveal>`. The `fellowImposters` line stays independent (unaffected).
- **Wheel gating** — [src/components/WheelReveal.svelte](../03-builds/imposter-game-app/src/components/WheelReveal.svelte):
  add `export let showHint = true;` and gate its detail-card hint block and "use your hint"
  sub-line on `showHint`, identical to the other two styles.
- Code follows [technical-standards.md](../../references/technical-standards.md): plain JS,
  no new dependencies, a brief comment on each new block, spelling **"imposter(s)"** in
  user-facing text.

**Out of scope (do NOT build here):**

- **Changing the crewmate view** — crewmates always see the word; unchanged.
- **Changing hint *generation* / word lists** — `word-source.js`, `buildTrollHints`, the
  shared `gameState.hint` are untouched; only *display* is gated.
- **Touching the roll / setup / role-assignment** — `SetupScreen.svelte`,
  `game-state.js`, `troll-mode.js`, `troll-state.js` are unchanged.
- **A per-round override UI** — this is a single persisted app-wide toggle, like Grayscale.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/lib/settings.js` | Add `enableImpostorHint: true` to `defaults`. |
| `src/screens/SettingsScreen.svelte` | Add the "Imposter hints" `<Toggle>` row. |
| `src/screens/RevealScreen.svelte` | Add `showHint` derived flag; gate hint UI in the envelope + tap-flip cards; pass `{showHint}` to the wheel. |
| `src/components/WheelReveal.svelte` | Add `showHint` prop; gate its hint UI. |

## Constraints worth highlighting

- **Default ON** — existing behaviour is preserved for everyone; the merge in `load()`
  back-fills the default for users who saved settings before this key existed.
- **Suppress everywhere** — OFF hides the hint on Troll rounds too (gating is at reveal
  time, so this needs no special-casing).
- **OFF ≠ missing hint** — OFF shows nothing; a genuinely missing hint with the toggle ON
  still shows the existing "An error occurred." fallback.
- **Single source of truth** — gate on the one derived `showHint` in `RevealScreen`
  (passed to the wheel as a prop); don't read `$settings` separately per style.
- **No new dependencies** — pure Svelte + JS. Verify at 375px, tap targets ≥44px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. **Setting present & persists:** Settings shows an **"Imposter hints"** toggle, **on** by
   default; flip it off and **reload** → still off.
2. **ON (default):** run a round → the imposter sees `Your hint: "…"` and the "use your
   hint" line, in **all three** reveal styles (Classic / Secret Letter / Wheel of Fate).
3. **OFF:** run a round → the imposter sees **only** `🎭 YOU ARE THE IMPOSTER!` — no hint
   line, no error, no "use your hint" line — across all three styles. Crewmate still sees
   the word.
4. **OFF + Reveal fellow imposters ON** (2+ imposters): the fellow-imposters line still
   shows; the hint line stays hidden.
5. **OFF + Troll Mode** round: every player sees the title only, no hints.
6. **Regression + build:** a normal play-through with the toggle ON is unchanged;
   `npm run build` succeeds; no horizontal scroll at 375px; tap targets ≥44px.

## Next step

This brief feeds
[02-development/workflow/02-specs/imposter-hints-spec.md](../02-specs/imposter-hints-spec.md),
which converts it into an acceptance-criteria contract for the build.

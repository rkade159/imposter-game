# Plan (final) — Imposter Hints toggle

## Problem / motivation

The imposter is **always** handed a vague hint instead of the secret word, to give them a
chance to blend in. Depending on table size and word list, that hint can make the imposter
too easy to hide — the game wants a way to dial up the difficulty by withholding it.

## The feature

A new **"Imposter hints"** boolean toggle on the **Settings** screen:

- **On by default** — current behaviour (imposter gets a hint).
- **Off** — the imposter sees only `🎭 YOU ARE THE IMPOSTER!`, no hint, no "use your hint"
  line, no error line. Crewmates are unaffected (still see the word).
- **Persists** across rounds, like Grayscale / Reveal animation (the `settings` store +
  localStorage).
- **Suppress everywhere** — Off also hides hints on Troll Mode rounds.

## Approach: suppress at reveal time, not build time

Hints keep being *built* exactly as today (shared `gameState.hint` normally; per-player
`buildTrollHints` in Troll rounds). A single derived flag in `RevealScreen`
(`showHint = $settings.enableImpostorHint`) gates whether the imposter hint UI is
*rendered*, and is passed to `WheelReveal` as a prop. This keeps the change small, makes
"suppress everywhere" (Troll rounds included) automatic, and touches no setup / roll /
role-assignment logic.

An Off toggle is distinct from a *missing* hint: with the toggle on, a blank hint still
shows the existing "An error occurred." fallback; with it off, nothing is shown.

## Files changed

App root: `02-development/workflow/03-builds/imposter-game-app/`

| File | Change |
|---|---|
| `src/lib/settings.js` | Add `enableImpostorHint: true` to `defaults`. |
| `src/screens/SettingsScreen.svelte` | Add the "Imposter hints" `<Toggle>` row. |
| `src/screens/RevealScreen.svelte` | Add `showHint` derived flag; gate hint UI in the envelope + tap-flip cards; pass `{showHint}` to the wheel. |
| `src/components/WheelReveal.svelte` | Add `showHint` prop; gate its hint UI. |

Docs: `01-brief/imposter-hints-brief.md`, `02-specs/imposter-hints-spec.md`, this plan.

## Verification (Rehaan runs `npm run dev`)

1. Settings shows **"Imposter hints"**, on by default; flip off + reload → still off.
2. On → imposter sees `Your hint: "…"` + the "use your hint" line in all three reveal
   styles. Crewmate sees the word.
3. Off → imposter sees only `🎭 YOU ARE THE IMPOSTER!` in all three styles.
4. Off + Reveal fellow imposters on (2+ imposters) → fellow-imposters line shows, hint
   stays hidden.
5. Off + a Troll Mode round → every player sees the title only.
6. `npm run build` succeeds; no horizontal scroll at 375px.

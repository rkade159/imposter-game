# Spec — Imposter Hints toggle

## Source brief

[02-development/workflow/01-brief/imposter-hints-brief.md](../01-brief/imposter-hints-brief.md)
(source plan:
[01-plan/plans/imposter-hints-plan-final.md](../../../01-plan/plans/imposter-hints-plan-final.md))

> Imposter Hints appears in **no** reference screenshot; it is defined by this spec and its
> brief alone. The build was implemented alongside this spec; this document is the
> acceptance contract the build must satisfy.

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a
**contract, not a blueprint**. It states WHAT must be true — observable behaviour and the
surfaces other code depends on — not exact DOM, class names, or CSS, which are the
builder's call within the constraints below.

Four things *are* mandated because they are the explicit goals of the feature:
(a) a **persisted** Settings toggle labelled **"Imposter hints"**, **on by default**
(criteria 1–4); (b) with it **OFF**, the imposter reveal shows the title **only** — no hint
line, no error line, no "use your hint" sub-line — in **all three** reveal styles
(criteria 6–8); (c) **OFF suppresses hints everywhere, including Troll Mode rounds**
(criterion 9); (d) with it **ON**, behaviour is **byte-for-byte unchanged** from today
(criterion 5). Everything else — description wording, row placement, markup — is the
builder's call.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

| File | State after build |
|---|---|
| `src/lib/settings.js` | An `enableImpostorHint: true` key is added to the existing **persisted** `settings` store's `defaults`. No other change; the existing `load()` merge + auto-persist cover migration and saving. |
| `src/screens/SettingsScreen.svelte` | Adds one `<Toggle>` row bound to `$settings.enableImpostorHint`, label **"Imposter hints"**, with a description conveying that ON shows the imposter a hint and OFF makes rounds harder. Existing rows unchanged. |
| `src/screens/RevealScreen.svelte` | Adds a derived `showHint = $settings.enableImpostorHint`. In the envelope branch and the original tap-to-flip imposter card, the hint block (`{#if hint}…{:else}error{/if}`) and the trailing "use your hint" sub-line render only when `showHint`. `{showHint}` is passed to `<WheelReveal>`. The `fellowImposters` derivation/line is **unchanged**. |
| `src/components/WheelReveal.svelte` | Gains `export let showHint = true;`. Its imposter detail-card hint block and "use your hint" sub-line render only when `showHint`. No other change. |

Files that must **NOT** be modified by this build: `src/lib/game-state.js`,
`src/lib/troll-mode.js`, `src/lib/troll-state.js`, `src/lib/word-source.js`,
`src/lib/reveal-styles.js`, `src/lib/session-settings.js`, `src/screens/SetupScreen.svelte`,
`src/components/Toggle.svelte`, `src/components/Select.svelte`,
`src/screens/PassScreen.svelte`, `src/screens/DiscussionScreen.svelte`,
`src/screens/ResultsScreen.svelte`, `src/App.svelte`, `src/app.css`, `public/data/*`,
`src/service-worker.js`, `src/main.js`, `vite.config.js`, `package.json`, `index.html`.

## Acceptance criteria

A build is "done" when **every** item below is true.

### Persisted setting (`settings.js`)

1. The `settings` store's `defaults` include **`enableImpostorHint: true`**.
2. The value is **persisted** in the existing `localStorage`-backed `settings` store; a
   user with settings saved before this key existed loads with `enableImpostorHint`
   defaulted to `true`. **No new store** is introduced.
3. It is **on by default** (follows from 1).
4. Flipping it OFF and reloading the app leaves it **OFF** (persistence round-trip).

### Settings screen (`SettingsScreen.svelte`)

5. A new toggle row exists with label **exactly** `Imposter hints`, rendered via the
   existing `Toggle` component as a peer of the other rows, two-way bound to
   `$settings.enableImpostorHint`. Existing rows (Grayscale, Reveal animation, Reveal
   fellow imposters, Anti-Yusuf, Troll Mode) are **unchanged**.

### Reveal behaviour — ON (`RevealScreen.svelte` + `WheelReveal.svelte`)

6. With `enableImpostorHint === true`, the imposter reveal is **byte-for-byte the current
   behaviour** in **all three** styles (**Classic**, **Secret Letter / envelope**, **Wheel
   of Fate**): the `🎭 YOU ARE THE IMPOSTER!` title, the `Your hint: "…"` line (or the
   existing `An error occurred.` fallback when the hint is genuinely missing), and the "you
   don't know the word — use your hint to blend in" sub-line. The crewmate view is
   unchanged.

### Reveal behaviour — OFF

7. With `enableImpostorHint === false`, the imposter reveal shows **only** the
   `🎭 YOU ARE THE IMPOSTER!` title — **no** `Your hint` line, **no** `An error occurred.`
   line, and **no** "use your hint to blend in" sub-line — in **all three** reveal styles.
8. The crewmate view is **unaffected** by the toggle in every state (always shows the word).

### Suppress everywhere

9. With the toggle **OFF**, hints are also suppressed on a **Troll Mode** round (every
   player is an imposter): each player sees the title only, no hint. This must follow from
   reveal-time gating, **without** modifying the Troll Mode build/roll logic.

### Independence from other features

10. The **"Reveal fellow imposters"** line is **independent** of this toggle: with hints
    OFF, fellow-imposters ON, and 2+ imposters, the fellow-imposters line still appears
    while the hint line stays hidden.

### Code quality

11. **Single source of truth:** the gate is the one derived `showHint` in `RevealScreen`
    (passed to `WheelReveal` as a prop). The imposter card is **not** re-branched per style
    by reading `$settings` independently in each. **Brief explanatory comments** sit on the
    new block per technical-standards (the *why*: OFF withholds the hint to harden the round
    and, being reveal-time, covers Troll rounds too).
12. **No new dependencies.** `package.json` is unchanged. **Untouched files stay untouched**
    — every file in the "must NOT be modified" list.
13. **Look & feel:** no new colour or layout; Grayscale introduces no new tell. Tap targets
    remain **≥44px**; **no horizontal scroll** at a 375px-wide viewport. **No console errors
    or warnings** in dev or built preview.
14. **Production build succeeds.** `npm run build` completes with no errors and no new
    warnings.

## What is NOT acceptance criteria (deferred / explicitly excluded)

- **Changing the crewmate view, hint generation, word lists, or roll/setup logic** — only
  imposter-hint *display* is gated.
- **A per-round override UI** — this is a single persisted app-wide toggle.
- **Re-styling the no-hint card** beyond simply omitting the hint UI — a themed "no hint"
  treatment is a later `03-design` concern.

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder
**writes** this checklist but does **NOT** run `npm run dev` to walk it — **Rehaan runs the
app** and verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console
   errors.
2. **Settings → Imposter hints** toggle present, **on** by default.
3. **Persists:** turn it off, **reload** → still off.
4. **ON:** run a round → imposter sees `Your hint: "…"` + the "use your hint" line, across
   **all three** reveal styles (Classic / Secret Letter / Wheel of Fate). Crewmate sees the
   word.
5. **OFF:** run a round → imposter sees **only** `🎭 YOU ARE THE IMPOSTER!` (no hint, no
   error, no "use your hint" line), across all three styles. Crewmate still sees the word.
6. **OFF + Reveal fellow imposters ON** (set imposters to 2+): fellow-imposters line shows;
   hint line stays hidden.
7. **OFF + a Troll Mode round** (e.g. set Troll Mode to Guaranteed): every player sees the
   title only, no hints.
8. Re-check at 375px (no horizontal scroll). Stop the dev server. Run `npm run build`:
   succeeds with no new errors/warnings.

If any one of criteria 1–14 fails, the build is not done.

## Next step

This spec is the contract for the build at
`02-development/workflow/03-builds/imposter-game-app/`. The implementation is in place
alongside this document; this records the acceptance criteria it must continue to satisfy.

# Spec — "Spotlight" imposter reveal animation

## Source brief

[02-development/workflow/01-brief/spotlight-reveal-brief.md](../01-brief/spotlight-reveal-brief.md)
(approved plan:
[01-plan/plans/spotlight-reveal-plan-final.md](../../../01-plan/plans/spotlight-reveal-plan-final.md))

> "Spotlight" appears in **no** reference screenshot; it is defined by this spec and its brief
> alone. This document is the acceptance contract the build must satisfy.

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a
**contract, not a blueprint**. It states WHAT must be true — observable behaviour and the
surfaces other code depends on — not the exact DOM, class names, CSS, easing curves, beam
radius, pause timings, scatter coordinates, or prompt copy, which are the builder's call within
the constraints below.

The mandated essentials, because they are the explicit goals of the feature:
(a) a **new, separate "Imposter reveal" setting** with values `static` (default) and
`spotlight`, persisted alongside the other settings (criteria 1–3);
(b) with **Static**, the results screen is **unchanged** from today (criterion 4);
(c) with **Spotlight**, a dark stage shows **all** players' names at once, role-coloured
(white/red, jester pink), a spotlight **roams a path that never stops on red early and always
ends on a real imposter**, then on **2+ imposters all reds flare together**, then the
**existing results text** appears (criteria 5–12);
(d) **skip / keyboard / reduced-motion** all reach the results text (criteria 13–15);
(e) **Grayscale**, **mobile/quality**, and **driven-by-props** parity (criteria 16–19);
(f) the per-player reveals, the results text/flow, and all game logic are **unchanged**
(criteria 20–22).
Everything else — stage look, beam size/softness, scatter layout, decoy count, pause/hold
timings, skip-control wording — is the builder's call.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

| File | State after build |
|---|---|
| `src/lib/results-reveal-styles.js` | **New.** Exports `RESULTS_REVEALS` — a list of `{ id, label }` containing at least `{ id: 'static', … }` and `{ id: 'spotlight', … }` — and `DEFAULT_RESULTS_REVEAL = 'static'`. Mirrors `reveal-styles.js`. |
| `src/lib/settings.js` | Imports `DEFAULT_RESULTS_REVEAL`; adds **one** default `resultsRevealStyle: DEFAULT_RESULTS_REVEAL`. No other change. `load()`'s existing merge back-fills the new key for users with saved settings. |
| `src/screens/SettingsScreen.svelte` | Adds **one** `<Select>` labelled **"Imposter reveal"**, `options={RESULTS_REVEALS}` (imported from the new file), bound to `$settings.resultsRevealStyle`, with a short description. No other change. |
| `src/components/SpotlightReveal.svelte` | **New.** Self-contained animation accepting **only** `players` (`[{ name, isImpostor, isJester }]`) and `onDone`. Renders the dark stage, the role-coloured names, the roaming spotlight overlay, the climax + all-reds flare, and a skip affordance; calls `onDone` when finished or skipped. Reads nothing from `gameState`. |
| `src/screens/ResultsScreen.svelte` | Imports `settings` + `SpotlightReveal`; builds a `players` array from the **existing** `roles`/`displayName` mapping; adds a `revealed` flag. When `$settings.resultsRevealStyle === 'spotlight'` **and** `!revealed`, renders `SpotlightReveal` with `onDone={() => (revealed = true)}`; otherwise renders the **existing** results markup unchanged. |

Files that must **NOT** be modified by this build: `src/lib/game-state.js`,
`src/lib/reveal-styles.js`, `src/lib/roles-config.js`, `src/lib/session-settings.js`,
`src/lib/troll-mode.js`, `src/lib/troll-state.js`, `src/lib/shuffle.js`,
`src/lib/word-source.js`, `src/lib/config.js`, `src/screens/SetupScreen.svelte`,
`src/screens/RolesScreen.svelte`, `src/screens/RevealScreen.svelte`,
`src/screens/PassScreen.svelte`, `src/screens/DiscussionScreen.svelte`,
`src/components/WheelReveal.svelte`, `src/components/CardGridReveal.svelte`,
`src/components/PeekReveal.svelte`, `src/components/Toggle.svelte`,
`src/components/Select.svelte`, `src/components/Stepper.svelte`, `src/components/Modal.svelte`,
`src/app.css` (no new tokens needed), `src/App.svelte`, `public/data/*`,
`src/service-worker.js`, `src/main.js`, `vite.config.js`, `package.json`, `index.html`.

## Acceptance criteria

A build is "done" when **every** item below is true.

### Setting registration + selection (`results-reveal-styles.js` + Settings + persistence)

1. `results-reveal-styles.js` exports `RESULTS_REVEALS` containing at least an `id: 'static'`
   and an `id: 'spotlight'` entry (each with a readable, user-facing `label`) and
   `DEFAULT_RESULTS_REVEAL === 'static'`.
2. `settings.js` adds exactly one new default, `resultsRevealStyle: DEFAULT_RESULTS_REVEAL`, and
   imports that constant. No other setting changes. Existing per-player `revealStyle` is
   untouched.
3. Settings shows a new **"Imposter reveal"** `<Select>` rendered from `RESULTS_REVEALS`,
   defaulting to **Static**, and the selection **persists across a reload** (it rides the
   existing `settings` persistence). An unknown/legacy stored value falls back to **Static**.

### Static path (no behaviour change)

4. With `resultsRevealStyle === 'static'` (the default), reaching the results screen renders the
   **existing** results content immediately — the imposter line, jester line (when applicable),
   word, hint, and **Play again** — with **no** animation and no behavioural difference from
   today.

### Spotlight presentation (`SpotlightReveal.svelte` via `ResultsScreen.svelte`)

5. With `resultsRevealStyle === 'spotlight'`, reaching the results screen first renders the
   **Spotlight** lead-in instead of the static text; the static results content appears **after**
   the lead-in finishes (or is skipped).
6. The lead-in presents a **dark stage** with **every** player's name placed around it **at
   once** (scattered/ring layout), each name coloured by role using existing tokens:
   **crewmate → `--text` (white-ish)**, **imposter → `--error` (red)**, **jester → `--jester`
   (pink)**. Names use the `displayName` value (custom name or "Player N" fallback) passed in
   via `players`.
7. A **spotlight** (a bright circular region over an otherwise-darkened stage) **roams** the
   stage, illuminating names as it passes. Its motion reads as a search (it moves between
   positions, not a single static reveal).

### The rigged path (`SpotlightReveal.svelte`)

8. The roam **never comes to rest on an imposter (red) name before the climax** — any stops
   along the way are on **crewmate** names. (On a round with no crewmates — Troll Mode — there
   are no decoy stops; a short sweep is acceptable, see criterion 11.)
9. The roam **always ends with the spotlight stopped on a real imposter** (a player with
   `isImpostor === true` in `players`). The chosen imposter and the path are derived from the
   `players` data, so this holds regardless of colour rendering (i.e. also under Grayscale).
10. **Climax → results:** after the spotlight stops on the imposter and holds briefly, the stage
    lights up and the lead-in ends by calling `onDone`, after which `ResultsScreen` shows the
    static results text.
11. **Multiple imposters:** after the spotlight stops on **one** imposter, **all** imposter names
    light up / flare in red **together** (a single simultaneous reveal of the rest) before
    `onDone`. On a **Troll** round (all imposters) this is the whole stage flaring red after a
    brief sweep.

### Skip, keyboard, reduced motion

12. The component calls `onDone` **exactly once** to hand control back to `ResultsScreen` — at
    the natural end of the climax, or early via skip/keyboard (below). It never advances the game
    state itself or reads `gameState`.
13. A visible **skip** affordance lets the player jump straight to the end (stage lit / results
    text) without watching the full roam; activating it calls `onDone`.
14. **Keyboard parity:** pressing **Enter or Space** skips to the end and calls `onDone` (Space
    must not scroll the page). The skip control is focusable with a visible `:focus-visible`
    outline.
15. **Reduced motion** (`prefers-reduced-motion: reduce`): the roaming beam is **not** animated —
    the stage is shown lit (all names visible, imposters in red) and `onDone` is reached without
    animated beam travel (a brief static beat is acceptable). The result is still correct.

### Grayscale, mobile/quality, isolation

16. **Grayscale parity:** the component uses the existing colour tokens
    (`--error` / `--text` / `--jester`) **only** — no new tokens, no `app.css` change. With
    Grayscale on, the names are not distinguishable by colour, **but the spotlight still stops on
    the correct imposter** (the path is data-driven, criterion 9).
17. **Layout quality:** with realistic counts (e.g. 4–12 players) the names **do not overlap** and
    remain readable (**≥ 16px**); the stage fits within the results `.screen` area with **no
    horizontal scroll** at a 375px-wide viewport.
18. **Pointer/quality hardening:** any press/skip target is **≥ 44px**; interactive targets use
    `touch-action`/`user-select` guards as needed and don't pop the long-press menu; the rAF loop
    and any timers are **cancelled on destroy** (`onDestroy`) so leaving the screen mid-roam
    leaves nothing running.
19. **Driven by props:** the component's only inputs are `players` and `onDone`. It does **not**
    import or read `gameState`, re-derive roles, or reach into other stores. `ResultsScreen`
    builds `players` from its **existing** `roles`/`displayName` mapping.

### The rest of the app is unchanged

20. The **Original / Envelope / Wheel / Choose a Card / Peek** per-player reveal styles and
    `RevealScreen` are **unchanged**; `revealStyle` and `reveal-styles.js` are not touched.
21. **No game-logic change:** role assignment, word/hint generation, fellow-imposter gating,
    Troll Mode, and the jester role are untouched; `game-state.js` is **not** modified. The
    existing results text, jester line, word, hint, and `playAgain()` flow are **unchanged** —
    Spotlight only gates **when** that text appears.
22. **Single source of truth + standards:** the results-reveal id/label lives **only** in
    `results-reveal-styles.js`; the component is wired in **one** place (`ResultsScreen`). Each
    new block carries a **brief explanatory comment** per technical-standards; user-facing text
    spells **"imposter(s)"**.

### Build

23. **No new dependencies** (`package.json` unchanged) and **no console errors/warnings** in dev
    or the built preview. **`npm run build` succeeds** with no new errors/warnings.

## What is NOT acceptance criteria (deferred / explicitly excluded)

- **An interactive "drag the spotlight" mode** — the beam roams automatically; the only
  interaction is skip.
- **Per-player Spotlight on the reveal screen** — this is a results-screen lead-in only; the
  five role-reveal styles are untouched.
- **Changing the results text, jester line, hint, or "Play again"** — only the *timing* of when
  that text appears changes when Spotlight is on.
- **Themed stage art / illustrations / sound** — a later `03-design` concern; this build uses the
  existing token palette only.
- **Any change to the per-player reveals, role assignment, `game-state.js`, `word-source.js`,
  the pass/discussion screens, routing, Capacitor, or the service worker.**

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder **writes**
this checklist but does **NOT** run `npm run dev` to walk it — **Rehaan runs the app** and
verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console errors.
2. **Setting present & persists:** Settings → **Imposter reveal** lists **Static** (default) and
   **Spotlight**; select Spotlight and **reload** → still selected.
3. **Static unchanged:** with **Static**, finish a round → today's results screen exactly, no
   animation.
4. **Spotlight, 1 imposter (named players):** finish a round → dark stage, names scattered, the
   beam roams over **white** names, **never** stops on a red name early, **stops on the
   imposter**, then the results text appears.
5. **Spotlight, 2–3 imposters:** the beam stops on **one** imposter, then **all** imposter names
   **flare red together**, then the results text.
6. **Jester round:** the jester name reads **pink** in the light-up; the results text still names
   the jester.
7. **Troll round:** a quick sweep, then **all** names flare red, then the results text lists
   everyone.
8. **"Player N" fallback:** with no custom names, positional names scatter and read correctly.
9. **Grayscale:** with Grayscale on, the beam still **stops on the correct player** (colours
   neutral).
10. **Skip / Enter / reduced motion:** tapping **Skip**, pressing **Enter/Space**, or enabling
    reduced motion reaches the lit stage + results text without the full roam.
11. **Many players (10+):** names don't overlap, stay ≥16px; no horizontal scroll at 375px; tap
    targets ≥ 44px.
12. **Regression:** the five per-player reveal styles and the rest of the app are unchanged.
13. Stop the dev server. Run `npm run build`: succeeds with no new errors/warnings.

If any one of criteria 1–23 fails, the build is not done.

## Open questions for the builder

- **Stage look & beam feel.** Stage background, beam radius/softness, glow, and how sharply the
  beam tightens at the climax are the builder's call, provided names are hidden in the dark and
  clearly lit under the beam (criteria 6–7).
- **Scatter layout.** Jittered ring vs jittered grid, and the large-count fallback (second ring,
  smaller text within the ≥16px floor) are the builder's call, provided no overlap and no
  horizontal scroll at 375px (criterion 17).
- **Decoy count & timing.** How many crewmate decoy stops, pause durations, total roam length,
  and the climax hold are tunable by feel, provided the beam never rests on red early and always
  ends on an imposter (criteria 8–9).
- **Skip-control placement/wording.** The skip affordance's look and copy are the builder's call,
  provided it's visible, ≥44px, keyboard-reachable, and calls `onDone` (criteria 13–14).
- **All-reds flare style.** Whether the rest of the imposters fade in, pulse, or pop is the
  builder's call, provided they reveal **together** after the single catch (criterion 11).

## Next step

This spec is the contract for the build at
`02-development/workflow/03-builds/imposter-game-app/` — a new
`src/lib/results-reveal-styles.js` and `src/components/SpotlightReveal.svelte`, plus the
`settings.js`, `SettingsScreen.svelte`, and `ResultsScreen.svelte` wiring edits.

# Brief — "Spotlight" imposter reveal animation

## Source plan

[01-plan/plans/spotlight-reveal-plan-final.md](../../../01-plan/plans/spotlight-reveal-plan-final.md)
(approved plan; this feature has no reference screenshot — it is defined by this brief and its
spec.)

## What to build

A **new, optional animation for the end-of-round reveal** — the moment the table learns **who
the imposters were**. This is **NOT** a role-reveal style. The five existing reveal styles
(Original / Envelope / Wheel / Choose a Card / Peek) play **per player** on `RevealScreen`
during pass-and-play. **Spotlight** plays **once, for the whole group**, on the **results
screen**, after discussion.

Today that moment is `ResultsScreen.svelte` — **static text**: "The imposter(s) were …", "The
word was …", the jester line, the hint, and **Play again**. Spotlight is an **animated lead-in**
that plays *before* that text (when enabled), then settles into the **unchanged** results text.

The animation:

- The results stage goes **black**. **Every player's name** is placed around the stage at once
  (scattered), coloured by role: **white = crewmate, red = imposter** (pink for the jester).
  Colour is the only tell.
- A **spotlight** roams the stage on a **random-looking but pre-decided path**, lighting up a
  few **crewmate** names to build tension and **deliberately avoiding the red names** until the
  climax.
- The beam then **stops on one imposter** and holds. With **2+ imposters**, **all imposter
  names then flare red at once**. The whole stage lights up, and the screen **settles into the
  existing results text**.

## Why this is being built now

1. **It reuses the proven "reveal-style" seam.** The reveal-style selector is a single source
   of truth (`reveal-styles.js`) read by both the Settings `<Select>` and the screen that
   branches on it. Spotlight copies that exact pattern with a **new, parallel** list for the
   *results* reveal (`results-reveal-styles.js`) + one new persisted setting — so the dropdown
   and the branch wire up the same way the role-reveal styles do, without entangling the two.
2. **The data is already in state.** `gameState.roles[]` (with `isImpostor` / `isJester`) and
   `displayName(names, i)` already give us each player's name and role — the same source
   `ResultsScreen` uses today. The new component is **driven entirely** by a `players` array the
   results screen builds from those; no `game-state.js` change.
3. **The results text is the closure, and stays.** Spotlight is purely a lead-in; the existing
   `ResultsScreen` markup (imposter line, jester line, word, hint, Play again) is **unchanged**
   and shown after the animation finishes (or immediately, when the setting is **Static**).

## How the animation works (the core mechanic)

**One stage, two layers.** All names render at full colour in a dark stage; a **dark overlay**
sits on top with a single **transparent circular hole** — the spotlight. The overlay both
darkens everything and *is* the beam, so names show their true colour **only where the hole
passes over them**. No per-name opacity bookkeeping.

```
overlay: radial-gradient(circle var(--r) at var(--x) var(--y),
         transparent 0%, transparent 55%, rgba(0,0,0,0.97) 100%)
```

Moving the beam = updating `--x` / `--y` (and `--r` to tighten at the climax), driven by a
`requestAnimationFrame` loop (same approach as `WheelReveal`).

**Random but predetermined path.** Before the roam starts, build a **waypoint list**: several
**crewmate** name positions as decoy stops, then the chosen **imposter** position as the
**final** stop. The beam eases between waypoints with slight jitter, pausing briefly at each.
Because the path is built from the known roles, the beam **never lands on a red name early** and
**always ends on a real imposter**.

**Climax.** At the final waypoint the beam halts and tightens/brightens (~800ms). Then the
overlay fades toward transparent so the **whole stage lights up**; every imposter name flares
red together (the jester reads pink). `onDone()` then fires and the results text appears.

The player's role tag is read straight from the props the results screen passes
(`isImpostor` / `isJester`) — the component does **not** read `gameState` or re-derive roles.

## Scope

**In scope:**

- **Register the results-reveal style** — **new** file
  `src/lib/results-reveal-styles.js`, mirroring `reveal-styles.js`:
  `RESULTS_REVEALS = [{ id: 'static', label: 'Static — just show the results' },
  { id: 'spotlight', label: 'Spotlight — hunt for the imposter in the dark' }]` and
  `DEFAULT_RESULTS_REVEAL = 'static'`.
- **Persist the choice** — [src/lib/settings.js](../03-builds/imposter-game-app/src/lib/settings.js):
  import `DEFAULT_RESULTS_REVEAL`; add **one** default,
  `resultsRevealStyle: DEFAULT_RESULTS_REVEAL`. `load()` already merges defaults under the
  stored value, so existing users back-fill to **Static**.
- **Settings control** — [src/screens/SettingsScreen.svelte](../03-builds/imposter-game-app/src/screens/SettingsScreen.svelte):
  add **one** `<Select>` labelled **"Imposter reveal"** (description e.g. "How the imposter(s)
  are revealed at the end of the round."), `options={RESULTS_REVEALS}`, bound to
  `$settings.resultsRevealStyle`, placed near the existing "Reveal animation" select.
- **New component** — `src/components/SpotlightReveal.svelte`, self-contained:
  - **Props:** `players` (`[{ name, isImpostor, isJester }]`) and `onDone` (called when the
    lead-in finishes / is skipped). No other props; it reads nothing from `gameState`.
  - **Ring layout:** scatter the names on a jittered ring (even angles + small offsets), inside
    padded bounds, names ≥16px; a second inner ring for large counts so nothing overlaps.
  - **Beam:** the radial-gradient overlay driven by `--x` / `--y` / `--r`; rAF tween between
    waypoints with ease-in-out + jitter and short pauses.
  - **Waypoints:** decoy **crewmate** stops, ending on a random **imposter** stop; on a
    no-crewmate round (Troll), a short decoy-free sweep.
  - **Climax + flare:** hold on the final imposter, then light the whole stage and flare **all**
    imposter names red together (jester pink), then call `onDone`.
  - **Skip affordance + keyboard:** a visible "Skip" control and **Enter/Space** jump straight
    to the lit stage and `onDone`.
  - **Reduced motion** (`prefers-reduced-motion`): no roam — light the whole stage immediately,
    then `onDone` (a short beat is fine, no animated beam travel).
  - **Colour tokens only** (`--error` / `--text` / `--jester`); **Grayscale** then collapses the
    tell, but the beam still stops on the **correct** imposter (path is data-driven).
  - **Pointer/teardown hardening** consistent with the other reveals: `touch-action: none` on
    interactive targets, `on:contextmenu|preventDefault` where a press is used, and `onDestroy`
    cancels the rAF loop / any timers.
- **Wire it in** — [src/screens/ResultsScreen.svelte](../03-builds/imposter-game-app/src/screens/ResultsScreen.svelte):
  import `settings` and `SpotlightReveal`; build `players` from the **existing**
  `roles`/`displayName` mapping already in the file. Add a local `revealed` flag. When
  `$settings.resultsRevealStyle === 'spotlight'` **and** `!revealed`, render
  `<SpotlightReveal {players} onDone={() => (revealed = true)} />`; **otherwise** render the
  **existing** results markup unchanged. (Static, or after the lead-in, shows today's screen.)
- Code follows [technical-standards.md](../../references/technical-standards.md): plain JS, **no
  new dependencies**, a brief comment on each new block, user-facing spelling **"imposter(s)"**,
  tap targets ≥ 44px, no horizontal scroll at 375px.

**Out of scope (do NOT build here):**

- **Any change to role assignment, word/hint generation, the five per-player reveal styles, or
  `RevealScreen`** — Spotlight is a *results-screen* lead-in only.
- **Changing the results text / "Play again" flow** — the existing `ResultsScreen` markup and
  `playAgain()` are untouched; Spotlight only gates *when* that text appears.
- **A per-player or interactive "drag the spotlight" mode** — the beam roams automatically on a
  predetermined path; the only interaction is **Skip**.
- **Reading `gameState` inside the component** — it is driven solely by the `players` prop.
- **Changes to `game-state.js`, the screen state machine, routing, Capacitor, or the service
  worker.** No new colour tokens (`app.css` unchanged).

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/lib/results-reveal-styles.js` | **New.** `RESULTS_REVEALS` list + `DEFAULT_RESULTS_REVEAL = 'static'`. |
| `src/lib/settings.js` | Import `DEFAULT_RESULTS_REVEAL`; add `resultsRevealStyle` default. |
| `src/screens/SettingsScreen.svelte` | One new `<Select>` "Imposter reveal" bound to `$settings.resultsRevealStyle`. |
| `src/components/SpotlightReveal.svelte` | **New.** Ring layout, spotlight overlay, rAF waypoint roam, climax + all-reds flare, skip + reduced-motion. |
| `src/screens/ResultsScreen.svelte` | Import settings + component; build `players`; gate the existing markup behind a `revealed` flag when `spotlight` is selected. |

## Constraints worth highlighting

- **Results-screen feature, not a role-reveal style.** It plays once for the table, gated by a
  **separate** setting (`resultsRevealStyle`), not by `revealStyle`.
- **Default stays Static.** Spotlight only plays when chosen; existing users back-fill to Static.
- **Never land on red early; always end on an imposter.** The path is pre-built from the known
  roles, so this is guaranteed, not probabilistic.
- **Multi-imposter = stop on one, then all reds flare.** A single dramatic catch, then the rest
  light up together before the text.
- **Jester reads pink; results text still names the jester.** The jester is never a hunt target.
- **No leak risk.** By results time the round is over, so there is no secrecy concern — unlike
  the per-player reveals, hiding the role at rest is **not** required here.
- **Grayscale + reduced motion.** Tokens only for colour; honour `prefers-reduced-motion` (no
  roam — straight to the lit stage). Under Grayscale the beam still stops on the correct player.
- **Driven by props only.** The component takes `players` + `onDone`; it does not read
  `gameState` or re-derive roles.
- **No new dependencies** — pure Svelte + JS. Verify at 375px, tap targets ≥ 44px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. **Setting present & persists:** Settings shows an **"Imposter reveal"** dropdown with
   **Static** (default) and **Spotlight**; pick Spotlight and **reload** → still selected.
2. **Static unchanged:** with **Static**, finishing a round shows **today's** results screen
   exactly (no animation).
3. **Spotlight, 1 imposter (named players):** the stage goes black, names scatter around it, the
   beam roams over **white** names, **never** stops on a red name early, then **stops on the
   imposter**; the results text then appears.
4. **Spotlight, 2–3 imposters:** the beam stops on **one** imposter, then **all** imposter names
   **flare red together**, then the results text appears.
5. **Jester round:** the jester name reads **pink** in the light-up; the results text still names
   the jester.
6. **Troll round (everyone imposter):** a quick sweep, then **all** names flare red, then the
   results text ("The imposters were …" lists everyone).
7. **"Player N" fallback names:** with no custom names, the positional names scatter and read
   correctly.
8. **Grayscale:** with Grayscale on, the animation still **stops on the correct player** (colours
   are neutral).
9. **Reduced motion / Skip / Enter:** with reduced motion on, or on tapping **Skip** / pressing
   **Enter**, the roam is skipped — the stage lights up and the results text appears.
10. **Many players (10+):** names don't overlap and stay readable (≥16px); no horizontal scroll
    at 375px.
11. **Regression + build:** the five per-player reveal styles and the rest of the app are
    unchanged; `npm run build` succeeds; no console errors.

## Next step

This brief feeds
[02-development/workflow/02-specs/spotlight-reveal-spec.md](../02-specs/spotlight-reveal-spec.md),
which converts it into an acceptance-criteria contract for the build.

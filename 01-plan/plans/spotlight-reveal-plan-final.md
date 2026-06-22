# Spotlight — Imposter Reveal Animation (plan, final)

## Context

The end-of-round reveal — who the imposters *were* — currently lives on `ResultsScreen.svelte`
as **static text** ("The imposters were X and Y / The word was …"). Every other piece of
theatre in the app is on the *per-player* `RevealScreen` (Peek, Choose a Card, Wheel,
Envelope). The group payoff moment has no drama.

**Spotlight** adds that drama. The screen goes black; every player's name sits scattered in
the dark, **white = crewmate, red = imposter** (colour is the only tell). A spotlight roams a
random-looking path, lighting up crewmate names to build tension, deliberately avoiding red
until the climax — then it **stops on an imposter**, all imposter names **flare red at once**,
and the screen settles into the existing results text.

This is **distinct from a role-reveal animation**: it plays once, for the whole table, on the
results screen — not once per player.

### Decisions locked with Rehaan

- **Multiple imposters:** the spotlight stops on **one** imposter, then **all red names light
  up** simultaneously before the results text appears.
- **Scope:** an **opt-in setting**, mirroring the reveal-style selector. Default stays
  **Static**; Spotlight only plays when chosen.
- **Layout:** **all player names placed around the screen at once** (scattered), beam roams
  between them.

## Design

### Visual technique

A dark stage with all names rendered at full colour underneath, and a **dark overlay on top
with a single transparent "hole"** that follows the beam. The overlay both darkens the scene
and *is* the spotlight:

```
overlay background: radial-gradient(circle var(--r) at var(--x) var(--y),
                    transparent 0%, transparent 55%, rgba(0,0,0,0.97) 100%)
```

Moving the beam = updating `--x`/`--y` (and `--r` to tighten at the climax). Names beneath show
their true colour only where the hole passes over them — so dimming and the "tell" both fall
out of one mechanism, with no per-name opacity bookkeeping.

### Motion ("random but predetermined")

Build a **waypoint list** up front: a handful of crewmate name positions as decoy stops, then
the chosen imposter position as the final stop. Tween the beam between waypoints with
`requestAnimationFrame` + ease-in-out and slight jitter (the same rAF approach as
`WheelReveal`), pausing ~250–400ms at each decoy. This guarantees the beam never lands on red
early and always ends on the real imposter, while reading as a live search.

### Climax → results

On the final waypoint the beam halts, tightens/brightens briefly (~800ms hold), then the
overlay fades toward transparent so the **whole stage lights up** and every imposter name
pulses red (the jester name, if any, shows pink). Then `onDone()` fires (auto, with a
tap/Enter to skip ahead) and `ResultsScreen` shows its existing static text.

### Layout algorithm

Scatter `playerCount` names within the stage on a **jittered ring** (evenly-spaced angles plus
small random offsets), keeping names ≥16px and inside padded bounds. The stage is a fixed
aspect box that scales with the viewport so names don't overlap; for large counts it falls back
to a second inner ring.

### Edge cases

- **Troll Mode** (everyone an imposter → all red): no crewmate decoys exist, so the hunt is
  skipped — a quick sweep, then all names flare red. Falls out of the waypoint builder (when
  there are no crewmates, pick a short decoy-free path).
- **Jester:** not a hunt target; its name shows `--jester` pink when lit and in the final
  light-up. The results text already names the jester.
- **Grayscale mode:** `--error`/`--text` collapse to the same grey, so the colour tell is lost
  — but the hunt is **data-driven** (stops on the correct imposter from `roles`, not colour),
  so the animation still runs correctly; it reads as a neutral search. Acceptable and
  consistent with grayscale's "no colour tells" intent.
- **prefers-reduced-motion:** skip the roam; light the whole stage immediately, then results.

## Files (mirrors the existing reveal-style pattern)

1. **NEW `src/lib/results-reveal-styles.js`** — mirror `reveal-styles.js`:
   `RESULTS_REVEALS = [{id:'static', label:'Static — just show the results'},
   {id:'spotlight', label:'Spotlight — hunt for the imposter in the dark'}]` and
   `DEFAULT_RESULTS_REVEAL = 'static'`.
2. **`src/lib/settings.js`** — import `DEFAULT_RESULTS_REVEAL`; add
   `resultsRevealStyle: DEFAULT_RESULTS_REVEAL` to `defaults` (load() back-fills existing users).
3. **`src/screens/SettingsScreen.svelte`** — add a `<Select>` "Imposter reveal" bound to
   `$settings.resultsRevealStyle`, options `RESULTS_REVEALS`, near the "Reveal animation" select.
4. **NEW `src/components/SpotlightReveal.svelte`** — the animation. Props: `players`
   (`[{name, isImpostor, isJester}]`, built by the caller from `roles`+`displayName`), `onDone`.
   Self-contained: ring layout, waypoint builder, rAF beam tween, climax + all-reds flare, skip
   affordance, reduced-motion + keyboard (Enter/Space to skip). Uses `--error`/`--text`/
   `--jester` tokens. References `WheelReveal` (rAF loop) and `PeekReveal` (reduced-motion).
5. **`src/screens/ResultsScreen.svelte`** — import `settings` + `SpotlightReveal`; build the
   `players` array (reuse the existing `roles`/`displayName` mapping). If
   `resultsRevealStyle === 'spotlight'` and not yet finished, render `SpotlightReveal` with
   `onDone={() => (revealed = true)}`; otherwise render the **existing** results markup
   unchanged.

No changes to game-state, the screen state machine, or other reveals.

## Verification (Rehaan runs `npm run dev`)

See the spec's checklist. Key points: Settings shows a new "Imposter reveal" selector
(default Static, persists); Static = today's screen; Spotlight roams over white names, never
lands on red early, stops on an imposter, then 2+ imposters all flare red, then the results
text; jester reads pink; Troll = quick all-red; grayscale still stops on the correct player;
reduced-motion / tap / Enter skips to the lit stage + results; 10+ players don't overlap;
`npm run build` succeeds.

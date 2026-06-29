# Plan (final) — Prosecutor Role

## Context

The game has three roles today: **crewmate** (sees the real word), **imposter** (sees a vague
hint), and the optional **Jester** (a crewmate-type who wins by getting voted out). This adds a
second optional, toggleable role: the **Prosecutor** — an *imposter-type* with a secret
assassination mission.

The Prosecutor does **not** know the word (gets the shared imposter hint, like any imposter) but
is given a single **secret target to get voted out**. If the table votes that person out, the
round ends and the Prosecutor wins. Because the app is pass-and-play with **no in-app voting** (by
design), the win is honored **verbally at the table**, exactly like the Jester — the app assigns
the role, reveals it correctly, and reveals who the Prosecutor was (and their target) at Results.

The Prosecutor is toggled on/off on the existing **Roles screen** (alongside the Jester). The
toggle **persists across rounds** and is **off by default**.

## Decisions locked with Rehaan

1. **Occupies one imposter slot.** Enabling the Prosecutor converts one of the round's existing
   imposters into the Prosecutor — it does **not** add an extra imposter. (If `impostorCount` is
   1, that lone imposter becomes the Prosecutor.) This mirrors how the Jester already occupies a
   crewmate slot — verified in `buildRoles`; **no Jester change needed**.
2. **On the imposter team, both ways.** Because the Prosecutor's role carries `isImpostor: true`,
   the existing "Reveal fellow imposters" feature already lists the Prosecutor among other
   imposters' fellows *and* shows the Prosecutor the other imposters. The fellow-list shows
   **names only, never the specific role**, so it never leaks who the Prosecutor is. No change to
   that logic.
3. **End reveal shows Prosecutor AND target** — e.g. *"The prosecutor was Sam — their target was
   Alex."*
4. **No in-round banner.** Unlike the announced Jester, the Prosecutor is a *hidden* role — the
   surprise is the point. It is disclosed only at Results.
5. **Reveal theatre reuses the imposter visuals.** The four reveal styles' animation/landing
   (wheel wedge, flipped card face, peek line, envelope flap) reuse the existing **imposter**
   appearance — no new wheel segments, decoy kinds, or Spotlight colors. Only the authoritative
   **detail card** is Prosecutor-specific (gold, 🔨 title, target instruction, hint).

## Role model

- Role objects gain a prosecutor shape: `{ isImpostor: true, isProsecutor: true, targetIndex }`.
  It reads the shared `gameState.hint` like any imposter; only its display branch differs (checked
  **before** the imposter/crewmate split, since `isImpostor` is true).
- **Target chosen after the shuffle:** the target pool is every index where `!isImpostor`
  (crewmates + the Jester); one is picked at random and stored as `targetIndex`. Self and fellow
  imposters are excluded by construction.
- `gameState.hasProsecutor` (boolean) is true only on a non-troll round where the toggle is active;
  the results reveal keys off it. **Troll Mode wins:** on a troll round everyone is an imposter and
  `hasProsecutor` is forced false.
- **At most one Prosecutor per round.**

### Player-count rules (prosecutor active, non-troll)
- Needs ≥ 3 players (`PROSECUTOR_MIN_PLAYERS = 3`, mirroring the Jester; inert while
  `MIN_PLAYERS` is 3 but kept correct/future-proof).
- **No change to the imposter-count cap.** The Prosecutor occupies an existing imposter slot, and
  today's cap (`players − 1`, or `players − 2` with the Jester) already guarantees ≥ 1
  crewmate-type target. The target pool is therefore never empty (a defensive fallback is included
  anyway).

## Changes (by file)

All under `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/lib/roles-config.js` | Add `prosecutorEnabled: false` to the persisted defaults. |
| `src/lib/config.js` | Add `PROSECUTOR_MIN_PLAYERS = 3`. |
| `src/app.css` | Add `--prosecutor: #e0b341;` (gold) to `:root`; pin it to gray in `:root.grayscale`. |
| `src/lib/game-state.js` | `buildRoles(..., hasProsecutor)` marks one imposter as the prosecutor and assigns `targetIndex` after the shuffle; `startGame` gains `prosecutorEnabled`, computes `hasProsecutor = prosecutorEnabled && !isTroll`, stores it; `initial.hasProsecutor`. |
| `src/screens/RolesScreen.svelte` | Add the Prosecutor toggle row after the Jester (disabled below the min). |
| `src/screens/SetupScreen.svelte` | `prosecutorActive` derivation + auto-off guard; pass `prosecutorEnabled`. (No `maxImpostors` change.) |
| `src/screens/RevealScreen.svelte` | `isProsecutor`/`prosecutorTargetName`; prosecutor branch (Envelope + Original) before the imposter branch; pass the two props to the three reveal components. |
| `src/components/WheelReveal.svelte`, `CardGridReveal.svelte`, `PeekReveal.svelte` | New `isProsecutor`/`prosecutorTargetName` props; prosecutor detail-card branch (gold) before the imposter branch; landing theatre stays `impostor`. |
| `src/screens/ResultsScreen.svelte` | "The prosecutor was {name} — their target was {target}" line (gold) when `hasProsecutor`. |

`SpotlightReveal.svelte` and the fellow-imposters logic need **no** change (Prosecutor is
`isImpostor:true`).

## Verification (Rehaan runs `npm run dev`)

- Roles screen shows a Prosecutor toggle (gold), off by default, disabled below the min; survives
  reload.
- Prosecutor on → exactly one imposter reveals as 🔨 Prosecutor with a hint and a **named target**;
  across many rounds the target is always a crewmate or the Jester, never an imposter, never self.
- "Reveal fellow imposters" on (2+ imposters): the Prosecutor sees the other imposters, and the
  others see the Prosecutor listed by name only (no role label).
- All reveal styles (envelope, original, wheel, card-grid, peek) show the Prosecutor detail card.
- Results: "The prosecutor was X — their target was Y" (X also appears in the imposter list);
  Spotlight flares the Prosecutor red as an imposter.
- Jester + Prosecutor both on: both assigned; Jester is a legal target.
- Troll round: no Prosecutor, no errors. Grayscale: gold collapses to gray. `npm run build` clean.

## Downstream artifacts
- Brief: [02-development/workflow/01-brief/prosecutor-role-brief.md](../../02-development/workflow/01-brief/prosecutor-role-brief.md)
- Spec: [02-development/workflow/02-specs/prosecutor-role-spec.md](../../02-development/workflow/02-specs/prosecutor-role-spec.md)
- Build: under `02-development/workflow/03-builds/imposter-game-app/`.
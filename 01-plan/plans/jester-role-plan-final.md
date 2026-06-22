# Plan (final) — Jester Role + Roles screen + Wheel-of-Fate polish

## Context

The game had two roles — **crewmate** (sees the real word) and **imposter** (sees a vague
hint) — assigned in `game-state.js` and rendered by three reveal animations (Classic tap,
Secret-letter hold, Wheel of Fate). This adds a third, **optional** role: the **Jester**.

The jester's goal is to *get voted out on purpose* by acting like the imposter. The jester
is given the **real word** (like a crewmate) but is a distinct role conceptually and
visually (**light pink**, `🃏`). Because the app is pass-and-play with **no in-app voting**
(the round ends at a Results screen that reveals the imposter), the jester's "win" is handled
**verbally at the table** — the app assigns the role, reveals it correctly, announces that a
jester is in play, and reveals who the jester was at Results.

The jester is toggled on/off on a **new "Roles" screen** (NOT in Settings), reached from a
button in the **top-left** of the main screen (mirroring the top-right Settings button). The
toggle **persists across rounds** and is **off by default**.

Bundled with the same feature: three Wheel-of-Fate improvements — faster spin-to-stop,
snap-to-finish on a late release, and a loading bar.

## Decisions locked with Rehaan

1. **Win handling: verbal.** No voting UI. Results reveals who the jester was (light pink)
   alongside the imposter reveal; the table decides if the jester pulled it off.
2. **Awareness: announced.** When a jester is in play, a light-pink banner ("🃏 A JESTER is
   among you this round") shows during reveals and discussion.
3. **Wheel: dedicated jester wedges.** Light-pink jester wedges are added to the wheel's
   segment set on jester rounds, so the wheel lands on one for the jester.

## Role model

- Role objects gain a jester shape: `{ isImpostor: false, isJester: true }`. The jester
  reads `gameState.word` like a crewmate; only its display branch differs (checked **before**
  the crewmate/imposter split).
- `gameState.hasJester` (boolean) is true only on a non-troll round where the jester is
  active; the banner, the wheel wedges, and the results reveal all key off it.
- **At most one jester per round.** **Troll Mode wins:** on a troll round everyone is an
  imposter and `hasJester` is forced false (no jester, no banner).

### Player-count rules (jester active, non-troll)
- Needs ≥ 3 players: 1 jester + ≥ 1 imposter + ≥ 1 crewmate.
- Imposter count range becomes `[1, players − 2]`.
- Auto-disable the jester toggle if players drops below `JESTER_MIN_PLAYERS = 3`. (Inert
  today because `MIN_PLAYERS` is already 3 — future-proofing, gated on the constant.)

## Changes (by file)

| File | Change |
|---|---|
| `src/lib/roles-config.js` | **New.** Persisted `{ jesterEnabled }` store (key `imposter:roles`), mirroring `settings.js`. Kept separate from Settings. |
| `src/lib/config.js` | Add `JESTER_MIN_PLAYERS = 3`. |
| `src/app.css` | Add `--jester: #f0a8d8;` to `:root`; pin it to gray in `:root.grayscale`. |
| `src/lib/game-state.js` | `buildRoles(playerCount, impostorCount, hasJester)`; `startGame` gains `jesterEnabled`, computes `hasJester = jesterEnabled && !isTroll`, stores it; `initial.hasJester`. |
| `src/screens/RolesScreen.svelte` | **New.** Roster + the single Jester toggle (disabled below the min). |
| `src/screens/SetupScreen.svelte` | Roles button (top-left) + overlay; `maxImpostors` reserves the jester slot; auto-off guard; passes `jesterEnabled`. |
| `src/screens/RevealScreen.svelte` | Jester branch (Classic + Envelope), the announcement banner, `isJester`/`hasJester` to the wheel. |
| `src/components/WheelReveal.svelte` | Jester wedges + result branch; faster `SETTLE_MS`; snap-on-late-release; loading bar. |
| `src/screens/DiscussionScreen.svelte` | The announcement banner. |
| `src/screens/ResultsScreen.svelte` | "The jester was {name}" reveal in light pink. |

## Verification (Rehaan runs `npm run dev`)

- Roles button top-left, Settings top-right; Jester toggle off by default; survives reload.
- 3 players + jester → 1 crewmate + 1 imposter + 1 jester (imposter max 1); 4 players →
  imposters 1–2 with exactly one jester.
- Jester reveal across all three animations: light pink, real word, get-voted-out goal.
- Banner during reveal + discussion; Results shows "The jester was {name}".
- Grayscale: jester indistinguishable from the others.
- Troll round overrides: everyone imposter, no jester, no banner.
- Wheel: faster, snaps on release in the last ~5%, loading bar fills while holding.
- Jester off → identical to before; `npm run build` clean.

## Downstream artifacts
- Brief: [02-development/workflow/01-brief/jester-role-brief.md](../../02-development/workflow/01-brief/jester-role-brief.md)
- Spec: [02-development/workflow/02-specs/jester-role-spec.md](../../02-development/workflow/02-specs/jester-role-spec.md)
- Build: under `02-development/workflow/03-builds/imposter-game-app/`.

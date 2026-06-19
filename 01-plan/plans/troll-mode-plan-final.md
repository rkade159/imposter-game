# Plan (final) — Troll Mode

## Context

A new chaos feature for the Imposter game. Normally one (or a few) players are the
imposter; everyone else shares the secret word. **Troll Mode** occasionally turns a
whole round on its head: **every** player is secretly told they are the imposter at
once. Because each player thinks they alone are the imposter and everyone else is a
crewmate, discussion collapses into confusion — which is the whole point.

It is configured from the **Settings** menu, **persists across rounds and sessions**
until changed, and is deliberately unpredictable: it fires on a random *future* round,
not the moment it is enabled.

## Shape — a 4-way enum (not a plain on/off toggle)

Modelled on the existing `revealStyle` enum setting (a `Select` dropdown backed by a
list in its own lib module). The chosen value persists in the `settings` store.

| Option | id | Behaviour |
|---|---|---|
| **Off** | `off` | Normal game. **Default.** |
| **Sneaky** | `sneaky` | Flat ~10% chance per round, but **never two troll rounds in a row**. Persists. |
| **Building** | `building` | Chance starts low and **rises each non-troll round**, resets after it fires. Persists. |
| **Guaranteed — next round** | `guaranteed` | The **next** round started is a troll round, then **auto-reverts to Off** (fires once). |

On a troll round every player sees the **identical "YOU ARE THE IMPOSTER" reveal**, but
each player gets their **own random hint** (different per player) so everyone believes a
real word exists to guess. The **results screen stays ambiguous** — no "Troll Mode!"
banner; players figure it out themselves.

## Design decisions

- **Roll timing.** The troll roll happens once per round, inside the existing "Start
  Game" flow (`SetupScreen.start()` → `startGame()`), *after* the Anti-Yusuf gate so a
  blocked Start doesn't consume a roll. For **Sneaky/Building** the round *immediately
  after enabling* the mode is forced non-troll ("never on the round you turn it on");
  the surprise lands on some later round. **Guaranteed** deliberately overrides that and
  fires on the next round, then turns itself off.
- **Per-player hints live on the role.** On a troll round `roles[i] = { isImpostor: true,
  hint }`; normal rounds are unchanged (`{ isImpostor }` + shared `gameState.hint`). The
  reveal screen reads `role.hint ?? gameState.hint`, so a single change covers all three
  reveal styles (Classic, Secret Letter, Wheel).
- **An `isTroll` flag on game state** suppresses the "Reveal fellow imposters" line on a
  troll round — otherwise a 2+-imposter game with that setting on would list everyone and
  blow the "I'm the lone imposter" illusion.
- **Cross-round state persists in localStorage** (mirrors `settings.js`) so "never twice
  in a row" and the rising Building odds survive reloads.
- **No results-screen change.** With everyone an imposter the existing results screen
  already shows all players as imposters — already ambiguous.

## Files

**New**

- `src/lib/troll-mode.js` — `TROLL_MODES` + `DEFAULT_TROLL_MODE`; pure
  `rollTroll(mode, state, rng?) → { isTroll, nextState, disableMode }`;
  `buildTrollHints(words, count, rng?)` (per-player, ideally-distinct hints).
- `src/lib/troll-state.js` — persisted store `{ lastMode, lastWasTroll, roundsSinceTroll }`
  (localStorage key `imposter:troll-state`), same pattern as `settings.js`.

**Modified**

- `src/lib/settings.js` — add `trollMode: DEFAULT_TROLL_MODE` to `defaults`.
- `src/screens/SettingsScreen.svelte` — one `<Select>` row bound to `$settings.trollMode`.
- `src/screens/SetupScreen.svelte` — in `start()`: roll, persist `nextState`, on Guaranteed
  set `trollMode = 'off'`, pass `trollHints` to `startGame()`.
- `src/lib/game-state.js` — `startGame()` accepts `trollHints`; sets `isTroll` + all-imposter
  roles carrying per-player hints; `isTroll: false` added to `initial`.
- `src/screens/RevealScreen.svelte` — hint prefers `role.hint`; fellow-imposter line gated
  on `!isTroll`.

## `rollTroll` logic

`justEnabled = mode !== state.lastMode`.
- `off` → never.
- `sneaky` → `!justEnabled && !lastWasTroll && rng() < 0.10`.
- `building` → `!justEnabled && rng() < min(0.04 + roundsSinceTroll*0.04, 0.45)`.
- `guaranteed` → always true; `disableMode = true`.
- `nextState`: `lastMode = mode`, `lastWasTroll = isTroll`, `roundsSinceTroll = isTroll ? 0
  : roundsSinceTroll + 1`. (Odds constants are tunable in one place.)

## Verification (smoke test — Rehaan runs `npm run dev`)

1. Settings shows a 4-option **Troll Mode** dropdown; choice survives a reload.
2. **Guaranteed** → every reveal is "YOU ARE THE IMPOSTER" with a hint, hints differ per
   player; after the round the setting is back to **Off**; results show no special framing.
3. **Off** → repeated rounds are always normal.
4. **Off → Sneaky/Building**, start one round → normal (never on the round you enable it).
5. **Probabilistic (temporary):** raise the odds constants to `1` to confirm Sneaky/Building
   fire, and Sneaky never fires twice in a row; restore.
6. **Persistence:** reload mid-Building (after a few rounds) → rising odds carry over.
7. `npm run build` succeeds.

Optional: unit-test the pure `rollTroll` (off/sneaky/building/guaranteed, never-twice-in-a-row,
guaranteed `disableMode`) via an injected `rng` — deferred (no test runner installed).

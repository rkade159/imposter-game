# Brief — Troll Mode

## Source plan

[01-plan/plans/troll-mode-plan-final.md](../../../01-plan/plans/troll-mode-plan-final.md)

## What to build

A new **"Troll Mode"** setting on the existing **Settings** screen: a **4-option
selector** (like the existing **Reveal animation** setting), **off by default**. While a
"chaos" mode is selected, a random *future* round becomes a **troll round** in which
**every player is secretly told they are the imposter** — so each one thinks they alone
are the imposter and everyone else is a crewmate. Pure confusion fuel.

Today every round assigns exactly the configured number of imposters; everyone else gets
the word. After this build:

- **Settings** has a **"Troll Mode"** row — a dropdown with **four** options
  (description: **"Occasionally makes EVERYONE the imposter for one chaotic round."**),
  defaulting to **Off**:

  | Option | id | Behaviour |
  |---|---|---|
  | **Off** | `off` | Normal game. Default. |
  | **Sneaky** | `sneaky` | Flat ~10% chance per round, **never two troll rounds in a row**. |
  | **Building** | `building` | Chance starts low and **rises each non-troll round**, resets after a hit. |
  | **Guaranteed — next round** | `guaranteed` | The **next** round is a troll round, then the setting **auto-reverts to Off**. |

- **On a troll round:** **every** player's reveal — in **all three** reveal styles —
  shows the **normal "YOU ARE THE IMPOSTER" card with a hint**, exactly as a lone imposter
  would see. But **each player gets their OWN random hint** (different per player) so the
  table can't spot a troll round by comparing clues. No crewmate, no word shown to anyone.
- **The "Reveal fellow imposters" line is suppressed on a troll round** — otherwise a 2+
  imposter game with that setting on would list everyone and expose the gag.
- **The results screen is unchanged / ambiguous** — it shows everyone as imposters with
  **no** "Troll Mode!" banner; players work it out themselves.
- **The chosen mode persists** like Grayscale / Reveal animation (the persisted `settings`
  store, `localStorage`), **except** Guaranteed, which fires once then sets itself to Off.
- **It never fires on the round it's enabled** for Sneaky/Building (the surprise lands on
  a later round); Guaranteed intentionally fires on the very next round.

## Why this is being built now

1. **It's a high-variance party twist** that costs almost nothing structurally — it
   reuses the exact reveal/hint/role plumbing already in place.
2. **The seams already exist.** Roles are built in `startGame()`; the imposter reveal
   already renders a hint; multi-option settings already use a `Select` backed by a list
   module (`reveal-styles.js`). Troll Mode mirrors all three patterns — no new UI
   primitives, no new dependencies.
3. **Per-player hints are a one-line read change.** `RevealScreen` already derives the
   imposter hint once for all three styles; switching it to prefer a per-player hint on
   the role covers Classic, Secret Letter, and Wheel at once.

## How the roll works (the core logic)

A single pure function decides each round, kept in its own module so Settings (the option
list) and the game logic (the decision) never drift — mirroring `reveal-styles.js` /
`word-source.js`:

```js
// troll-mode.js — state = { lastMode, lastWasTroll, roundsSinceTroll }
export function rollTroll(mode, state, rng = Math.random) {
  const justEnabled = mode !== state.lastMode; // forces the round AFTER enabling to be normal
  let isTroll = false, disableMode = false;
  switch (mode) {
    case 'sneaky':   isTroll = !justEnabled && !state.lastWasTroll && rng() < 0.10; break;
    case 'building': isTroll = !justEnabled && rng() < Math.min(0.04 + state.roundsSinceTroll*0.04, 0.45); break;
    case 'guaranteed': isTroll = true; disableMode = true; break; // fires now, then turn Off
    default: isTroll = false; // 'off'
  }
  const nextState = { lastMode: mode, lastWasTroll: isTroll,
                      roundsSinceTroll: isTroll ? 0 : state.roundsSinceTroll + 1 };
  return { isTroll, nextState, disableMode };
}
```

The cross-round counters (`lastWasTroll` for "never twice in a row", `roundsSinceTroll`
for the rising odds) live in a **separate persisted store** so they survive reloads, kept
apart from the user's *choice* in `settings.js`. On a hit, `buildTrollHints(words, count)`
draws one (ideally distinct) hint per player from the loaded word list.

## Scope

**In scope:**

- **New logic module** — `src/lib/troll-mode.js`: `TROLL_MODES`, `DEFAULT_TROLL_MODE`,
  the pure `rollTroll()` above (odds constants tunable in one place), and
  `buildTrollHints(words, count, rng?)` reusing the `{ word, hint }` shape from
  `word-source.js`. `rng` is injectable for testability.
- **New persisted state store** — `src/lib/troll-state.js`: a `writable`
  `{ lastMode, lastWasTroll, roundsSinceTroll }` with the same `localStorage`
  load/subscribe pattern as `settings.js` (key `imposter:troll-state`).
- **New persisted setting** — [src/lib/settings.js](../03-builds/imposter-game-app/src/lib/settings.js):
  add `trollMode: DEFAULT_TROLL_MODE` to `defaults` (existing `load()` merge gives older
  saves the default; the store already auto-persists). Add a short comment like the others.
- **Settings row** — [src/screens/SettingsScreen.svelte](../03-builds/imposter-game-app/src/screens/SettingsScreen.svelte):
  one `<Select>` row (mirroring the Reveal-animation row) — `id="setting-troll-mode"`,
  `label="Troll Mode"`, the description above, `options={TROLL_MODES}`,
  `bind:value={$settings.trollMode}`.
- **Roll wiring** — [src/screens/SetupScreen.svelte](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte):
  in `start()`, **after** the Anti-Yusuf gate and after `pickWord`, call
  `rollTroll($settings.trollMode, get(trollState))`; write `nextState` back to `trollState`;
  if `disableMode`, set `$settings.trollMode = 'off'`; pass
  `trollHints: isTroll ? buildTrollHints(words, players) : null` into `startGame()`.
- **Role assignment** — [src/lib/game-state.js](../03-builds/imposter-game-app/src/lib/game-state.js):
  `startGame()` gains an optional `trollHints`. When non-empty: set `isTroll: true` and
  `roles = trollHints.map(h => ({ isImpostor: true, hint: h }))`; else unchanged
  `buildRoles(...)`. Add `isTroll: false` to the `initial` object so `playAgain()` /
  `resetGame()` clear it. `buildRoles` itself is untouched.
- **Reveal** — [src/screens/RevealScreen.svelte](../03-builds/imposter-game-app/src/screens/RevealScreen.svelte):
  change the single derived `hint` to **prefer `role.hint`** then fall back to
  `$gameState.hint` (trimmed); this feeds all three styles (incl. the `WheelReveal` prop)
  unchanged. Add `&& !$gameState.isTroll` to the existing `fellowImposters` gate.
- **Grayscale-safe + mobile** — no new colour: the troll reveal **reuses the existing
  imposter card** exactly. Tap targets ≥44px, no horizontal scroll at 375px.
- Code follows [technical-standards.md](../../references/technical-standards.md): plain JS,
  no new dependencies, a brief comment on each new block, spelling **"imposter(s)"** in
  user-facing text.

**Out of scope (do NOT build here):**

- **Announcing** the troll round anywhere (reveal or results) — it stays a stealth gag;
  results behaviour is **unchanged**.
- **A distinct troll-themed reveal animation** — the reveal is byte-for-byte the normal
  imposter card; any themed treatment is a later `03-design` concern.
- **Configurable odds / per-round UI** beyond the four options — odds are fixed constants
  in `troll-mode.js`.
- **Changing who's an imposter in normal rounds**, `buildRoles` logic, `word-source.js`,
  the discussion/results/pass screens, routing, Capacitor, or the service worker.
- **A unit-test runner** — `rollTroll`/`buildTrollHints` are written pure and injectable so
  tests are trivial later, but no runner is added in this build.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/lib/troll-mode.js` | **New.** Options list, `rollTroll()`, `buildTrollHints()`. |
| `src/lib/troll-state.js` | **New.** Persisted cross-round counters. |
| `src/lib/settings.js` | Add `trollMode: DEFAULT_TROLL_MODE` to `defaults`. |
| `src/screens/SettingsScreen.svelte` | Add the "Troll Mode" `<Select>` row. |
| `src/screens/SetupScreen.svelte` | Roll in `start()`; persist state; auto-off Guaranteed; pass `trollHints`. |
| `src/lib/game-state.js` | `startGame()` handles `trollHints` + `isTroll`; `isTroll` added to `initial`. |
| `src/screens/RevealScreen.svelte` | Hint prefers `role.hint`; fellow-imposter line gated on `!isTroll`. |

## Constraints worth highlighting

- **Never on the round it's enabled** for Sneaky/Building (`justEnabled` guard);
  Guaranteed is the deliberate exception and fires once, then sets itself to **Off**.
- **Sneaky never fires twice in a row** (`lastWasTroll` guard); **Building's** odds rise
  via `roundsSinceTroll` and reset on a hit.
- **Each player gets their own hint** on a troll round — do **not** reuse the shared
  `gameState.hint` for everyone.
- **The illusion must hold:** the troll reveal is the **normal** imposter card, and the
  fellow-imposter line is **suppressed** on troll rounds.
- **Single source of truth.** The mode list and roll logic live **only** in
  `troll-mode.js`; the user's choice in `settings.js`; the cross-round counters in
  `troll-state.js`. Don't scatter copies.
- **Persisted** choice + counters (survive reload), unlike the session-only Anti-Yusuf.
- **No new dependencies** — pure Svelte + JS. Verify at 375px, tap targets ≥44px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. **Setting present & persists:** Settings shows a **"Troll Mode"** dropdown with the
   four options, **Off** by default; pick one and **reload** → still selected.
2. **Guaranteed:** select **Guaranteed**, Start → **every** player's reveal says **"YOU
   ARE THE IMPOSTER"** with a hint, and **hints differ** between players; after the round
   the setting has **reverted to Off**; **results** show no special framing.
3. **Off:** with **Off**, repeated rounds are always normal (configured imposters;
   crewmates see the word).
4. **Never-on-enable:** switch **Off → Sneaky** (or **Building**) and start **one** round
   → it is a **normal** round.
5. **All three reveal styles** (Classic / Secret Letter / Wheel of Fate) show the troll
   reveal identically to a normal imposter reveal, each with its own hint.
6. **Fellow-imposter suppression:** with 2+ imposters **and** "Reveal fellow imposters"
   **on**, a troll round shows **no** fellow-imposter line.
7. **Probabilistic plumbing (temporary):** raise `SNEAKY_CHANCE` / `BUILDING_BASE` to `1`
   in `troll-mode.js` → confirm a troll round fires and (Sneaky) the **next** round cannot
   also troll; restore the constants.
8. **Persistence of odds:** reload mid-**Building** (after a few rounds) → the rising odds
   state carries over rather than resetting.
9. **Regression + build:** a normal play-through still works with **Off**;
   `npm run build` succeeds; no horizontal scroll at 375px; tap targets ≥44px.

## Next step

This brief feeds
[02-development/workflow/02-specs/troll-mode-spec.md](../02-specs/troll-mode-spec.md),
which converts it into an acceptance-criteria contract for the build.

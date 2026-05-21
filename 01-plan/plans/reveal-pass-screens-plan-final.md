# Reveal + Pass Screens (the Gameplay Loop) Plan (Final)

## Why this plan exists

After Start, `gameState` already carries everything a round needs — `{ playerCount, impostorCount, wordSource, word }` (see [impostor-count-and-word-source-plan-final.md](impostor-count-and-word-source-plan-final.md)). What's missing is the **gameplay loop**: turning that config into per-player roles and walking the device around the table so each player privately learns whether they hold the word or are the impostor.

This is the feature where the **screen-routing pattern** the tech-stack plan promised finally lands. The scaffold was deliberately laid for it and is currently inert:

- [shuffle.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/shuffle.js) is a stub that just returns `items.slice()`.
- [RevealScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte) / [PassScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/PassScreen.svelte) / [DiscussionScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/DiscussionScreen.svelte) / [ResultsScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/ResultsScreen.svelte) are placeholders.
- [App.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/App.svelte) renders `SetupScreen` directly, with a comment explicitly anticipating a `{#if}` ladder on a `screen` field.

**Intended outcome:** Start hands off into a Reveal → Pass loop that shows every player their role exactly once, then drops into the (still-stubbed) discussion screen. After this lands, `gameState` carries `{ screen, playerCount, impostorCount, wordSource, word, roles, revealIndex }`, and the app is a real multi-screen state machine.

## The feature

1. **Real Fisher–Yates shuffle.** Replace the `shuffle.js` stub with a Durstenfeld Fisher–Yates implementation that stays pure (returns a new array, no mutation), preserving the stub's documented contract.
2. **Role generation at Start.** A `roles` array of length `playerCount` is built where `impostorCount` entries are impostors and the rest are crewmates, then shuffled so impostor *positions* are random. `roles[i]` is player `i`'s role. Crewmates "get the word" by reading the shared `gameState.word`; impostors are simply marked.
3. **Screen routing.** Add a `screen` field to `gameState` and replace the direct `<SetupScreen />` in `App.svelte` with an `{#if}` ladder that routes between Setup / Reveal / Pass / Discussion / Results.
4. **RevealScreen** (tap-to-reveal): shows `Player N of M`, a face-down **"Tap to reveal your role"** prompt → tap flips to the role card (`THE WORD IS: "x"` for crewmates, `YOU ARE THE IMPOSTOR!` for impostors) → an advance button whose **label is conditional**: **"Hide & pass to next player"** for players `1…N-1`, and **"Hide & continue to discussion"** for the last player (there is no next player to pass to).
5. **PassScreen** (privacy buffer): shows **"Pass to Player N+1 — tap when ready"** → tap loads the next player's reveal. The person who taps is the next player, so the card only appears after their own deliberate action.
6. **Loop + exit.** Reveal → Pass → Reveal repeats with an incrementing index until every player has been shown. After the **last** player's reveal there is no pass step — it routes straight to the **DiscussionScreen** (`screen = 'discussion'`), which now carries a placeholder **"Play again"** button that calls `resetGame()` to return to Setup, so a finished game restarts without a page refresh.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Roles array shape | Array of `{ isImpostor }`, `index = player`, `length = playerCount` | Matches "impostors marked, others get the word." The word isn't duplicated per entry — crewmate reveals read `gameState.word`. Keeps state lean and a future "category hint for impostor" easy to add. |
| Where role generation lives | `buildRoles()` in `game-state.js`, called by a `startGame()` action | The prior plans established that transitions live in `game-state.js` as pure store writes; `shuffle.js` stays a generic utility. |
| Turn tracking | `revealIndex` in `gameState`, not component-local | Screens stay pure reactive reads — consistent with "state lives in `gameState`." |
| Reveal privacy | **Tap-to-reveal flip** (local `revealed` flag) | Rehaan's choice. The `{#if}` ladder destroys/recreates `RevealScreen` per player, so `revealed` resets to `false` automatically each turn. |
| Loop transitions | `revealDone()`: → `pass` if more players else `discussion`; `nextPlayer()`: `revealIndex++` → `reveal` | The last player skips a meaningless "Pass to Player N+1" and goes straight to discussion. |
| After last reveal | `screen = 'discussion'` (existing stub) | Rehaan's choice. Keeps the state machine continuous; real discussion is its own later feature. |
| Player labeling | `Player N of M` on reveal, `Pass to Player N+1` on pass | Rehaan's choice — orientation + a visible endpoint. |
| Restart affordance | **No** button on Reveal/Pass; a placeholder **"Play again"** on Discussion (calls `resetGame()`) | Rehaan deselected a reveal/pass restart but wants the loop's end to return to Setup without a refresh. Discussion is where the loop terminates, so the button lives there now (it was planned for that screen anyway). |
| Last-player advance label | Conditional: "Hide & pass to next player" for players `1…N-1`, "Hide & continue to discussion" for the last player | There is no player `N+1` after the final reveal, so a "pass to next player" label would be wrong; the last reveal goes straight to discussion. |
| SetupScreen "ready" mode | **Removed** (now unreachable) | Start navigates to `reveal`, so the old `playerCount !== null` confirmation branch is dead code. SetupScreen becomes editing-only. |

## How it fits the architecture

This completes the screen-based state machine the tech-stack plan describes. The setup plan set the data shape; this plan adds the **`screen` field** and the **routing layer**, plus the **per-player turn loop** that future phases (discussion, results) hang off.

```
screen: 'setup'    { playerCount:null, ..., roles:[], revealIndex:0 }
   │ Start → startGame(config)  (buildRoles + shuffle)
   ▼
screen: 'reveal'   revealIndex = 0   roles[0] shown (after flip)
   │ revealDone()  ── more players? ──► screen:'pass'
   ▼                                        │ nextPlayer() (revealIndex++)
screen: 'pass'  "Pass to Player N+1" ───────┘  ▲ loops back to 'reveal'
   │
   │ (after the LAST player's reveal, revealDone skips pass)
   ▼
screen: 'discussion'   ← terminal stub for this feature
```

Role array (e.g. 4 players, 1 impostor) after shuffle — `roles[i]` is player `i`:

```
[ {isImpostor:false}, {isImpostor:true}, {isImpostor:false}, {isImpostor:false} ]
   Player 1 (word)     Player 2 (IMP)      Player 3 (word)     Player 4 (word)
```

## Files this affects

| File | Change |
|---|---|
| `src/lib/shuffle.js` | Replace the stub with **Fisher–Yates (Durstenfeld)**. Still pure — copies the input, swaps in place on the copy, returns it. Note `Math.random` is fine for a party game (not cryptographic). |
| `src/lib/game-state.js` | Extend `initial` to `{ screen:'setup', playerCount:null, impostorCount:null, wordSource:null, word:null, roles:[], revealIndex:0 }`. Add internal `buildRoles(playerCount, impostorCount)` (imports `shuffle`). Add transitions: `startGame(config)` (builds roles, sets `screen:'reveal'`, `revealIndex:0`), `revealDone()` (→ `pass` or `discussion`), `nextPlayer()` (`revealIndex++`, → `reveal`). `resetGame()` returns to the `setup` initial. |
| `src/App.svelte` | Import all five screen components; replace `<SetupScreen />` with an `{#if $gameState.screen === '…'}` ladder (setup / reveal / pass / discussion / results). |
| `src/screens/SetupScreen.svelte` | `start()` now calls `startGame({...})` instead of `gameState.set(...)`. **Remove** the unreachable `{:else}` ready-mode block, `changeSettings()`, and the now-unused `resetGame` import; render the form unconditionally. |
| `src/screens/RevealScreen.svelte` | Build the real screen: read `revealIndex`, `playerCount`, `roles`, `word`; local `revealed=false`; face-down `Player N of M` + "Tap to reveal your role" → flips to the word card or impostor card → advance button calling `revealDone()`. **Label is conditional:** "Hide & pass to next player" when `revealIndex < playerCount - 1`, else "Hide & continue to discussion". |
| `src/screens/PassScreen.svelte` | Build the real screen: `Pass to Player {revealIndex+2} — tap when ready` + progress, button calls `nextPlayer()`. |
| `src/screens/DiscussionScreen.svelte` | Add a placeholder **"Play again"** button that imports and calls `resetGame()` (returns to Setup, clearing `roles`/`revealIndex`). The rest stays a stub — real discussion is a later feature. |

**Reused, not rebuilt:** the `app.css` tokens (`--accent`, `--success`, `--error`, `--bg-surface`, `--text-muted`), the existing `.screen` / `.start-btn` / `.secondary-btn` style patterns, and the `gameState` store + reactive-`$`-read conventions. `Stepper.svelte`, `config.js`, and `word-source.js` are untouched.

## What's deferred (out of scope)

- **Discussion & Results screens** — remain stubs. Discussion is just the loop's exit target here.
- **Restart mid-flow on Reveal/Pass** — deliberately no restart button during the reveal loop (Rehaan's choice). Restart becomes available once the loop ends, via the "Play again" button now on Discussion; mid-loop, a refresh is still the only reset.
- **Visual / design polish** — colors, card animation, the flip transition, icons (🎭 etc.). Functional styling only here; real design belongs in the `03-design` silo.
- **Impostor category hint, re-roll, player names** — the `{ isImpostor }` shape leaves room for hints later; players stay numbered, not named.
- **Offline caching** — unchanged from prior plans.

## Acceptance (what "done" looks like for the eventual build)

From `02-development/workflow/03-builds/imposter-game-app/`:

1. `npm run dev` — no console errors; setup screen behaves exactly as before (steppers, word-source chip, Start gating).
2. Press **Start** → RevealScreen for Player 1: shows `Player 1 of N` and a face-down "Tap to reveal your role"; the word/role is **not** visible yet.
3. Tap to reveal → a crewmate sees `THE WORD IS: "<word>"` + "You know the word…"; an impostor sees `YOU ARE THE IMPOSTOR!` + "You don't know the word…".
4. "Hide & pass to next player" → PassScreen showing `Pass to Player 2 — tap when ready`; the card is hidden.
5. Tap the pass screen → RevealScreen for Player 2, **face-down again** (flip reset on remount).
6. Continue to the last player: exactly `impostorCount` players see the impostor card and the rest see the word; impostor positions differ across runs (shuffle is real).
7. On the **last** player's reveal the advance button reads **"Hide & continue to discussion"** (not "…pass to next player") and goes **straight to the DiscussionScreen** (`screen='discussion'`) — no "Pass to Player N+1" after the final player.
8. On the DiscussionScreen, **"Play again"** returns to Setup at the defaults — `resetGame()` clears `roles`/`revealIndex` and sets `screen='setup'`, with no page refresh.
9. `npm run build` succeeds with no warnings; at a 375px viewport there's no horizontal scroll and all tap targets stay ≥44px.
10. Inspecting the store (temporary log / Svelte devtools): `roles.length === playerCount`, count of `isImpostor === true` equals `impostorCount`, `revealIndex` walks `0…playerCount-1`, and `screen` transitions `setup → reveal → pass → … → discussion`.

Verification is **manual** (`npm run dev` + a temporary store log / devtools, then `npm run build`) — the project has no automated test setup, consistent with prior features.

## Risks / open questions

- **Remount assumption.** Resetting the tap-to-reveal flip relies on the `{#if}` ladder destroying/recreating `RevealScreen` between players. If a later refactor keeps the component mounted, the `revealed` flag must instead reset reactively on `revealIndex` change. Documented so it isn't a silent regression.
- **Reveal/Pass have no mid-loop restart** *(by design)*. Once a game starts there's no way back to Setup until the loop ends and the Discussion "Play again" button appears; mid-loop, a refresh is the only reset. Intended for this increment. *(The earlier last-player-label and no-restart concerns are now resolved in the spec above: the advance label is conditional, and Discussion carries "Play again".)*
- **Randomness.** `Math.random` Fisher–Yates is unbiased and fine for a casual party game; it is not cryptographic. Bounds guarantee ≥1 impostor and ≥1 crewmate (players ≥3, impostors `1…players-1`), so there's no empty-array edge.

## Status

`final` — approved by Rehaan (2026-05-21). Brief derived from this plan lives at [02-development/workflow/01-brief/reveal-pass-screens-brief.md](../../02-development/workflow/01-brief/reveal-pass-screens-brief.md); it feeds a spec, then a build.

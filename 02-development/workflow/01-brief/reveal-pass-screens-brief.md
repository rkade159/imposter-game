# Brief — Reveal + Pass Screens (the Gameplay Loop)

## Source plan

[01-plan/plans/reveal-pass-screens-plan-final.md](../../../01-plan/plans/reveal-pass-screens-plan-final.md)

> ⚠️ **Before interpreting any reference screenshot, read [CORRECTIONS.md](../../../01-plan/references/examples-of-good-work/CORRECTIONS.md).** The screenshots show the functional flow but were intentionally deviated from during planning (two separate reveal/pass screens, tap-to-reveal, **no** "New Game" button on reveal, numbered players). `CORRECTIONS.md` **overrides** the images — don't "fix" this build to match them on those points.

## What to build

The **gameplay loop** — the feature that turns the committed setup config into an actual round and finally introduces **screen routing** to the app.

After **Start**, the app generates a shuffled per-player `roles` array and walks the device around the table: each player privately sees whether they hold the secret word (crewmate) or are the impostor, hands off through a neutral pass screen, and play continues until everyone has seen their role — then it lands on the (still-stubbed) discussion screen.

By the end of this build:

- `App.svelte` no longer renders `SetupScreen` directly. A `screen` field on `gameState` plus an `{#if}` ladder route between **Setup → Reveal → Pass → Discussion** (with a Results branch wired but not yet reached).
- `gameState` carries `{ screen, playerCount, impostorCount, wordSource, word, roles, revealIndex }`.
- `shuffle.js` is a real Fisher–Yates shuffle (no longer a passthrough stub).
- Pressing **Start** commits the config **and** navigates to the first player's reveal — the old SetupScreen "ready" mode is gone (it's unreachable once routing exists).
- A finished round can be restarted from the Discussion screen via a placeholder **"Play again"** button — no page refresh required.

## Why this is being built now

1. **It's the next unblocked step.** The setup features already put everything a round needs into `gameState` (`playerCount`, `impostorCount`, `wordSource`, `word`). The only thing missing is the logic that turns that config into roles and shows them to players. This is that logic.
2. **It lands the screen-routing pattern the project has been deferring.** The tech-stack and setup plans describe the game as a screen-based state machine; [App.svelte](../03-builds/imposter-game-app/src/App.svelte) even carries a comment anticipating the `{#if}` ladder, and the screen components + `shuffle.js` were scaffolded as stubs for exactly this feature. This build fills that scaffolding in.
3. **It makes the app playable end-to-end.** After this, a group can open the app, set up a game, pass the device around to learn their roles, and reach the discussion phase — the first time the app is actually usable as a game.

## Scope

**In scope:**

- **Real shuffle** — replace the [src/lib/shuffle.js](../03-builds/imposter-game-app/src/lib/shuffle.js) stub with a **Fisher–Yates (Durstenfeld)** implementation. Stays **pure**: copies the input and returns a new array, never mutates it (preserving the stub's documented contract).
- **State machine** — extend [src/lib/game-state.js](../03-builds/imposter-game-app/src/lib/game-state.js):
  - Initial shape becomes `{ screen: 'setup', playerCount: null, impostorCount: null, wordSource: null, word: null, roles: [], revealIndex: 0 }`.
  - `buildRoles(playerCount, impostorCount)` — builds a length-`playerCount` array where `impostorCount` entries are impostors and the rest crewmates, marked as `{ isImpostor }`, then shuffles it (uses `shuffle`). `roles[i]` is player `i`'s role.
  - Transitions as pure store writes: `startGame(config)` (builds roles, sets `screen: 'reveal'`, `revealIndex: 0`), `revealDone()` (→ `pass` if more players remain, else → `discussion`), `nextPlayer()` (`revealIndex++`, → `reveal`).
  - `resetGame()` returns the store to the `setup` initial (clears `roles`/`revealIndex`).
- **Routing** — [src/App.svelte](../03-builds/imposter-game-app/src/App.svelte): import the five screen components and replace `<SetupScreen />` with an `{#if $gameState.screen === '…'}` ladder (setup / reveal / pass / discussion / results). The header stays as-is.
- **SetupScreen** — [src/screens/SetupScreen.svelte](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte): `start()` now calls `startGame({ playerCount, impostorCount, wordSource, word })` instead of writing the store directly. **Remove** the now-unreachable `{:else}` ready-mode block, the `changeSettings()` function, and the unused `resetGame` import; render the editing form unconditionally.
- **RevealScreen** — [src/screens/RevealScreen.svelte](../03-builds/imposter-game-app/src/screens/RevealScreen.svelte): build the real screen reading `revealIndex`, `playerCount`, `roles`, `word`:
  - Shows **"Player {revealIndex + 1} of {playerCount}"**.
  - Starts **face-down** with a **"Tap to reveal your role"** prompt (local `revealed` flag, default `false`); a tap flips to the card.
  - Card: crewmate sees **`THE WORD IS: "{word}"`** + a "you know the word — help identify the impostors" line; impostor sees **`YOU ARE THE IMPOSTOR!`** + a "you don't know the word — blend in during discussion" line.
  - Advance button calls `revealDone()`. **Label is conditional:** **"Hide & pass to next player"** when `revealIndex < playerCount - 1`, else **"Hide & continue to discussion"** (the last player has no one to pass to).
- **PassScreen** — [src/screens/PassScreen.svelte](../03-builds/imposter-game-app/src/screens/PassScreen.svelte): build the real screen — **"Pass to Player {revealIndex + 2} — tap when ready"** (optionally a progress line), button calls `nextPlayer()`. The person who taps is the next player, so a card only ever appears after that player's own deliberate tap.
- **DiscussionScreen** — [src/screens/DiscussionScreen.svelte](../03-builds/imposter-game-app/src/screens/DiscussionScreen.svelte): add a placeholder **"Play again"** button that imports and calls `resetGame()` (returns to Setup). Everything else stays a stub.
- **Numbered players** throughout (Player N of M / Pass to Player N+1).
- **Mobile-responsive** — all tap targets stay ≥44px and there's no horizontal scroll at a 375px-wide viewport. Re-use the existing `app.css` tokens and the `.screen` / `.start-btn` / `.secondary-btn` style patterns.
- Code follows [technical-standards.md](../../references/technical-standards.md): plain and simple, no new dependencies, brief comments on new blocks.

**Out of scope (do NOT build here):**

- **Real discussion mechanics** (timer, voting) — `DiscussionScreen` stays a stub apart from "Play again". It's only the loop's exit target here.
- **Results screen content** — leave [ResultsScreen.svelte](../03-builds/imposter-game-app/src/screens/ResultsScreen.svelte) a stub. Its branch is wired into the ladder but isn't reached this feature; no "Play again" on it yet.
- **A restart button on Reveal or Pass** — deliberately none (Rehaan's choice). Restart is only offered once the loop ends, on Discussion.
- **Card-flip animation, theming, icons, visual polish** — design comes via the `03-design/` workspace later. Functional styling only.
- **Impostor category hint, word re-roll, player names** — the `{ isImpostor }` shape leaves room for a hint later; players stay numbered, not named.
- **localStorage persistence** and **offline caching of the word JSON** — the service worker is not modified.
- New dependencies of any kind.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`. No new files or top-level folders — every screen component and `shuffle.js` already exist as stubs. Files affected:

| File | Change |
|---|---|
| `src/lib/shuffle.js` | Replace stub with Fisher–Yates (Durstenfeld); still pure (returns a new array). |
| `src/lib/game-state.js` | Extend `initial` with `screen`, `roles`, `revealIndex`; add `buildRoles()`, `startGame()`, `revealDone()`, `nextPlayer()`; `resetGame()` returns to the `setup` initial. |
| `src/App.svelte` | Import the five screens; replace `<SetupScreen />` with the `{#if $gameState.screen}` ladder. |
| `src/screens/SetupScreen.svelte` | `start()` → `startGame(...)`; remove the unreachable ready-mode block, `changeSettings()`, and the unused `resetGame` import. |
| `src/screens/RevealScreen.svelte` | Tap-to-reveal flip, "Player N of M", crewmate/impostor cards, conditional advance label → `revealDone()`. |
| `src/screens/PassScreen.svelte` | "Pass to Player N+1 — tap when ready" → `nextPlayer()`. |
| `src/screens/DiscussionScreen.svelte` | Add a placeholder "Play again" button → `resetGame()`. |

## Constraints worth highlighting

- Per [technical-standards.md](../../references/technical-standards.md): *"plainly and simply as possible"*, *"prefer standard library solutions over third-party packages"*, *"add comments to the code whenever you are coding a new code block"*. **No new dependencies** — `Math.random`-based Fisher–Yates is fine for a casual party game (it is not, and need not be, cryptographic).
- **The secret word stays secret.** It is shown only on a **crewmate's own reveal**, after they flip the card. The impostor never sees the word, and the pass screen shows no role information.
- **Transitions live in `game-state.js`**, screens are pure reactive reads — consistent with the pattern the setup features established. `revealIndex` is store state, not component-local.
- **Conditional last-player label is required**, not optional: the advance button must not read "pass to next player" on the final reveal (there is no next player; it goes to discussion).
- **Flip-reset depends on remount.** The `{#if}` ladder destroys/recreates `RevealScreen` between players, which resets the local `revealed` flag to face-down each turn. If the build keeps the component mounted instead, it must reset `revealed` reactively on `revealIndex` change — otherwise the next player would see the previous card already flipped (a privacy bug).
- **Guarantees from setup bounds:** players ≥ 3 and impostors `1…players-1`, so `roles` always has ≥1 impostor and ≥1 crewmate — no empty-array edge to handle.
- Works on modern browsers (Chrome, Firefox, Safari latest). Mobile-responsive — verify at 375px.

## Next step

This brief feeds `02-development/workflow/02-specs/reveal-pass-screens-spec.md`, which converts it into an acceptance-criteria contract for the build.

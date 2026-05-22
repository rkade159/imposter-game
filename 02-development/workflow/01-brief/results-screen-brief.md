# Brief — Results Screen (Reveal + Play Again)

## Source plan

[01-plan/plans/results-screen-plan-final.md](../../../01-plan/plans/results-screen-plan-final.md)

> ⚠️ **If you open any reference screenshot, read [CORRECTIONS.md](../../../01-plan/references/examples-of-good-work/CORRECTIONS.md) first.** It records intentional deviations from the images and **overrides** them. Note there is no Results-screen screenshot — Results is specified by this brief, not by an image.

## What to build

The **Results screen** — the payoff that ends a round — plus the small rewiring of **Discussion** that leads into it.

Today the loop dead-ends on Discussion, which holds a placeholder **"Play again"** button, and [ResultsScreen.svelte](../03-builds/imposter-game-app/src/screens/ResultsScreen.svelte) is an unreached stub. After this build:

- **Discussion** drops "Play again" and the "coming soon" placeholder, and gains a **"Reveal the imposter(s)"** button that, after a **confirmation step**, routes to Results.
- **Results** names the imposter(s) **by player number**, shows the **secret word**, and offers **"Play again"**.
- **"Play again"** lives on Results now and returns to **Setup with the previous round's settings pre-filled** (player count, imposter count, word source) — a fresh word is picked on the next Start.
- Every user-facing mention of the role is spelled **"imposter"** (not "impostor"), including the existing copy on RevealScreen.

`App.svelte` is **not** touched — the `results` branch is already wired into the routing ladder.

## Why this is being built now

1. **It completes the core loop.** Setup, the reveal/pass loop, and Discussion all exist; the one missing piece is an actual ending. Without it, a round just stops with no reveal of the answer.
2. **The scaffold is already there.** `ResultsScreen.svelte` exists as a stub and its route is wired but never reached. This build fills it in — no new files, no routing changes.
3. **It makes the game replayable in a sitting.** "Play again" preserving settings means the same group can run round after round without re-entering setup each time.

## Scope

**In scope:**

- **State machine** — extend [src/lib/game-state.js](../03-builds/imposter-game-app/src/lib/game-state.js) with two pure store-write transitions:
  - `showResults()` → sets `screen: 'results'`.
  - `playAgain()` → returns to `screen: 'setup'` **preserving** `playerCount`, `impostorCount`, `wordSource`, and **clearing** `roles`, `revealIndex`, `word`.
  - Leave `resetGame()` in place as the hard reset (now unreferenced in the UI — **keep it**, the future Settings menu will use it). Correct its now-stale comment.
- **DiscussionScreen** — [src/screens/DiscussionScreen.svelte](../03-builds/imposter-game-app/src/screens/DiscussionScreen.svelte):
  - Remove the `resetGame` import, the **"Play again"** button, and the "(Discussion timer & voting coming soon.)" placeholder line.
  - Keep the discuss prompt. Add a primary button: **"Reveal the imposter"** when `impostorCount === 1`, **"Reveal the imposters"** when `> 1`.
  - **Confirmation guard:** a local `confirming` flag (same pattern as `RevealScreen`'s `revealed`). Tapping Reveal sets `confirming = true`, showing *"Reveal the answer? This ends the round."* with **Confirm** (→ `showResults()`) and **Cancel** (→ `confirming = false`). Keep the confirm step a clean, separable block — a future Settings toggle will gate it.
- **ResultsScreen** — [src/screens/ResultsScreen.svelte](../03-builds/imposter-game-app/src/screens/ResultsScreen.svelte): build the real screen reading `roles`, `word`, `impostorCount`:
  - Derive imposter player numbers from `roles` (the index `i` of each `{ isImpostor: true }` entry, shown as player `i + 1`).
  - Render the imposter line, pluralised: *"The imposter was Player 3"* / *"The imposters were Player 2 and Player 5"* (join multiple readably, e.g. comma-separated with "and" before the last).
  - Render the secret word: *The word was "{word}".*
  - A **"Play again"** button → `playAgain()`.
- **SetupScreen** — [src/screens/SetupScreen.svelte](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte): seed the editing fields `players` / `impostors` / `selectedSource` from the current `gameState` values **when present** (read once at init via `get(gameState)`), falling back to `DEFAULT_PLAYERS` / `DEFAULT_IMPOSTORS` / `DEFAULT_WORD_SOURCE`. The existing `onMount` word-load already keys off `selectedSource`, so a preserved source loads automatically.
- **Spelling normalisation** — [src/screens/RevealScreen.svelte](../03-builds/imposter-game-app/src/screens/RevealScreen.svelte): change the user-facing **"YOU ARE THE IMPOSTOR!"** and the "help identify the impostors" line to the **"imposter"** spelling. Copy-only, no logic change. Use **"imposter"** for all new user-facing text on Discussion and Results too.
- **Mobile-responsive** — tap targets ≥44px, no horizontal scroll at 375px. Re-use the existing `app.css` tokens and the `.screen` / `.play-again-btn` / button style patterns.
- Code follows [technical-standards.md](../../references/technical-standards.md): plain and simple, no new dependencies, brief comments on new blocks.

**Out of scope (do NOT build here):**

- **Settings menu** — the toggle for the confirmation guard and a "reset to defaults" action are a *later* feature. Just build the confirm step so it's easy to gate later; don't add settings UI now.
- **Real discussion mechanics** (timer, voting) — Discussion stays a stub apart from the discuss prompt + the reveal button.
- **Renaming code identifiers `isImpostor` / `impostorCount`** to the "imposter" spelling — leave the identifiers as they are. Only user-facing *text* changes spelling this build.
- **Per-player breakdown, vote tallies, win/lose scoring, player names** — Results shows only the imposter(s) + the word.
- **Card animation, theming, icons, visual polish** — design comes via `03-design/` later. Functional styling only.
- **`App.svelte` changes** — the results route already exists; don't touch routing.
- New dependencies of any kind.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`. No new files — every screen and `game-state.js` already exist. Files affected:

| File | Change |
|---|---|
| `src/lib/game-state.js` | Add `showResults()` and `playAgain()` (preserve settings, clear round data). Keep `resetGame()`; fix its stale comment. |
| `src/screens/DiscussionScreen.svelte` | Remove "Play again" + `resetGame` import + "coming soon" line. Add `confirming` flag, the "Reveal the imposter(s)" button (pluralised), and the Confirm/Cancel step. |
| `src/screens/ResultsScreen.svelte` | Build it: imposter player numbers + secret word + "Play again" → `playAgain()`. |
| `src/screens/SetupScreen.svelte` | Seed `players`/`impostors`/`selectedSource` from `gameState` when set, else `DEFAULT_*`. |
| `src/screens/RevealScreen.svelte` | Copy-only: "impostor" → "imposter" in user-facing strings. |

## Constraints worth highlighting

- Per [technical-standards.md](../../references/technical-standards.md): *"plainly and simply as possible"*, *"prefer standard library solutions over third-party packages"*, *"add comments to the code whenever you are coding a new code block"*. **No new dependencies.**
- **Spelling is "imposter", not "impostor", in all user-facing text** — this is now a recorded standard (see technical-standards.md and design-system.md). Internal identifiers (`isImpostor`, `impostorCount`) stay as-is for this build.
- **Transitions live in `game-state.js`**; screens are pure reactive reads — consistent with the established pattern. Don't write the store directly from screens.
- **`playAgain()` preserves settings but NOT the word.** The word must be re-picked on the next Start (it already is — `SetupScreen.start()` calls `pickWord(words)`), so a re-run with the same settings still gets a fresh word.
- **Confirmation guard stays** (Rehaan's choice) — don't optimise it away as an extra tap. Build it as a separable step for the future Settings toggle.
- **Setup seeding reads `gameState` once at init.** Fine, because the `{#if}` ladder remounts `SetupScreen` on every return to setup. If a later refactor keeps it mounted, the seed must become a reactive re-read.
- **Guarantees from setup bounds:** players ≥ 3 and imposters `1…players-1`, so `roles` always has ≥1 imposter and ≥1 crewmate — no empty-list edge on Results.
- Works on modern browsers (Chrome, Firefox, Safari latest). Mobile-responsive — verify at 375px.

## Next step

This brief feeds `02-development/workflow/02-specs/results-screen-spec.md`, which converts it into an acceptance-criteria contract for the build.

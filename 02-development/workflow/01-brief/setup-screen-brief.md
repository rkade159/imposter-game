# Brief — Setup Screen (Player Count + Start)

## Source plan

[01-plan/plans/setup-screen-plan-final.md](../../../01-plan/plans/setup-screen-plan-final.md)

## What to build

The first **game-logic** feature for the Imposter Game web app: a working **Setup screen** that lets the user pick how many people are playing and press Start, plus the foundational `gameState` store that every later screen will read from.

Pressing **Start Game** does **not** transition to another screen. The reveal screen is still a stub, so the same SetupScreen instead switches into a **"ready"** mode showing a confirmation message and a "Change settings" button. The actual screen-routing wires up when the reveal screen is built.

By the end of this build:
- A user opening the app sees the Setup screen instead of the current "Scaffold ready" placeholder.
- They can adjust player count (3–12, default 6) using a typeable number field with `−` / `+` stepper buttons.
- Pressing Start commits the count to `gameState` and the screen switches to the ready confirmation.
- Pressing "Change settings" resets state and returns to the editing view.

## Why this is being built now

Three reasons:

1. **Every other screen depends on it.** Reveal, pass, discussion, and results all read from `gameState`. Without a real shape for that store, none of them can start.
2. **It validates the state-machine pattern.** The tech-stack plan describes the game as a screen-based state machine driven by a single Svelte store. This is the first concrete use of that pattern — getting it right here sets the template for every later screen.
3. **It replaces the placeholder home.** Right now [src/App.svelte](../../03-builds/imposter-game-app/src/App.svelte) shows "Scaffold ready." This brief swaps in a real, useful screen so the app does *something* on load.

## Scope

**In scope:**

- A new `src/lib/config.js` exporting `MIN_PLAYERS = 3`, `MAX_PLAYERS = 12`, `DEFAULT_PLAYERS = 6`. Bounds live here so a later widening is a one-file edit.
- Replace the [src/lib/game-state.js](../../03-builds/imposter-game-app/src/lib/game-state.js) stub with a real store. Initial shape: `{ playerCount: null }`. Export a `resetGame()` helper that returns the store to its initial state.
- Replace the [src/screens/SetupScreen.svelte](../../03-builds/imposter-game-app/src/screens/SetupScreen.svelte) placeholder with a two-mode UI driven by `$gameState.playerCount`:
  - **Editing mode** (`playerCount === null`): label "Total Players:", `−` button, typeable `<input type="number">` defaulting to `DEFAULT_PLAYERS`, `+` button, and a "Start Game" button.
  - **Ready mode** (`playerCount !== null`): the confirmation text "Game ready for {N} players — reveal screen coming soon." and a "Change settings" button that calls `resetGame()`.
- Wire [src/App.svelte](../../03-builds/imposter-game-app/src/App.svelte) to render `<SetupScreen />` in place of the current "Scaffold ready" placeholder body. The global header stays as-is for now.
- Stepper-button behaviour: `−` disabled at `MIN_PLAYERS`, `+` disabled at `MAX_PLAYERS`. Typed values are clamped to `[MIN, MAX]` on Start. Start button is disabled while the input is empty or out of bounds.
- Mobile-responsive — the stepper buttons must remain tappable at a 375px-wide viewport.
- Code follows [02-development/references/technical-standards.md](../../references/technical-standards.md) — plain and simple, no extra dependencies, brief comments on new blocks.

**Out of scope (do NOT build here):**

- Impostor count input (separate future feature).
- Word source / category picker (separate future feature).
- "How to Play" instructions panel from the reference screenshot.
- Routing between multiple screens — the SetupScreen handles both its modes itself. A `screen` field in `gameState` and an `{#if}` ladder in `App.svelte` land when the reveal screen is built.
- localStorage persistence of the last-used player count.
- Visual polish, theming, animations — design comes via the `03-design/` workspace later.
- Validation error messages beyond simply disabling Start.
- New dependencies of any kind.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`. No new top-level folders. Files affected:

| File | Change |
|---|---|
| `src/lib/game-state.js` | Replace stub with real initial shape + `resetGame()`. |
| `src/lib/config.js` | **New file.** Exports `MIN_PLAYERS`, `MAX_PLAYERS`, `DEFAULT_PLAYERS`. |
| `src/screens/SetupScreen.svelte` | Replace placeholder with the editing/ready two-mode UI. |
| `src/App.svelte` | Render `<SetupScreen />` in place of the placeholder body. |

## Constraints worth highlighting

- Per [technical-standards.md](../../references/technical-standards.md): *"plainly and simply as possible"*, *"prefer standard library solutions over third-party packages when equivalent"*, *"add comments to the code whenever you are coding a new code block"*. No extra dependencies.
- Per the visual baseline already in [src/app.css](../../03-builds/imposter-game-app/src/app.css): dark default, Inter / system sans-serif, 16px minimum body text, 24px container padding. Re-use existing CSS tokens (`--bg-surface`, `--text-muted`, etc.) where they fit.
- Works on modern browsers (Chrome, Firefox, Safari latest). Mobile-responsive — verify on a 375px-wide viewport.
- The "ready" mode is **derived from `playerCount !== null`**, not a separate `status` or `screen` field. Don't pre-design fields the next feature hasn't asked for.

## Next step

This brief feeds `02-development/workflow/02-specs/setup-screen-spec.md`, which converts it into an acceptance-criteria contract for the build.

# Setup Screen Plan — Player Count + Start (Final)

## Why this plan exists

This is the **first game-logic feature** for the Imposter Game web app. The Vite + Svelte + PWA scaffold is complete, but every screen file under `02-development/workflow/03-builds/imposter-game-app/src/screens/` is still a placeholder and `src/lib/game-state.js` is an empty store. Because every later screen (reveal, pass, discussion, results) will read from `gameState`, this feature has to land two things at once:

1. A working **Setup screen** that lets the user pick a player count and press Start.
2. The **state-machine foundation** every later screen plugs into — a real shape for the `gameState` store plus a `resetGame()` helper.

Scope is deliberately narrow: **just player count + start**. The reference at `01-plan/references/examples-of-good-work/main-screen.png` shows the eventual full setup screen (impostor count, word source, "How to Play"). Those land as their own feature plans later.

## The feature

A single screen with two modes, driven entirely by whether `gameState.playerCount` is set:

- **Editing mode** (`playerCount === null`): the user picks how many people are playing using a typeable number field with `−` / `+` stepper buttons. Press "Start Game" to commit.
- **Ready mode** (`playerCount !== null`): the screen shows "Game ready for N players — reveal screen coming soon." with a "Change settings" button to go back to editing.

Pressing "Start Game" does **not** transition to another screen yet — the reveal screen is still a stub. The state-machine routing wires up as part of the reveal-screen feature plan.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Start action | Stay on SetupScreen, switch to a "ready" mode | The reveal screen isn't built. Trying to "transition" with nowhere to go would be misleading. Ready mode confirms state was captured and is a natural breakpoint. |
| Player count bounds | 3–12, default 6 | 3 is the lowest meaningful game (1 impostor + 2 crewmates). 12 covers typical party-game group sizes. Matches the reference screenshot's default. |
| Where bounds live | A new `src/lib/config.js` module exporting `MIN_PLAYERS`, `MAX_PLAYERS`, `DEFAULT_PLAYERS` | One-file edit later if we decide to widen the range, instead of hunting through screens. |
| State shape | Minimal: `{ playerCount }` + a `resetGame()` helper | Don't pre-design fields (impostorCount, word, roles…) before we know exactly what each future feature needs. Add fields as features land. |
| Ready → edit affordance | An explicit "Change settings" button calling `resetGame()` | Discoverable. No magic — pressing it is the only way back. |
| Input control | Typeable `<input type="number">` flanked by `−` / `+` stepper buttons | Works on phone (tap steppers) and desktop (type directly). The reference screenshot is keyboard-only; steppers add touch-friendliness without removing anything. |
| Persistence | None — fresh state on each page load | The tech-stack plan mentions localStorage for settings but doesn't require it now. Defer to a dedicated "settings persistence" feature later. |

## How it fits the architecture

The tech-stack plan describes the game as a screen-based state machine driven by a single Svelte store. This feature is the first concrete step in building that machine:

```
gameState = { playerCount: null }              ← initial (editing mode)
   ↓ user presses Start
gameState = { playerCount: 6 }                 ← ready mode
   ↓ user presses Change settings
gameState = { playerCount: null }              ← back to editing (resetGame)
```

Later features extend the shape — adding `screen`, `impostorCount`, `word`, `roles`, `currentPlayerIndex`, etc. — but the pattern is set here: state lives in `gameState`, transitions are pure writes to the store, and screens read from it reactively.

## Files this affects

| File | Change |
|---|---|
| `src/lib/game-state.js` | Replace `writable(null)` stub with the real initial shape `{ playerCount: null }` and export a `resetGame()` helper. |
| `src/lib/config.js` | **New.** Exports `MIN_PLAYERS`, `MAX_PLAYERS`, `DEFAULT_PLAYERS`. |
| `src/screens/SetupScreen.svelte` | Replace the placeholder with the editing/ready two-mode UI. |
| `src/App.svelte` | Replace the "Scaffold ready" placeholder body with `<SetupScreen />`. No router yet — there's only one active screen. |

No other files touched. No new dependencies.

## What's deferred (out of scope)

These are real features but each gets its own plan:

- **Impostor count input** — the second numeric input from the reference screenshot.
- **Word source / category picker** — the dropdown + "Loaded 644 common nouns" confirmation.
- **"How to Play" instructions panel** — the static instructions block at the top of the reference screenshot.
- **Routing between screens** — wired when the reveal screen is built (it'll add a `screen` field to `gameState` and an `{#if}` ladder in `App.svelte`).
- **localStorage persistence** — remembering the last-used player count across reloads.
- **Visual design / theming / animations** — pulled in via the `03-design/` workspace once functionality is settled.
- **Validation error messages** — beyond simply disabling the Start button when input is invalid.

## Acceptance (what "done" looks like for the eventual build)

Once this plan becomes a brief, then a spec, then code, the build should pass this walk-through:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev` — dev server starts, no console errors.
2. Browser shows the Setup screen with player count defaulting to **6**, `−` and `+` stepper buttons, and a "Start Game" button enabled.
3. `−` decrements down to **3** then disables. `+` increments up to **12** then disables.
4. Typing `99` and pressing Start clamps the committed value to 12. Clearing the input disables Start.
5. Pressing Start switches to the ready view: "Game ready for {N} players — reveal screen coming soon." with a "Change settings" button.
6. "Change settings" returns to the editing view at the default value.
7. `npm run build` succeeds with no warnings.
8. At a 375px-wide viewport, the screen renders without horizontal scroll and the stepper buttons remain tappable.

## Risks / open questions

- **Number-input quirks on mobile.** `<input type="number">` has known UX rough edges on some mobile browsers (no native max-length, scroll-wheel changes value when focused). The stepper buttons compensate, but the build phase should sanity-check on a real phone.
- **Where the "Imposter Game" heading lives.** Currently `App.svelte` renders a global `<header>` with the title. The reference screenshot shows the title inside the setup card. This plan keeps the global header for now; revisit at design stage.

## Status

`final` — approved by Rehaan. Brief derived from this plan lives at `02-development/workflow/01-brief/setup-screen-brief.md`.

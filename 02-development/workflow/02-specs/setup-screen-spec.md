# Spec — Setup Screen (Player Count + Start)

## Source brief

[02-development/workflow/01-brief/setup-screen-brief.md](../01-brief/setup-screen-brief.md)

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a **contract, not a blueprint**. It says WHAT must be true once the feature is built. It does NOT dictate exact DOM markup, class names, or component decomposition — the builder makes those calls within the constraints below.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

Four files are affected:

| File | State after build |
|---|---|
| `src/lib/config.js` | **New file.** Exports the player-count constants. |
| `src/lib/game-state.js` | Real store with shape `{ playerCount: null }` and a `resetGame()` export. |
| `src/screens/SetupScreen.svelte` | Two-mode UI (editing / ready) driven by `$gameState.playerCount`. |
| `src/App.svelte` | Renders `<SetupScreen />` in the main body in place of the "Scaffold ready" placeholder. |

No other files (including `package.json`, `vite.config.js`, the service worker, or any other screen stub) may be modified by this build.

## Acceptance criteria

A build is "done" when **every** item below is true. Verify each before considering the work complete.

### Config module

1. **`src/lib/config.js` exists** and exports three constants exactly: `MIN_PLAYERS` (value `3`), `MAX_PLAYERS` (value `12`), `DEFAULT_PLAYERS` (value `6`).
2. **No other exports** from `config.js`. Bounds-only.

### Game state

3. **`gameState` initial value** is `{ playerCount: null }`. Importing the store and inspecting its current value before any user interaction yields exactly that object shape.
4. **`resetGame()` is exported** from `src/lib/game-state.js` and, when called, sets the store back to `{ playerCount: null }`.
5. **No other state fields** are added to the initial shape (no `screen`, `status`, `impostorCount`, `word`, `roles`, `currentPlayerIndex`, etc.). The ready-vs-editing distinction is derived from `playerCount !== null`.

### Setup screen — editing mode

The setup screen is in editing mode whenever `$gameState.playerCount === null`. In this mode:

6. **A label "Total Players:"** is visible above the input control.
7. **A numeric input control** is visible. It supports both:
   - Typing a number directly (i.e. it accepts keyboard input).
   - Pressing a `−` button to decrement and a `+` button to increment.
8. **Default value** shown in the input is `DEFAULT_PLAYERS` (6) on first load.
9. **Stepper bounds:** the `−` button is disabled (visually and functionally) when the current value equals `MIN_PLAYERS`. The `+` button is disabled when the current value equals `MAX_PLAYERS`.
10. **A "Start Game" button** is visible.
11. **Start button disabling:** Start is disabled while the input value is empty, non-numeric, or outside `[MIN_PLAYERS, MAX_PLAYERS]`. It is enabled otherwise.
12. **Start commits state.** Pressing Start (when enabled per criterion 11) sets `gameState` to `{ playerCount: <input value> }`. Because Start is disabled outside `[MIN_PLAYERS, MAX_PLAYERS]`, no Start press can ever produce an out-of-range `playerCount`.

### Setup screen — ready mode

The setup screen is in ready mode whenever `$gameState.playerCount !== null`. In this mode:

13. **Confirmation text** is visible reading exactly: `Game ready for {N} players — reveal screen coming soon.` where `{N}` is the committed `playerCount`.
14. **A "Change settings" button** is visible. Pressing it calls `resetGame()` and the screen returns to editing mode with the default value shown again.
15. **Editing-mode controls are not visible** in ready mode (no input, no stepper buttons, no Start button).

### Root wiring

16. **`App.svelte` renders `<SetupScreen />`** in its main body. The existing global `<header>` with "Imposter Game" + tagline is preserved unchanged.
17. **No new top-level header, container, or layout components.** The existing `.app-shell` container remains the outer wrapper.

### Look and feel (baseline only — design comes later)

18. **Uses existing CSS tokens** from `app.css` (`--bg`, `--bg-surface`, `--text`, `--text-muted`, `--accent`, etc.) for colours rather than introducing new ones.
19. **No hard-coded font family** — inherits Inter / system sans-serif from the global stylesheet.
20. **Touch targets** for `−`, `+`, Start, and Change settings buttons are at least 40px × 40px on a 375px-wide viewport.
21. **Renders without horizontal scroll** on a 375px-wide viewport.
22. **No console errors or warnings** during dev or in the built preview.

### Code quality

23. **No new dependencies.** `package.json` is unchanged.
24. **Plain and simple.** No utility libraries, no CSS frameworks, no state-management libraries beyond Svelte's built-in stores.
25. **Brief explanatory comments** on each new code block, per [technical-standards.md](../../references/technical-standards.md). Don't comment trivial lines, but do comment the *why* on each new function, store, or non-obvious UI block.
26. **Production build succeeds.** Running `npm run build` from the project root completes with no errors and no new warnings introduced by these changes.

## What is NOT acceptance criteria (deferred)

These are explicitly **not** required for this build to be considered done:

- Impostor count, word source, "How to Play" panel
- Routing between multiple screens (the screen state machine — comes with the reveal-screen feature)
- localStorage persistence of last-used settings
- Visual polish, theming toggle, animations, custom icons
- Validation error messages beyond disabling Start
- TypeScript migration, test framework, lint config

## Verification

Manual smoke-test sequence the builder (or a reviewer) walks through end-to-end:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`
2. Open the served URL. The Setup screen appears below the existing "Imposter Game" header. No console errors.
3. The input shows `6`. Press `−`: value becomes `5`, `4`, `3` — then `−` disables.
4. Press `+` repeatedly up to `12`, then `+` disables.
5. Type `99` into the input. The Start button becomes disabled (value out of range). Clear the field and type `5`. Start re-enables. Press Start: the screen switches to ready mode with text "Game ready for 5 players — reveal screen coming soon."
6. Press "Change settings". The screen returns to editing mode with value `6` shown.
7. Clear the input (delete all digits). Both the Start button and the `−` / `+` stepper buttons disable. Typing a valid number re-enables the appropriate controls.
8. Resize browser to 375px width. No horizontal scroll. All buttons remain tappable.
9. Stop the dev server. Run `npm run build`. Build succeeds with no new errors or warnings.

If any one of criteria 1–26 fails, the build is not yet done.

## Open questions for the builder

- **Component decomposition.** The builder may extract a `<NumberStepper />` component if it improves clarity, but is not required to. A single `SetupScreen.svelte` file is acceptable.
- **Reactive primitive.** The existing `game-state.js` stub uses `writable` from `svelte/store`. The builder may keep that or switch to Svelte 5 runes (`$state`) — either is acceptable so long as the public surface (`gameState` store-like value + `resetGame()` function) is preserved.

# Spec — Impostor Count + Word Source

## Source brief

[02-development/workflow/01-brief/impostor-count-and-word-source-brief.md](../01-brief/impostor-count-and-word-source-brief.md)

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a **contract, not a blueprint**. It says WHAT must be true once the feature is built — observable behaviour and the public surfaces other code depends on. It does NOT dictate exact DOM markup, class names, or CSS; the builder makes those calls within the constraints below. (The one structural requirement is the reusable stepper component — see criteria 13–15 — because reuse is an explicit goal.)

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

Files this build creates or modifies:

| File | State after build |
|---|---|
| `src/lib/config.js` | Existing player constants **plus** `MIN_IMPOSTORS` and `DEFAULT_IMPOSTORS`. |
| `src/lib/game-state.js` | Store with the four-field initial shape and a `resetGame()` export. |
| `src/lib/word-source.js` | Real implementation: `WORD_SOURCES`, `DEFAULT_WORD_SOURCE`, `loadWords()`, `pickWord()`. |
| `public/data/common-nouns.json` | **New file.** Flat array of noun strings. The existing `public/data/.gitkeep` may be removed. |
| `src/components/Stepper.svelte` | **New file (required).** A reusable labelled `−` / input / `+` stepper used by *both* count controls. |
| `src/screens/SetupScreen.svelte` | Both counts rendered via `Stepper`; gains the word-source dropdown and load confirmation/error; `start()` and ready mode extended. |

Files that must **not** be modified by this build: `src/lib/shuffle.js`, `src/App.svelte`, `src/service-worker.js`, `vite.config.js`, `package.json`, `index.html`, `src/app.css`, and the other screen stubs (`RevealScreen`, `PassScreen`, `DiscussionScreen`, `ResultsScreen`).

## Acceptance criteria

A build is "done" when **every** item below is true. Verify each before considering the work complete.

### Config module

1. **`src/lib/config.js` additionally exports** `MIN_IMPOSTORS` (value `1`) and `DEFAULT_IMPOSTORS` (value `1`). The existing `MIN_PLAYERS`, `MAX_PLAYERS`, `DEFAULT_PLAYERS` are unchanged.
2. **No `MAX_IMPOSTORS` constant.** The maximum impostor count is derived at runtime as `playerCount − 1`.

### Game state

3. **`gameState` initial value** is exactly `{ playerCount: null, impostorCount: null, wordSource: null, word: null }`.
4. **`resetGame()` is exported** from `src/lib/game-state.js` and, when called, sets the store back to that exact initial shape.
5. **No other state fields** are added (no `screen`, `status`, `roles`, `currentPlayerIndex`, or a stored word list). The ready-vs-editing distinction stays derived from `playerCount !== null`.

### Word-source module (`src/lib/word-source.js`)

6. **`WORD_SOURCES` is exported** — a non-empty array. Each entry has at least `id`, `label`, `file`, and `countNoun` (all strings). It includes an entry with `id: 'common-nouns'`, `label: 'Common Nouns (Auto-loaded)'`, `file: 'common-nouns.json'`, `countNoun: 'common nouns'`.
7. **`DEFAULT_WORD_SOURCE` is exported** and equals the `id` of an entry in `WORD_SOURCES` (the common-nouns id).
8. **`loadWords(sourceId)` is exported, async**, and: looks up the source by id, fetches `${import.meta.env.BASE_URL}data/<file>`, and resolves to an **array of strings**. On a non-OK HTTP response, a parse failure, or an unknown `sourceId`, it **throws / rejects** — it must not silently resolve to `[]`.
9. **`pickWord(words)` is exported and pure** — returns one element of the passed array, does not mutate it. For a non-empty array it returns a member of that array.
10. **`loadWords(DEFAULT_WORD_SOURCE)` resolves to a non-empty array** (the real contents of `common-nouns.json`).

### Word data file

11. **`public/data/common-nouns.json` exists**, is valid JSON, and is a **flat array of lowercase, non-empty strings** with length of at least ~200 (a few hundred is the target).
12. **Contents are common, concrete, family-friendly nouns** — no proper nouns, no offensive or unsafe terms. (Quality bar, reviewer's judgement.)

### Reusable stepper component (`src/components/Stepper.svelte`)

13. **`src/components/Stepper.svelte` exists** and renders a labelled control: a `−` button, a typeable numeric input, and a `+` button. It accepts at least a label, the current value, a minimum, and a maximum as inputs, and propagates value changes back to its parent (via `bind:value`, a callback prop, or an event — builder's choice).
14. **Both count controls use it.** Total Players **and** Number of Impostors in `SetupScreen.svelte` are rendered with this `Stepper` component. The stepper markup/logic is **not** duplicated inline in `SetupScreen.svelte`.
15. **Bounds are enforced by the component:** the `−` button is disabled when the value equals the supplied minimum; the `+` button is disabled when the value equals the supplied maximum.

### Setup screen — editing mode (`playerCount === null`)

16. **Total Players** renders via `Stepper` with min `MIN_PLAYERS`, max `MAX_PLAYERS`, default `DEFAULT_PLAYERS` (6) — unchanged behaviour from the current setup screen.
17. **Number of Impostors** renders via `Stepper` with min `MIN_IMPOSTORS` (1), max `playerCount − 1` (the live player-count value being edited), default `DEFAULT_IMPOSTORS` (1).
18. **Auto-clamp:** lowering the player count so the current impostor count would exceed `playerCount − 1` reduces the impostor count to `playerCount − 1`. This produces **no console error or warning** and no infinite reactive loop.
19. **"Word Source:" label and a `<select>`** are visible. Options are sourced from `WORD_SOURCES` (their `label`s), and the initial selection is `DEFAULT_WORD_SOURCE`.
20. **Words load automatically on mount** for the selected source. On success, a confirmation is visible reading **`Loaded {N} {countNoun}`** where `{N}` is the actual loaded count and `{countNoun}` comes from the source (e.g. "Loaded 644 common nouns"). A leading success marker (e.g. ✓) is encouraged but not required.
21. **Load failure is surfaced:** if `loadWords` rejects, a visible error message is shown and `Start` remains disabled.
22. **Changing the dropdown re-loads** the newly selected source (a no-op re-selection of the only current source must not break the screen).

### Setup screen — Start behaviour

23. **Start gating:** `Start` is disabled unless **all** of these hold — player count is in `[MIN_PLAYERS, MAX_PLAYERS]`, impostor count is in `[1, playerCount − 1]`, and words have loaded successfully (count > 0).
24. **Start commits full state.** Pressing `Start` (when enabled) sets `gameState` to `{ playerCount, impostorCount, wordSource, word }` where `wordSource` is the selected source id and `word` is a random member of the loaded list (via `pickWord`). Because Start is gated by criterion 23, no commit can produce an invalid count or a null/empty `word`.

### Setup screen — ready mode (`playerCount !== null`)

25. **Confirmation text** echoes both the committed player count and impostor count (e.g. "Game ready for 6 players, 1 impostor — reveal screen coming soon."). Exact wording is the builder's, but it must state both counts.
26. **The secret word is never rendered** anywhere on the setup screen, in either mode. (Showing it would spoil the game.)
27. **"Change settings" button** is visible; pressing it calls `resetGame()`, returns to editing mode with defaults (players 6, impostors 1), and the word source loads again.
28. **Editing-mode controls are not visible** in ready mode (no inputs, steppers, dropdown, or Start button).

### Look and feel (baseline only — design comes later)

29. **Uses existing `app.css` tokens** for colour. The loaded confirmation uses `--success` and the error message uses `--error`; no new colour values are introduced.
30. **Touch targets** for the steppers, dropdown, `Start`, and "Change settings" are at least 40px × 40px on a 375px-wide viewport.
31. **No horizontal scroll** on a 375px-wide viewport.
32. **No console errors or warnings** during dev or in the built preview — including no Svelte reactive-loop warnings from the auto-clamp.

### Code quality

33. **No new dependencies.** `package.json` is unchanged; loading uses the platform `fetch`.
34. **Brief explanatory comments** on each new code block per [technical-standards.md](../../references/technical-standards.md) — the *why* on new functions, the registry, the loading logic, and the `Stepper` component.
35. **Untouched files stay untouched** — `shuffle.js`, `App.svelte`, `service-worker.js`, `vite.config.js`, `package.json`, and the other screen stubs are not modified.
36. **Production build succeeds.** `npm run build` completes with no errors and no new warnings.

## What is NOT acceptance criteria (deferred)

These are explicitly **not** required for this build to be done:

- Role assignment (which players are impostors) — the reveal feature; `shuffle.js` stays a stub.
- Screen routing / a `screen` field / an `{#if}` ladder in `App.svelte`.
- More than one word source, or custom word entry.
- "How to Play" panel, localStorage persistence, re-rolling the word without reload.
- Offline caching of the word JSON (service worker untouched).
- Visual polish, theming, animations.

## Verification

Manual smoke-test sequence the builder (or a reviewer) walks through end-to-end:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`.
2. Open the served URL. Setup shows Total Players (`6`), Number of Impostors (`1`), a Word Source dropdown reading "Common Nouns (Auto-loaded)", and shortly a "Loaded {N} common nouns" confirmation. No console errors.
3. Impostor `−` is disabled at `1`. Press `+` up to `playerCount − 1` (5 when players is 6), then `+` disables.
4. Set impostors to 4, then lower Total Players to `3`. Impostor count auto-clamps to `2`. No console warning appears.
5. Temporarily break the fetch (rename `public/data/common-nouns.json`). Reload: an error message shows and `Start` is disabled. Restore the file.
6. With valid counts and words loaded, press `Start`. The screen switches to ready mode showing the player and impostor counts — **and not the word**.
7. In devtools, inspect the store (or a temporary `console.log`): `gameState` is `{ playerCount, impostorCount, wordSource: 'common-nouns', word: <a word from the list> }`.
8. Press "Change settings": back to editing at players `6`, impostors `1`, word source re-loaded.
9. Resize to 375px width: no horizontal scroll; steppers, dropdown, and buttons remain tappable.
10. Stop the dev server. Run `npm run build`: it succeeds with no new errors or warnings.

If any one of criteria 1–36 fails, the build is not yet done.

## Open questions for the builder

- **Loading-indicator presentation.** Only the "Loaded {N} {countNoun}" success text and a visible error affordance are mandated. A "Loading…" interim state is welcome but optional.
- **Reactive primitive.** The existing `game-state.js` uses `writable` from `svelte/store`. The builder may keep that or use Svelte 5 runes, provided the public surface (`gameState` store-like value + `resetGame()`) is preserved.
- **Word-list authorship.** The builder generates the `common-nouns.json` contents. The 644 count in the reference screenshot is illustrative, not a target — any few-hundred-word concrete-noun list satisfies the spec.
- **Stepper value-binding mechanism.** Whether the component uses `bind:value`, a callback prop, or events is the builder's choice (criterion 13); only the reuse and bounds behaviour are mandated.

# Brief — Impostor Count + Word Source

## Source plan

[01-plan/plans/impostor-count-and-word-source-plan-final.md](../../../01-plan/plans/impostor-count-and-word-source-plan-final.md)

## What to build

The two remaining setup fields the [setup-screen build](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte) deferred, shipped as **one feature**:

1. A **Number of Impostors** stepper on the setup screen.
2. **Word source loading** — a real `loadWords()` that fetches a word list from `public/data/`, a "Word Source" dropdown, and a "Loaded N words" confirmation.

Pressing **Start** now also picks a secret word and commits the full game configuration. By the end of this build, `gameState` carries **everything the reveal phase needs**: `{ playerCount, impostorCount, wordSource, word }`.

Like the setup screen before it, pressing Start does **not** transition to another screen — the reveal screen is still a stub. The SetupScreen stays in its existing "ready" mode, now echoing the player **and** impostor counts (but **never** the secret word).

## Why this is being built now

1. **The reveal phase is blocked without it.** Reveal needs to know how many impostors there are and which word is in play. Right now `gameState` only has `playerCount`, so reveal literally cannot be built. This unblocks it.
2. **It completes the setup screen.** The reference at `01-plan/references/examples-of-good-work/main-screen.png` shows Total Players → Number of Impostors → Word Source → "Loaded N" chip → Start. Player count shipped first; this brief adds the rest.
3. **It establishes the data-loading pattern.** `word-source.js` fetching static JSON from `public/data/` is the template every later content feature (more word categories, custom word lists) will reuse.

## Scope

**In scope:**

- Add `MIN_IMPOSTORS = 1` and `DEFAULT_IMPOSTORS = 1` to [src/lib/config.js](../03-builds/imposter-game-app/src/lib/config.js). The max impostor count is **derived** as `playerCount − 1`, not a constant.
- Extend the [src/lib/game-state.js](../03-builds/imposter-game-app/src/lib/game-state.js) initial shape to `{ playerCount: null, impostorCount: null, wordSource: null, word: null }`. `resetGame()` keeps returning the store to that initial shape.
- Implement [src/lib/word-source.js](../03-builds/imposter-game-app/src/lib/word-source.js) (currently a stub returning `[]`):
  - A `WORD_SOURCES` registry — each entry knows its `id`, dropdown `label`, JSON `file`, and a `countNoun` for the confirmation text (e.g. `"common nouns"`).
  - `DEFAULT_WORD_SOURCE`.
  - `async loadWords(sourceId)` — fetches `${import.meta.env.BASE_URL}data/<file>`, returns an array of word strings, throws on network/parse failure.
  - `pickWord(words)` — pure, returns one random entry.
- Create [public/data/common-nouns.json](../03-builds/imposter-game-app/public/data/) — a flat array of a few hundred common, concrete, family-friendly lowercase nouns. Replaces the existing `.gitkeep`.
- Extend [src/screens/SetupScreen.svelte](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte) editing mode:
  - A **"Number of Impostors:"** stepper, same pattern as Total Players. `−` disabled at `1`; `+` disabled at `playerCount − 1`. Default `1`. When the player count drops, the impostor count re-clamps so it never exceeds `playerCount − 1`.
  - A **"Word Source:"** `<select>` populated from `WORD_SOURCES` (one option for now).
  - Words load **on mount** (and when the source changes). While loaded, show a **"✓ Loaded {N} {countNoun}"** confirmation; on failure, show an error message.
  - `Start` is disabled until words are loaded **and** both counts are valid.
  - On `Start`: pick a word with `pickWord`, commit `{ playerCount, impostorCount, wordSource, word }`.
  - Ready mode now echoes player + impostor counts. It must **not** display the secret word.
- Mobile-responsive — steppers and dropdown remain tappable at a 375px-wide viewport.
- Code follows [technical-standards.md](../../references/technical-standards.md): plain and simple, no new dependencies, brief comments on new blocks.

**Out of scope (do NOT build here):**

- **Role assignment** (which specific players are impostors) — that's the reveal feature, and it's what `shuffle.js` is for. Leave `shuffle.js` as the stub.
- **Screen routing** — no `screen` field, no `{#if}` ladder in `App.svelte`. SetupScreen still handles its own two modes.
- **More word categories or custom word entry** — `WORD_SOURCES` is built to extend, but only "Common Nouns" ships now.
- **"How to Play" instructions panel.**
- **localStorage persistence** of settings.
- **Offline caching of the word JSON** — the service worker is not modified; first load needs network. (Its own comment already flags runtime word-list caching as future work.)
- **Re-rolling the word** without reloading the source.
- **Visual polish, theming, animations** — design comes via `03-design/` later.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`. No new top-level folders. Files affected:

| File | Change |
|---|---|
| `src/lib/config.js` | Add `MIN_IMPOSTORS`, `DEFAULT_IMPOSTORS`. |
| `src/lib/game-state.js` | Extend initial shape to the four-field object; `resetGame()` behaviour unchanged. |
| `src/lib/word-source.js` | Replace stub with `WORD_SOURCES`, `DEFAULT_WORD_SOURCE`, `loadWords(sourceId)`, `pickWord(words)`. |
| `public/data/common-nouns.json` | **New file.** Flat array of noun strings; replaces `.gitkeep`. |
| `src/screens/SetupScreen.svelte` | Add impostor stepper + word-source dropdown + load/confirmation/error UI; extend validation and `start()`; update ready-mode text. |
| `src/components/Stepper.svelte` | **New file (required).** Extract the reusable stepper and use it for both counts, so it can be reused by later features. |

## Constraints worth highlighting

- Per [technical-standards.md](../../references/technical-standards.md): *"plainly and simply as possible"*, *"prefer standard library solutions over third-party packages"*, *"add comments to the code whenever you are coding a new code block"*. **No new dependencies** (use `fetch`, not a HTTP library).
- Re-use the existing `.stepper` / `.step-btn` / `.count-input` CSS and the editing/ready pattern already in `SetupScreen.svelte`. Re-use the existing `app.css` tokens (`--bg-surface`, `--text-muted`, `--success` for the loaded chip, `--error` for the failure message).
- The editing-vs-ready distinction stays **derived from `playerCount === null`** — do not add a `status` or `screen` field.
- **The secret word is secret.** It lives in `gameState.word` but must never be rendered on the setup screen (including ready mode). Showing it would spoil the game.
- **Guard the impostor re-clamp** against an infinite Svelte reactive loop — only reassign when the value is actually out of range.
- Use `import.meta.env.BASE_URL` for the fetch path, not a hardcoded `/data/...`, so a future sub-path deploy still works.
- Works on modern browsers (Chrome, Firefox, Safari latest). Mobile-responsive — verify at 375px.

## Next step

This brief feeds [02-development/workflow/02-specs/impostor-count-and-word-source-spec.md](../02-specs/impostor-count-and-word-source-spec.md), which converts it into an acceptance-criteria contract for the build.

# Impostor Count + Word Source Plan (Final)

## Why this plan exists

The setup screen currently commits only `{ playerCount }` to `gameState`. The reveal phase can't function until state also carries **how many impostors** there are and **which secret word** is in play. The original [setup-screen-plan-final.md](setup-screen-plan-final.md) explicitly deferred two items for exactly this reason:

- *"Impostor count input — the second numeric input from the reference screenshot."*
- *"Word source / category picker — the dropdown + 'Loaded 644 common nouns' confirmation."*

Both appear in the reference at `01-plan/references/examples-of-good-work/main-screen.png` (Total Players → Number of Impostors → Word Source dropdown → "✓ Loaded 644 common nouns" chip → Start Game). They're small and tightly coupled to the same screen and the same `Start` action, so they ship as **one feature**.

The intended outcome: after this lands, `gameState` carries **everything the reveal phase needs** — `{ playerCount, impostorCount, wordSource, word }`.

## The feature

Two additions to the existing editing-mode form in `SetupScreen.svelte`, plus the wiring to make the word source real:

1. **Number of Impostors** — a stepper identical in pattern to the player-count one. Bounds **1 → playerCount − 1** so there's always at least one crewmate. Default **1**. Its max tracks the live player-count value; lowering players re-clamps impostors down.
2. **Word Source** — a `<select>` dropdown (one option for now: *"Common Nouns (Auto-loaded)"*, built to extend). On load the app fetches the source's JSON from `public/data/`, shows a **"✓ Loaded N common nouns"** confirmation, and gates `Start` until words are available.
3. **Pick the word at Start** — pressing Start randomly selects one word from the loaded list and commits the full state: `{ playerCount, impostorCount, wordSource, word }`. The word is **never shown** in the ready confirmation (it's secret) — only the counts are echoed back.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| When the word is chosen | **At Start**, stored as `gameState.word` | Reveal just reads it — state fully self-contained. Matches "carry everything reveal needs." |
| Impostor default | **1** | Classic single-impostor game. Always valid (min players is 3 → max impostors ≥ 2). |
| Word-list contents | **Builder generates** ~few hundred common, concrete, family-friendly nouns | No external dependency; concrete nouns make a better guessing game. Exact count flexible — the chip reads the real length. |
| Impostor bounds location | `MIN_IMPOSTORS`, `DEFAULT_IMPOSTORS` in `config.js`; max derived as `playerCount − 1` | Consistent with where player bounds already live; max can't be a constant since it depends on player count. |
| Word source as data, not hardcode | A `WORD_SOURCES` registry in `word-source.js` | Adding a category later = one array entry + one JSON file. The dropdown and loader both read from it. |
| Word loading trigger | **On mount** (and on source change) | The reference labels it "Auto-loaded." |
| What state stores for words | The chosen `word` + `wordSource` id (not the whole list) | Reveal needs the word; the id is handy for a future results screen. Keeps state lean. |

## How it fits the architecture

This is the second step in building the screen-based state machine the tech-stack plan describes. The setup plan set the pattern — state lives in `gameState`, transitions are pure store writes, screens read reactively. This plan extends the **shape** with the remaining setup fields and introduces the **data-loading pattern** (`word-source.js` fetching static JSON from `public/data/`) that future content features (more categories, custom words) will follow.

```
initial / editing:  { playerCount: null, impostorCount: null, wordSource: null, word: null }
   ↓ user presses Start (word picked from the loaded list)
ready:              { playerCount: 6, impostorCount: 1, wordSource: 'common-nouns', word: 'lantern' }
   ↓ user presses Change settings → resetGame()
back to initial
```

The editing-vs-ready distinction stays **derived from `playerCount === null`** — no new status/screen flag, consistent with the setup plan.

## Files this affects

| File | Change |
|---|---|
| `src/lib/config.js` | Add `MIN_IMPOSTORS = 1` and `DEFAULT_IMPOSTORS = 1`. (Max is derived, not a constant.) |
| `src/lib/game-state.js` | Extend `initial` to `{ playerCount: null, impostorCount: null, wordSource: null, word: null }`. `resetGame()` is unchanged in behaviour. |
| `src/lib/word-source.js` | Replace the stub. Export `WORD_SOURCES` (`{ id, label, file, countNoun }`), `DEFAULT_WORD_SOURCE`, an `async loadWords(sourceId)` that fetches `${import.meta.env.BASE_URL}data/<file>` and returns a string array (throws on failure), and a pure `pickWord(words)`. |
| `public/data/common-nouns.json` | **New.** Flat array of lowercase noun strings: `["apple", "lantern", ...]`. Replaces the `.gitkeep`. |
| `src/screens/SetupScreen.svelte` | Add the impostor stepper, the word-source `<select>`, on-mount loading with the "Loaded N" chip / error message, extend validity + `start()` to commit the new fields, and update the ready text to echo player + impostor counts (not the word). |
| `src/components/Stepper.svelte` | **New file (required).** Extract the now-duplicated stepper into a reusable component (props: label, value, min, max, change handler) used by both counts, so later features can reuse it. `src/components/.gitkeep` already marks the intended home. |

**Reused, not rebuilt:** the existing `.stepper` / `.step-btn` / `.count-input` CSS and the `onInput` / `increment` / `decrement` / validity pattern already in `SetupScreen.svelte`. `shuffle.js` is **not** touched — single random pick uses `pickWord`, and role assignment (which needs a shuffle) belongs to the reveal feature.

## What's deferred (out of scope)

- **Role assignment** — which specific players are impostors. That's the reveal feature's job and is what finally uses `shuffle.js`.
- **Screen routing** — the `screen` field + `{#if}` ladder in `App.svelte`, wired when the reveal screen is built.
- **More word categories / custom word entry** — the `WORD_SOURCES` registry supports them; only "Common Nouns" ships now.
- **"How to Play" panel**, **localStorage persistence**, **visual / design polish** — each their own later plan.
- **Offline caching of the word JSON** — the current service worker precaches only the shell and won't cache `data/*.json` (its own comment flags "runtime caching of word lists" as future work). First load needs network. Noted as a known gap, not fixed here.
- **Re-roll word without reload** — state stores the chosen word, not the list; a future re-roll feature can reload.

## Acceptance (what "done" looks like for the eventual build)

Once this plan becomes a brief, then a spec, then code, the build should pass this walk-through from `02-development/workflow/03-builds/imposter-game-app/`:

1. `npm run dev` — server starts, no console errors.
2. Setup shows **Total Players** (default 6), **Number of Impostors** (default 1), a **Word Source** dropdown reading "Common Nouns (Auto-loaded)", and a **"✓ Loaded N common nouns"** chip once the fetch resolves.
3. Impostor `−` disabled at **1**; `+` disabled at **playerCount − 1**. Dropping players to 3 while impostors is 4 clamps impostors to 2 (no reactive loop / no console warning).
4. `Start` is **disabled** until words are loaded. Simulating a failed fetch (rename / remove the JSON) shows an error message and keeps `Start` disabled.
5. Press `Start` → ready mode echoes player + impostor counts and **does not display the word**.
6. Inspecting the store (temporary log or devtools) shows `{ playerCount, impostorCount, wordSource, word }` all populated, with `word` being one of the loaded entries.
7. "Change settings" returns to editing at the defaults.
8. `npm run build` succeeds with no warnings; at a 375px viewport there's no horizontal scroll and both steppers + the dropdown remain tappable.

## Risks / open questions

- **Reactive clamp loop.** Re-clamping impostor count when player count drops must guard against an infinite Svelte reactive cycle — only assign when actually out of range.
- **Fetch base path.** Use `import.meta.env.BASE_URL` (not a hardcoded `/data/...`) so it survives a future sub-path deploy (e.g. GitHub Pages). Vite currently has no `base` set, so today this resolves to `/data/...`.
- **Word-list quality.** Favor concrete, common, family-friendly nouns; avoid abstract or proper nouns so the guessing game stays fair. Builder's content judgement.

## Status

`final` — approved by Rehaan. Brief derived from this plan lives at [02-development/workflow/01-brief/impostor-count-and-word-source-brief.md](../../02-development/workflow/01-brief/impostor-count-and-word-source-brief.md).

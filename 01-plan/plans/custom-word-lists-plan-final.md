# Plan: Custom Word Lists (round-only subset of Common Nouns)

Status: **final** (built and verified — shipped)

## Context

The Imposter app currently draws each round's secret word from a single fixed
deck chosen in the Word Source dropdown on the setup screen. Players want control
over the pool for a given session — e.g. play only with words a young kid knows,
or only "easy" words — without editing files or maintaining saved decks.

This feature lets the user hand-pick which words from the **Common Nouns** deck
are eligible for the upcoming round(s). They search the deck, tap words to
include them, and confirm. The chosen subset becomes the active deck and the
round picks its secret word only from those. The selection is **round-scoped /
in-memory only** — it is intentionally NOT persisted after rounds, matching the
existing "play again" behaviour that discards per-round data.

Only the **word** is ever shown in the builder — never the associated `hint`,
since the hint is the imposter's clue and showing it would spoil the game.

### Decisions (confirmed with user)
- **Entry point:** a new `Custom List` option in the existing Word Source
  dropdown. Selecting it opens the builder in place of the setup form.
- **Initial view:** the full Common Nouns list (~500+ words) renders immediately,
  scrollable. The search box filters it (case-insensitive substring on `word`).
- **No matches:** show the inline text `Word not available.` in place of the list
  (not a popup) when a search matches nothing.
- **Select:** tap a word to highlight it (included); tap again to remove.
- **Confirm:** always-visible button, bottom-right. Disabled until ≥1 word is
  selected. On confirm, the highlighted subset becomes the active deck and we
  return to the setup form; Start Game then works as normal.
- **Back/Exit:** always-visible button to leave the builder without confirming,
  returning to the setup form.

## Existing pieces to reuse (do not rebuild)
- `WORD_SOURCES`, `loadWords(id)`, `pickWord(words)` in
  `02-development/workflow/03-builds/imposter-game-app/src/lib/word-source.js`.
  The custom subset is a normal `{ word, hint }[]`, so `pickWord` and the whole
  reveal/results path work unchanged — the hint travels with the word as today.
- The "render a panel in place of the setup form via a local flag" pattern that
  `SettingsScreen` already uses in `SetupScreen.svelte` (`showSettings`). The
  builder follows the same shape (`showBuilder`).
- App CSS tokens (`--accent`, `--bg-surface`, `--text-muted`, `--error`,
  `--success`) and existing button/chip styling conventions.

## Approach

### 1. Register the custom source — `src/lib/word-source.js`
Add one entry to `WORD_SOURCES`:
```js
{ id: 'custom', label: 'Custom List', countNoun: 'custom words', custom: true }
```
It has **no `file`**. `loadWords` must never be called with `'custom'` (it would
throw, since there's nothing to fetch). The builder instead loads the full source
via `loadWords('common-nouns')`. Optionally export a tiny `isCustomSource(id)`
helper, or just check `id === 'custom'` at the (one) call site.

### 2. New builder component — `src/screens/CustomListBuilder.svelte`
Props: `initialSelection` (array of already-chosen word strings, for re-editing),
`onConfirm(subset)` where `subset` is the `{ word, hint }[]` to use, and
`onExit()`.

Behaviour:
- On mount, `loadWords('common-nouns')` to get the full `{ word, hint }[]`.
  Show a loading / error state while fetching (mirror SetupScreen's load chip).
- Hold selection as a `Set<string>` of selected `word` values, seeded from
  `initialSelection`.
- Search input at top; reactive
  `filtered = all.filter(e => e.word.toLowerCase().includes(query.trim().toLowerCase()))`.
- Render `filtered` as a scrollable flex-wrap grid of tappable chips showing
  **only `e.word`**. Selected chips get the `--accent` highlight; tapping toggles
  membership in the Set.
- If `filtered.length === 0` (and not loading/error), render the inline text
  `Word not available.` in place of the grid.
- Sticky **Confirm** button bottom-right, label e.g. `Confirm (N)` where N =
  selection size; `disabled` while N === 0. On click, build
  `subset = all.filter(e => selected.has(e.word))` and call `onConfirm(subset)`.
- **Back/Exit** button (top-left or alongside Confirm), always enabled, calls
  `onExit()`.

### 3. Wire it into setup — `src/screens/SetupScreen.svelte`
- New local state: `showBuilder = false`, `customSelection = []` (the chosen word
  strings, kept so re-opening the builder pre-highlights them), and a
  `previousSource` to restore on Back.
- Word Source `on:change`: if the new value is `'custom'`, set `previousSource` to
  the prior id, open the builder (`showBuilder = true`) and do **not** call
  `load()`. Otherwise behave as today (`load(selectedSource)`).
- Render the builder in place of the form when `showBuilder`, like the existing
  `{#if showSettings}` branch.
- `handleCustomConfirm(subset)`: set `words = subset`, `loadStatus = 'loaded'`,
  `customSelection = subset.map(e => e.word)`, keep `selectedSource = 'custom'`,
  close the builder. The existing `canStart` gate (`loadStatus === 'loaded' &&
  words.length > 0`) then enables Start automatically. The "✓ Loaded N custom
  words" chip works because the custom source has a `countNoun`.
- `handleCustomExit()`: close the builder and revert `selectedSource =
  previousSource`, then `load(previousSource)` so the dropdown and Start return to
  a valid state.

### 4. Non-persistence after rounds
`customSelection`/`words` live only in SetupScreen's component state and are never
written to `gameState` or localStorage, so they vanish when the round starts —
exactly the requirement. One guard needed: `playAgain()` preserves `wordSource`,
so on returning to setup `saved.wordSource` can be `'custom'` with no subset
behind it. In SetupScreen's initial seed, if `saved.wordSource === 'custom'`,
start on `DEFAULT_WORD_SOURCE` instead — the custom list is intentionally
discarded between rounds and the user rebuilds it if they want it again.

## Files
- `src/lib/word-source.js` — add `custom` entry (+ optional `isCustomSource`).
- `src/screens/CustomListBuilder.svelte` — **new** builder UI.
- `src/screens/SetupScreen.svelte` — dropdown intercept, builder branch, confirm/
  exit handlers, custom-source remount guard.

No changes to `game-state.js`, reveal/results screens, or the JSON data.

## Verification (run `npm run dev`)
1. Setup → Word Source → pick **Custom List**: builder opens, full word list
   visible, only words shown (no hints).
2. Type a partial word: list filters live; type gibberish: `Word not available.`
   shows inline (no popup).
3. Confirm is disabled with 0 selected; tap a few words (highlight toggles on/off);
   Confirm shows the count and enables.
4. Confirm → back on setup with "✓ Loaded N custom words"; Start Game works and
   the secret word is always one of the selected words (run a few rounds).
5. Re-open Custom List → previously chosen words are still highlighted.
6. Back/Exit from the builder → returns to setup on the previous source, Start
   valid again.
7. Play a round, then "Play again" → source is back to Common Nouns (custom list
   did not persist).

## Next steps in the pipeline
1. Promote to a brief: `02-development/workflow/01-brief/custom-word-lists-brief.md`
2. Write the spec: `02-development/workflow/02-specs/custom-word-lists-spec.md`
3. Build under `02-development/workflow/03-builds/imposter-game-app/`

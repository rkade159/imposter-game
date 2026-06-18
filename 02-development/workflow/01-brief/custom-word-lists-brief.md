# Brief — Custom Word Lists

## Source plan

[01-plan/plans/custom-word-lists-plan-final.md](../../../01-plan/plans/custom-word-lists-plan-final.md)

## What to build

A **round-scoped custom word list**: a new **`Custom List`** option in the Setup
screen's **Word Source** dropdown that opens a **builder** where the user
hand-picks which words from the existing **Common Nouns** deck are eligible for
the upcoming round(s). They search the deck, tap words to include/exclude them,
then **Confirm** to lock that subset as the active deck — Start Game then draws
its secret word only from those words.

Today the secret word is drawn from a whole fixed deck with no way to narrow it.
After this build:

- The **Word Source** dropdown gains a **`Custom List`** option (alongside
  `Common Nouns (Auto-loaded)`).
- Selecting it opens a **builder** in place of the setup form (the same
  in-place-panel pattern Settings already uses), showing the **full Common Nouns
  list** immediately — **scrollable**, each word a **tappable chip**.
- **Only the `word` is ever shown** — never its `hint`. The hint is the imposter's
  clue; showing it in the picker would spoil the game.
- A **search box** filters the list live (case-insensitive substring on the word).
  When a search matches **nothing**, the inline text **`Word not available.`** is
  shown **in place of the list** — **not** a popup/modal.
- **Tapping a word toggles it**: highlighted = included; tap again to remove.
- A **Confirm** button is **always visible in the bottom-right**. It is
  **disabled until at least one word is selected**. Confirming locks the
  highlighted subset as the active deck and returns to the setup form, where
  **Start Game works exactly as today**.
- A **Back / Exit** button is **always visible** to leave the builder **without
  confirming**, returning to the setup form on the previously selected source.
- The custom list is **round-scoped and in-memory only** — it is **NOT persisted
  after rounds** (and never written to `localStorage`). After a round ends and the
  group hits **Play again**, the source falls back to **Common Nouns**; the user
  rebuilds the custom list if they want it again.

## Why this is being built now

1. **It gives players control of the difficulty/theme of a session** — e.g. only
   words a young kid knows, or only "easy" ones — without editing JSON files or
   maintaining saved decks.
2. **It reuses existing machinery.** A custom subset is just a normal
   `{ word, hint }[]`, so `pickWord` and the entire reveal/results path work
   **unchanged** — the hint still travels with the word for the imposter. No
   game-state shape change.
3. **It follows an existing UI pattern.** `SettingsScreen` already renders "in
   place of the setup form via a local flag" (`showSettings`); the builder is the
   same shape (`showBuilder`), so navigation needs no router and no `game-state`
   change.

## How it works (the core flow)

The Word Source dropdown's `on:change` already calls `load(selectedSource)`. The
only interception: when the newly selected value is **`custom`**, **do not**
`load()` (the custom source has no file to fetch) — instead remember the previous
source and open the builder. The builder loads the **full** Common Nouns deck via
the existing `loadWords('common-nouns')`, lets the user pick a subset, and on
Confirm hands that subset back to Setup as the round's `words`. From there the
existing `canStart` gate (`loadStatus === 'loaded' && words.length > 0`) and
`start()` (`pickWord(words)`) need no changes.

Non-persistence is mostly automatic: the subset lives only in Setup's component
state, never in `gameState`/`localStorage`, so it vanishes when the round starts.
**One guard** is required because `playAgain()` preserves `wordSource`: on
returning to Setup, if the seeded `wordSource` is `custom` (with no subset behind
it), start the dropdown on the **default** source instead.

## Scope

**In scope:**

- **Register the source** —
  [src/lib/word-source.js](../03-builds/imposter-game-app/src/lib/word-source.js):
  add one `WORD_SOURCES` entry
  `{ id: 'custom', label: 'Custom List', countNoun: 'custom words', custom: true }`
  with **no `file`**. `loadWords` must **never** be called with `'custom'` (it has
  nothing to fetch and would throw). Optionally export a tiny `isCustomSource(id)`
  helper; a `=== 'custom'` check at the single call site is also fine.
- **New builder component** —
  `src/screens/CustomListBuilder.svelte` (new). Props: `initialSelection`
  (array of already-chosen word strings, so re-opening pre-highlights them),
  `onConfirm(subset)` (subset is the `{ word, hint }[]` to use), and `onExit()`.
  Behaviour:
  - On mount, `loadWords('common-nouns')` for the full `{ word, hint }[]`; show a
    loading / error state while fetching (mirror Setup's load chip).
  - Hold selection as a `Set<string>` of selected `word` values, seeded from
    `initialSelection`.
  - Search input filters live: case-insensitive substring on `word`.
  - Render the filtered list as a **scrollable** flex-wrap grid of **tappable
    chips showing only `word`**. Selected chips get the `--accent` highlight;
    tapping toggles membership.
  - When the filtered list is empty (and not loading/error), render the inline
    text **`Word not available.`** in place of the grid.
  - **Confirm** button bottom-right (e.g. `Confirm (N)`); **disabled while N = 0**;
    on click builds `subset` from the selected words and calls `onConfirm`.
  - **Back / Exit** button, always enabled, calls `onExit()`.
- **Wire into setup** —
  [src/screens/SetupScreen.svelte](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte):
  add `showBuilder`, `customSelection` (chosen word strings), and `previousSource`
  local state. Intercept the dropdown `on:change` for `custom`; render the builder
  in place of the form like the existing `{#if showSettings}` branch;
  `handleCustomConfirm(subset)` sets `words`/`loadStatus='loaded'`/`customSelection`
  and keeps `selectedSource='custom'`; `handleCustomExit()` reverts to
  `previousSource` and re-`load()`s it. Add the **remount guard**: if the seeded
  `saved.wordSource === 'custom'`, seed `selectedSource` to `DEFAULT_WORD_SOURCE`.
- **Mobile + grayscale-safe** — chips use **only existing colour tokens**; the
  `--accent` highlight is the existing selection colour and is **not** a role tell
  (this is the setup screen, no imposter info present). Tap targets ≥44px, no
  horizontal scroll at 375px, the list scrolls vertically.
- Code follows [technical-standards.md](../../references/technical-standards.md):
  plain and simple, **no new dependencies**, a brief comment on each new block,
  **"imposter(s)" spelling** in any user-facing text.

**Out of scope (do NOT build here):**

- **Persisting** the custom list across rounds, or to `localStorage` — it is
  intentionally round-scoped and discarded on Play again.
- **Editing the words themselves** (adding brand-new words, editing hints) — the
  user only **chooses from** the existing Common Nouns deck as it is right now.
- **Showing the hint** anywhere in the builder.
- **Multiple saved custom decks**, naming decks, or a deck-management screen.
- **A second custom source from a different base deck** — Common Nouns only.
- **`game-state.js` shape/logic changes**, edits to the reveal/pass/discussion/
  results screens, routing, Capacitor, or the service worker.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/lib/word-source.js` | Add the `custom` `WORD_SOURCES` entry (no `file`); optional `isCustomSource` helper. |
| `src/screens/CustomListBuilder.svelte` | **New** — search + tappable chip grid, `Word not available.`, Confirm (bottom-right, ≥1 gate), Back/Exit. |
| `src/screens/SetupScreen.svelte` | Dropdown intercept for `custom`, builder branch, confirm/exit handlers, custom-source remount guard. |

## Constraints worth highlighting

- **Only the `word` is rendered in the builder** — never the `hint`. This is a
  hard rule (it would spoil the imposter).
- **`loadWords('custom')` must never run** — the custom source has no file. The
  builder loads `common-nouns`; the custom subset is produced in memory.
- **Confirm is gated** — disabled until ≥1 word selected. **Back/Exit** always
  works and never commits a list.
- **`Word not available.` is inline**, replacing the list — **not** a popup.
- **Not persisted** — never write the subset to `gameState` or `localStorage`; on
  Play again the source falls back to the default (the remount guard).
- **No game-state changes** — a custom subset is a normal `{ word, hint }[]`;
  `pickWord` and the reveal/results path are untouched.
- **No new dependencies** — pure Svelte + CSS. Works on modern browsers; verify at
  375px, tap targets ≥44px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. **Builder opens:** Setup → Word Source → **Custom List** → the builder opens
   showing the full Common Nouns list; **only words** are shown (no hints).
2. **Search filters:** type a partial word → list narrows live; type gibberish →
   inline **`Word not available.`** shows (no popup); clearing the search restores
   the list.
3. **Select toggles:** Confirm is **disabled** with 0 selected; tap several words
   (highlight toggles on and off per tap); Confirm shows the count and **enables**.
4. **Confirm → Start:** Confirm → back on Setup with **"✓ Loaded N custom words"**;
   Start Game works and, across several rounds, the secret word is **always** one
   of the selected words.
5. **Re-open keeps selection:** choose **Custom List** again → the previously
   chosen words are still **highlighted**.
6. **Back/Exit:** open the builder, press **Back/Exit** → returns to Setup on the
   **previous** source with Start valid again; **no** custom list committed.
7. **Not persisted:** play a round, then **Play again** → the source is back to
   **Common Nouns**; the custom list is gone.
8. **Mobile + build:** at 375px no horizontal scroll, the list scrolls, tap
   targets ≥44px; `npm run build` succeeds with no new errors/warnings.

## Next step

This brief feeds
[02-development/workflow/02-specs/custom-word-lists-spec.md](../02-specs/custom-word-lists-spec.md),
which converts it into an acceptance-criteria contract for the build.

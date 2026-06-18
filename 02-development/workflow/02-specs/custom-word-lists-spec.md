# Spec — Custom Word Lists

## Source brief

[02-development/workflow/01-brief/custom-word-lists-brief.md](../01-brief/custom-word-lists-brief.md)
(source plan:
[01-plan/plans/custom-word-lists-plan-final.md](../../../01-plan/plans/custom-word-lists-plan-final.md))

> The "Custom word lists" feature appears in **no** reference screenshot; it is
> defined by this spec and its brief alone. This spec runs **ahead** of the build
> (proper `plan → brief → spec → build` order).

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a
**contract, not a blueprint**. It states WHAT must be true — observable behaviour
and the surfaces other code depends on — not exact DOM, class names, or CSS, which
are the builder's call within the constraints below.

Six things *are* mandated because they are the explicit goals of this feature:
(a) a **`Custom List`** option in the Word Source dropdown that opens a builder
(criteria 1–2); (b) the builder shows the **full Common Nouns deck** immediately,
**only the word**, never the hint (criteria 3–4); (c) a **search** filters live and
an empty result shows the inline text **`Word not available.`**, not a popup
(criteria 5–6); (d) tapping toggles selection and **Confirm** is **disabled until
≥1 word** is selected, locks the subset, and returns to Setup (criteria 7–9);
(e) a **Back/Exit** control leaves without committing (criterion 10); (f) the list
is **round-scoped — never persisted** to `gameState` or `localStorage`, and Play
again falls back to the default source (criteria 11–12). Everything else — exact
chip layout, wording, separators, scroll styling — is the builder's call.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

| File | State after build |
|---|---|
| `src/lib/word-source.js` | `WORD_SOURCES` gains one entry `{ id: 'custom', label: 'Custom List', countNoun: 'custom words', custom: true }` with **no `file`**. `DEFAULT_WORD_SOURCE`, `loadWords`, and `pickWord` are otherwise unchanged. An optional `isCustomSource(id)` helper may be exported. `loadWords` is **never** called with `'custom'`. |
| `src/screens/CustomListBuilder.svelte` | **New** component. Props `initialSelection: string[]`, `onConfirm(subset)`, `onExit()`. Loads the full Common Nouns deck via `loadWords('common-nouns')`; renders a searchable, scrollable grid of tappable word chips (word text only); shows `Word not available.` inline on an empty filter; a bottom-right **Confirm** disabled until ≥1 selected; a **Back/Exit** always enabled. |
| `src/screens/SetupScreen.svelte` | Intercepts the Word Source dropdown so selecting `custom` opens the builder (and does **not** call `loadWords('custom')`); renders the builder in place of the form; commits the confirmed subset as the round's `words`; reverts cleanly on Back/Exit; and seeds the dropdown to the default source when a remount arrives with `wordSource === 'custom'`. |

Files that must **NOT** be modified by this build: `src/lib/game-state.js`,
`src/lib/settings.js`, `src/lib/session-settings.js`, `src/lib/config.js`,
`src/lib/shuffle.js`, `src/screens/RevealScreen.svelte`,
`src/screens/PassScreen.svelte`, `src/screens/DiscussionScreen.svelte`,
`src/screens/ResultsScreen.svelte`, `src/screens/SettingsScreen.svelte`,
`src/components/*`, `src/App.svelte`, `src/app.css`, `public/data/*`
(the Common Nouns JSON is **read** via the existing loader, never edited),
`src/service-worker.js`, `src/main.js`, `vite.config.js`, `package.json`,
`index.html`.

## Acceptance criteria

A build is "done" when **every** item below is true.

### Word source registration (`src/lib/word-source.js`)

1. `WORD_SOURCES` contains a `custom` entry with `label` **exactly** `Custom List`
   and a `countNoun` of `custom words`, and **no `file` key**. The existing
   `common-nouns` entry and `DEFAULT_WORD_SOURCE` are unchanged.
2. `loadWords` is **never invoked with `'custom'`** anywhere in the build. The
   builder obtains words via `loadWords('common-nouns')`; the custom subset is
   produced in memory.

### Entering the builder (`SetupScreen.svelte`)

3. The Word Source dropdown lists **`Custom List`** as a peer of
   `Common Nouns (Auto-loaded)`. Selecting it opens the builder **in place of the
   setup form** (the existing in-place-panel pattern; no router, no `game-state`
   change) and does **not** trigger a fetch of a `custom` file.
4. The builder shows the **full Common Nouns deck** (every entry) as soon as its
   load resolves, in a **vertically scrollable** area. While the deck is loading it
   shows a loading state; on load failure it shows an error state and no chips.

### Word display & search (`CustomListBuilder.svelte`)

5. Each word is rendered showing **only its `word`** — the associated **`hint` is
   never rendered** anywhere in the builder (DOM included). A search input filters
   the list **live** by **case-insensitive substring** match on `word`.
6. When the current search matches **no** words, the inline text **`Word not
   available.`** is shown **in place of the list** (replacing the chips inline —
   **not** a modal/popup/alert). Clearing/changing the search restores matching
   words. The message does not appear merely because nothing is selected, only when
   the **filter** yields zero results.

### Selecting & confirming (`CustomListBuilder.svelte` → `SetupScreen.svelte`)

7. **Tapping a word toggles** its selected state: an unselected word becomes
   selected (visually highlighted), and tapping a selected word **deselects** it.
   Selection state is independent of the search filter — filtering does not clear
   selections, and a selected word that scrolls out of the current filter stays
   selected.
8. A **Confirm** control is **always visible, anchored bottom-right** while the
   builder is open. It is **disabled (non-interactable) while zero words are
   selected** and becomes enabled once **≥1** word is selected.
9. Activating **Confirm** locks the selected words as the round's active deck and
   returns to the setup form. After return: the source remains `Custom List`, the
   load confirmation reads **"✓ Loaded N custom words"** (N = number selected), and
   **Start Game is enabled** via the existing `canStart` gate. Starting the round
   draws the secret word via the existing `pickWord` **only from the selected
   subset**, and the chosen entry's `hint` is still carried into the round
   unchanged (imposter still gets a hint).

### Leaving without confirming (`CustomListBuilder.svelte` → `SetupScreen.svelte`)

10. A **Back/Exit** control is **always visible** and **always enabled**.
    Activating it closes the builder **without committing any list** and returns to
    the setup form on the **source that was selected before** the user opened the
    builder, with the form in a valid, startable state for that source.

### Round-scoping / non-persistence

11. The custom subset is **never written** to `gameState` or `localStorage`. It
    lives only in `SetupScreen` component state (and the builder's). No new store is
    introduced; `settings.js`/`session-settings.js` are untouched.
12. After a round, **Play again** returns to setup with the Word Source **defaulted
    back** (not `Custom List` with an empty deck): when Setup is seeded with
    `wordSource === 'custom'`, the dropdown is initialised to `DEFAULT_WORD_SOURCE`
    and that source loads normally. Re-opening the builder within the **same** setup
    session pre-highlights the previously chosen words (`initialSelection`); a new
    round does not.

### Data integrity

13. No change to game-state shape or role assignment. `game-state.js`,
    `pickWord`, and the reveal/pass/results flow are read/reused only. A custom
    subset is an ordinary `{ word, hint }[]`.

### Look and feel (baseline only — design comes later)

14. The builder uses existing `app.css` **tokens** only (no new palette colours).
    The selected-chip highlight uses the existing `--accent` selection colour; this
    is the setup screen with **no imposter information present**, so the highlight is
    not a role tell and remains correct under Grayscale mode. Tap targets ≥**44px**;
    **no horizontal scroll** at a 375px-wide viewport (the long word list scrolls
    **vertically**); Confirm/Back stay reachable (e.g. sticky) as the list scrolls.
15. **No console errors or warnings** in dev or in the built preview.

### Code quality

16. **No new dependencies.** `package.json` is unchanged.
17. The selection is held **once** (a `Set`/array in the builder) and the confirmed
    subset is the single thing handed to Setup; the deck is **not** re-fetched per
    keystroke. **Brief explanatory comments** sit on each new block per
    technical-standards (the `custom`-source interception, the never-render-hint
    rule, the empty-filter message, the non-persistence remount guard). User-facing
    text uses the **"imposter(s)"** spelling.
18. **Untouched files stay untouched** — every file in the "must NOT be modified"
    list, especially `game-state.js`, `app.css`, and `public/data/*`.
19. **Production build succeeds.** `npm run build` completes with no errors and no
    new warnings.

## What is NOT acceptance criteria (deferred / explicitly excluded)

- **Persisting** the custom list across rounds or to `localStorage`.
- **Editing words/hints or adding brand-new words** — selection from the existing
  Common Nouns deck only.
- **Showing the hint** anywhere in the builder.
- **Multiple/named saved decks** or a deck-management screen.
- **A custom source from any base deck other than Common Nouns.**
- **Design polish / animation** for the builder — a `03-design` concern later;
  functional, token-consistent styling only here.

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder
**writes** this checklist but does **NOT** run `npm run dev` to walk it — **Rehaan
runs the app** and verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No
   console errors.
2. **Builder opens:** Setup → Word Source → **Custom List** → builder opens with the
   full Common Nouns list; **only words** shown (inspect a chip — no hint text).
3. **Search:** type a partial word → list narrows live; type gibberish → inline
   **`Word not available.`** (no popup); clear search → list returns.
4. **Select/toggle + gate:** Confirm **disabled** at 0 selected; tap several words
   (each tap toggles highlight on/off); Confirm shows the count and **enables**.
5. **Confirm → Start:** Confirm → Setup shows **"✓ Loaded N custom words"**; start a
   few rounds → the secret word is **always** one of the selected words; the
   imposter still receives a hint.
6. **Re-open keeps selection:** pick **Custom List** again → previously chosen words
   are still **highlighted**.
7. **Back/Exit:** open the builder → **Back/Exit** → returns to Setup on the
   **previous** source, Start valid, **no** custom list committed.
8. **Not persisted:** play a round → **Play again** → source is back to **Common
   Nouns**; the custom list is gone.
9. **Mobile:** at 375px, no horizontal scroll, the word list scrolls vertically,
   Confirm/Back reachable, tap targets ≥44px.
10. Stop the dev server. Run `npm run build`: succeeds with no new errors/warnings.

If any one of criteria 1–19 fails, the build is not done.

## Open questions for the builder

- **Chip vs. row layout.** Flex-wrap chips or a vertical list of rows is the
  builder's call, provided only the word shows, tapping toggles, and the selected
  state is clearly visible (criteria 5, 7).
- **Confirm label.** `Confirm (N)` is expected; exact label/format is the builder's
  call as long as it is bottom-right, always present, and disabled at 0 (criterion 8).
- **Back vs. Exit wording/placement.** Either label, top or bottom, is fine as long
  as it is always visible and never commits a list (criterion 10).

## Next step

This spec is the contract for the build at
`02-development/workflow/03-builds/imposter-game-app/`. On approval, implement the
three file changes above and deliver the verification checklist for Rehaan to walk.

# Spec — Editable Player Names

## Source brief

[02-development/workflow/01-brief/editable-player-names-brief.md](../01-brief/editable-player-names-brief.md)

> 📝 **Process note.** This spec was written **after** the build, to complete the
> feature's paper trail (the `plan → brief → spec → build` order was skipped for
> this one change). Future features follow the pipeline in order.

> ⚠️ **If you open any reference screenshot, read [CORRECTIONS.md](../../../01-plan/references/examples-of-good-work/CORRECTIONS.md) first** — it overrides the images. Editable names appear in **no** screenshot; they are defined by this spec alone.

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a
**contract, not a blueprint**. It says WHAT must be true once the feature is built —
observable behaviour and the public surfaces other code depends on. It does NOT
dictate exact DOM markup, class names, CSS, or copy wording; the builder makes
those calls within the constraints below.

Five things *are* mandated because they are the explicit goals of this feature:
(a) the setup screen has **one name field per player**, live-synced to the player
count, with `Player N` placeholders (criteria 5–9); (b) names are **optional** and
fall back to `Player N`, and **never gate Start** (criteria 4, 10, 12); (c) a
single shared **`displayName(names, i)`** helper is the only fallback rule, reused
by every screen (criteria 3, 13); (d) names are shown on **Reveal, Pass, and
Results** (criteria 13–16); (e) names are **preserved on Play again** and
`App.svelte` / routing is **not** modified (criteria 2, 17). Everything else is the
builder's call.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

Files this build modifies (all already exist):

| File | State after build |
|---|---|
| `src/lib/game-state.js` | `initial` gains `names: []`. `startGame()` accepts and stores `names` (defaulting to `[]`). `playAgain()` preserves `names`; `resetGame()` clears it via `…initial`. A new exported `displayName(names, i)` returns the trimmed typed name or `` `Player ${i + 1}` ``. Other transitions and the store surface unchanged. |
| `src/screens/SetupScreen.svelte` | Local `names` seeded from `gameState`; a reactive block resizes it to the player count without losing typed values; a `{#each}` list of text inputs (placeholder `Player N`, `maxlength=20`, `bind:value`) renders below the Imposters stepper; `start()` passes `names` to `startGame()`. New name-field styles using existing tokens. `canStart` logic unchanged. |
| `src/screens/RevealScreen.svelte` | Player tag shows the current player's name (or `Player N`) **and** the existing "n of N" progress. All reveal/role/hint/advance logic untouched. |
| `src/screens/PassScreen.svelte` | Hand-off prompt and button show the next player's name (or `Player N`). `nextPlayer()` wiring untouched. |
| `src/screens/ResultsScreen.svelte` | Imposter reveal line shows imposter name(s) (or `Player N`) joined by the existing `formatList()`. Word + hint lines and "Play again" unchanged. |

Files that must **NOT** be modified by this build: `src/App.svelte` (routing already
wired), `src/lib/shuffle.js`, `src/lib/config.js`, `src/components/Stepper.svelte`,
`src/screens/DiscussionScreen.svelte`, `src/app.css`, `public/data/*`,
`src/service-worker.js`, `src/main.js`, `vite.config.js`, `package.json`,
`index.html`.

## Acceptance criteria

A build is "done" when **every** item below is true. Verify each before considering
the work complete.

### Game state (`src/lib/game-state.js`)

1. `initial` includes **`names: []`**.
2. **`startGame({ …, names })` stores `names`** in the committed state (defaulting
   to `[]` when omitted); all other committed fields behave exactly as before.
   **`playAgain()` preserves the previous round's `names`** (alongside
   `playerCount`, `impostorCount`, `wordSource`), and **`resetGame()` clears it**
   to `[]` via the `…initial` spread. `revealDone`, `nextPlayer`, `showResults`
   and the `gameState` store surface are otherwise unchanged.
3. A function **`displayName(names, i)` is exported** and returns: the entry
   `names[i]` **trimmed** when it is a non-empty string; otherwise the fallback
   `` `Player ${i + 1}` ``. It is **defensive** — a `null`/`undefined`/short
   `names` array (e.g. fewer entries than players) yields the `Player N` fallback
   rather than throwing.

### Setup screen (`src/screens/SetupScreen.svelte`)

4. **Names never gate Start.** `canStart` depends only on valid counts and a loaded
   word deck, exactly as before; a round with **every** name field blank is fully
   startable.
5. The screen renders **exactly one text input per player** (count = current Total
   Players value), placed **below the "Number of Imposters" stepper** (above the
   Word Source field).
6. Each input shows the placeholder **`Player N`** (1-based: `Player 1`,
   `Player 2`, …) and is bound two-way to its `names` entry, so typing updates
   state and the Play-again pre-fill repopulates the field.
7. **The field count tracks the player count live:** increasing Total Players adds
   fields, decreasing removes them, with the change applied at the **end** of the
   list. **Already-typed names are preserved** across a resize (e.g. typing names
   in fields 1–3 then bumping the count to 5 leaves 1–3 intact and appends two
   blanks; dropping back to 4 removes only the last field).
8. The resize logic is **guarded so it does not loop** (it only assigns when the
   length actually differs from the player count).
9. Each name input enforces a **maximum length of 20 characters** and carries an
   accessible label (e.g. `aria-label="Name for player N"`).
10. On Start, **`start()` passes the current `names` array to `startGame()`**, and
    the seeded value comes from `gameState` (so Play again pre-fills the fields).
11. The secret word and hint are **never** rendered on Setup (unchanged).

### Reveal screen (`src/screens/RevealScreen.svelte`)

12. The player tag shows **the current player's display name** (`displayName` for
    `revealIndex`) **together with** the existing **"n of N"** progress — neither
    replaces the other (e.g. "Sam — 3 of 6"; a blank name shows "Player 3 — 3 of
    6").
13. The reveal/flip (`revealed`), role selection, imposter hint, `advanceLabel`,
    and `isLastPlayer` behaviour are **unchanged** — only the player label gains
    the name.

### Pass screen (`src/screens/PassScreen.svelte`)

14. The hand-off prompt and the ready button show **the next player's display
    name** (`displayName` for `revealIndex + 1`) — e.g. "Pass to Sam" / "I'm Sam —
    tap when ready"; a blank name shows "Player N". `nextPlayer()` wiring is
    unchanged.

### Results screen (`src/screens/ResultsScreen.svelte`)

15. The imposter reveal line lists the imposter(s) **by display name** (`Player N`
    when blank), derived by mapping each imposter's **player index** through
    `displayName`, and joined by the **existing `formatList()`** ("A", "A and B",
    "A, B and C"). The singular/plural heading ("The imposter was…" / "The
    imposters were…") still matches the imposter count.
16. The secret-word line, the hint line (and its fallback), and **"Play again"**
    (which still calls `playAgain()`) are **unchanged**.

### Routing (`src/App.svelte`)

17. **`App.svelte` is not modified.** No new screen or route is added; the feature
    rides the existing setup → reveal → pass → discussion → results flow.

### Spelling (whole app)

18. All new or changed **user-facing text** is spelling-neutral or reads
    **"imposter"** (never "impostor"); existing compliant copy stays compliant.
    Internal identifiers (`isImpostor`, `impostorCount`) may keep their spelling.

### Look and feel (baseline only — design comes later)

19. The name inputs **use existing `app.css` tokens** and visually match the
    existing `.count-input` / `.source-select` controls (dark field, ≥48px tall,
    rounded, muted border). **No new colour values** are introduced; `app.css` is
    not modified.
20. **Touch targets** for inputs/buttons remain ≥44px × 44px and there is **no
    horizontal scroll** at a 375px-wide viewport. (The setup screen may scroll
    vertically at high player counts — acceptable; compact layout is deferred to
    design.)
21. **No console errors or warnings** during dev or in the built preview.

### Code quality

22. **No new dependencies.** `package.json` is unchanged.
23. **Brief explanatory comments** on each new code block per
    [technical-standards.md](../../references/technical-standards.md) — the *why* on
    the `names` state field + `displayName` helper, the seed + reactive resize in
    SetupScreen, and the name rendering on each screen.
24. **Untouched files stay untouched** — every file in the "must NOT be modified"
    list, including `App.svelte`, `app.css`, and the word data.
25. **Production build succeeds.** `npm run build` completes with no errors and no
    new warnings.

## What is NOT acceptance criteria (deferred)

- **Naming imposters specifically** — impossible without revealing them; names are
  per player.
- **Required-name enforcement or duplicate detection** — names are optional and
  free-form (only the 20-char cap applies).
- **Compact/collapsible names layout** at high player counts — a design concern for
  `03-design`; vertical scroll is acceptable here.
- **localStorage persistence** of names across app restarts — within-session
  Play-again persistence only.
- **Per-name colours / avatars / reordering.**

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder
**writes** this checklist but does **NOT** run `npm run dev` to walk it — **Rehaan
runs the app** and verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No
   console errors.
2. On Setup: one name field per player, placeholders `Player 1…N`, styled like the
   existing inputs; Start is enabled with all fields blank.
3. Bump **Total Players** up and down: fields are added/removed from the **end**;
   names already typed are **preserved**.
4. Type names in some fields, leave others blank → Start a **3-player /
   1-imposter** round. The **Reveal** tag shows "{name} — n of N" (blank →
   "Player n — n of N"); the **Pass** screen shows "Pass to {name}" / "I'm {name} —
   tap when ready".
5. Finish the round → Discussion → Results: the imposter line shows the imposter's
   **name** (or `Player N`), and the word + hint lines are intact.
6. Run a **6-player / 3-imposter** round with a mix of named and blank fields →
   Results lists all three imposters by name/`Player N`, joined "A, B and C", with
   the plural "The imposters were…" heading.
7. **Play again** → Setup returns with the previous round's names **pre-filled**.
8. At 375px width: no horizontal scroll; all inputs/buttons remain tappable.
9. Stop the dev server. Run `npm run build`: it succeeds with no new errors or
   warnings.

If any one of criteria 1–25 fails, the build is not yet done.

## Open questions for the builder

- **Reveal tag format.** Whether the name leads ("Sam — 3 of 6") or the progress
  leads is the builder's call, provided both the name and "n of N" are present
  (criterion 12).
- **Resize implementation.** Append-`''`/`slice` vs another non-destructive resize
  is the builder's call, provided typed names survive and there's no reactive loop
  (criteria 7–8).
- **`displayName` location.** Living in `game-state.js` (next to the state it reads)
  is expected, but a small shared util is acceptable as long as it's the single
  source of the fallback rule (criterion 3).
- **Max-length value.** 20 is the chosen cap to keep lines from wrapping; minor
  variation is acceptable if downstream lines still read cleanly at 375px.

## Next step

This spec is the contract for the build at
`02-development/workflow/03-builds/imposter-game-app/`. Implementing it is the
brief → spec → **build** stage; verify against criteria 1–25 and the smoke test
before considering the Editable Player Names feature done.

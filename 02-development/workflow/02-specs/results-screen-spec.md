# Spec — Results Screen (Reveal + Play Again)

## Source brief

[02-development/workflow/01-brief/results-screen-brief.md](../01-brief/results-screen-brief.md)

> ⚠️ **If you open any reference screenshot, read [CORRECTIONS.md](../../../01-plan/references/examples-of-good-work/CORRECTIONS.md) first** — it overrides the images. There is **no** Results-screen screenshot; Results is defined by this spec alone.

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a **contract, not a blueprint**. It says WHAT must be true once the feature is built — observable behaviour and the public surfaces other code depends on. It does NOT dictate exact DOM markup, class names, CSS, or copy wording; the builder makes those calls within the constraints below.

Five things *are* mandated because they are the explicit goals of this feature: (a) **Play again preserves settings** (criteria 2, 14–15); (b) a **confirmation step** sits between the Discussion reveal button and the Results screen, built as a **separable block** so a future Settings toggle can gate it (criteria 7–10); (c) imposters are identified **by player number** on Results (criteria 11–12); (d) all user-facing copy is spelled **"imposter"** (criterion 20); (e) **`App.svelte` routing is not modified** — the `results` branch already exists (criterion 19). Everything else is the builder's call.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

Files this build modifies (all already exist):

| File | State after build |
|---|---|
| `src/lib/game-state.js` | Adds `showResults()` and `playAgain()`; keeps `resetGame()` (now unreferenced in the UI but retained). Existing `startGame`/`revealDone`/`nextPlayer` unchanged. |
| `src/screens/DiscussionScreen.svelte` | "Play again" + `resetGame` import + "coming soon" line removed; gains a discuss prompt, a "Reveal the imposter(s)" button, and a Confirm/Cancel guard. |
| `src/screens/ResultsScreen.svelte` | Real screen: imposter(s) by player number + the secret word + a "Play again" button. |
| `src/screens/SetupScreen.svelte` | Editing fields seed from `gameState` when present (returning via Play again), else `DEFAULT_*`. No other behaviour changes. |
| `src/screens/RevealScreen.svelte` | **Copy-only:** user-facing "impostor" strings changed to "imposter". No logic change. |

Files that must **NOT** be modified by this build: `src/App.svelte` (the `results` route already exists — do not touch routing), `src/lib/shuffle.js`, `src/lib/config.js`, `src/lib/word-source.js`, `src/components/Stepper.svelte`, `src/screens/PassScreen.svelte`, `public/data/common-nouns.json`, `src/app.css`, `src/service-worker.js`, `src/main.js`, `vite.config.js`, `package.json`, `index.html`.

## Acceptance criteria

A build is "done" when **every** item below is true. Verify each before considering the work complete.

### Game state (`src/lib/game-state.js`)

1. **`showResults()` is exported** and sets `screen === 'results'`, leaving every other field (`roles`, `word`, `impostorCount`, `playerCount`, `wordSource`, `revealIndex`) **unchanged**.
2. **`playAgain()` is exported** and, in one update: sets `screen === 'setup'`; **preserves** `playerCount`, `impostorCount`, and `wordSource` at their current values; and **clears** `roles` to `[]`, `revealIndex` to `0`, and `word` to `null`.
3. **`resetGame()` is unchanged** — still exported, still returns the store to the full initial shape (the four config fields null, `roles: []`, `revealIndex: 0`, `screen: 'setup'`). It is retained even though no UI calls it after this build.
4. **The existing transitions are intact:** `startGame`, `revealDone`, and `nextPlayer` behave exactly as before, and `gameState` remains a Svelte store-like value (usable as `$gameState`).

### Discussion screen (`src/screens/DiscussionScreen.svelte`)

5. **The "Play again" button is gone** from this screen, and the screen no longer imports `resetGame`. The "(Discussion timer & voting coming soon.)" placeholder line is removed. A short discuss prompt remains.
6. **A primary "Reveal" button is present**, its label pluralised by impostor count: **"Reveal the imposter"** when `$gameState.impostorCount === 1`, **"Reveal the imposters"** when `> 1`.
7. **Tapping Reveal does NOT navigate straight to Results.** It opens a **confirmation step** (e.g. an in-screen prompt) that states the action ends the round / reveals the answer, and offers **Confirm** and **Cancel**.
8. **Cancel** dismisses the confirmation and returns to the discuss view; no navigation happens and nothing about roles or the word is shown.
9. **Confirm calls `showResults()`**, after which the app renders the Results screen.
10. **The confirmation is a separable block** — implemented so it can later be skipped by a setting without restructuring the screen (e.g. one local flag / one guarded handler, not logic scattered through the markup). *(Forward-looking requirement; a reviewer checks it's cleanly isolated, not that a toggle exists.)*
11. **No role or word information appears on Discussion** at any point — not the word, not who the imposter is, not before or during the confirmation. Those are revealed only on Results.

### Results screen (`src/screens/ResultsScreen.svelte`)

12. **It names the imposter(s) by player number** — for every `roles` entry with `isImpostor === true`, its player number is its index `+ 1` (the same 1-based numbering shown on reveal/pass). **All** imposters are listed; the count shown equals `impostorCount`. Singular vs. plural phrasing reflects the count (e.g. *"The imposter was Player 3"* vs *"The imposters were Player 2 and Player 5"*).
13. **The imposter numbers match reality** — they are exactly the players who saw the imposter card during the reveal loop for that round.
14. **It shows the secret word** — `gameState.word`, presented as the round's word.
15. **A "Play again" button is present** and calls `playAgain()` (criterion 2), returning to Setup.
16. **Results reads from `gameState`** and is shown only when `screen === 'results'`; it does not depend on any new top-level state beyond what `gameState` already carries.

### Setup screen (`src/screens/SetupScreen.svelte`)

17. **Returning via Play again pre-fills the form:** when the screen mounts and `gameState` already holds non-null `playerCount` / `impostorCount` / `wordSource` (the case after `playAgain()`), the player stepper, imposter stepper, and word-source dropdown initialise to **those** values — not the hard-coded defaults — and the word list for that source loads (the existing `onMount` load keyed off the selected source).
18. **First-ever load is unchanged:** with `gameState` at its initial nulls (no prior round), the form shows `DEFAULT_PLAYERS` (6), `DEFAULT_IMPOSTORS` (1), and `DEFAULT_WORD_SOURCE`, exactly as today.
19. **All existing editing behaviour still works** — steppers, the impostor-max clamp, the word-source dropdown, the "Loaded N…" confirmation, and Start-gating (valid counts **and** words loaded). Pressing **Start** still picks a fresh word via the existing `pickWord(words)` and calls `startGame(...)`; the secret word is never rendered on Setup.

### Reveal screen — copy only (`src/screens/RevealScreen.svelte`)

20. **User-facing strings read "imposter":** the role card's "YOU ARE THE IMPOSTOR!" becomes the **"imposter"** spelling, and the "help identify the impostors" supporting line likewise. This is a **text-only** change — the reveal/flip logic, role selection, and advance behaviour are untouched.

### Routing (`src/App.svelte`)

21. **`App.svelte` is not modified.** The existing `{#if}` ladder already renders `ResultsScreen` when `$gameState.screen === 'results'`; this feature reaches that branch via `showResults()` without any routing change.

### Spelling (whole app)

22. **No user-facing "impostor" remains anywhere** in the running app — Discussion, Results, Reveal, and any other screen all read **"imposter" / "imposters"**. (Internal identifiers such as `isImpostor` / `impostorCount` may keep the old spelling; this criterion is about visible text only.)

### Look and feel (baseline only — design comes later)

23. **Uses existing `app.css` tokens** for colour; no new colour values are introduced. (Emphasising the imposter names or the word with existing tokens like `--error` / `--accent` is encouraged; the exact choice is the builder's.)
24. **Touch targets** for the reveal/confirm/cancel/play-again buttons are at least 44px × 44px, and there is **no horizontal scroll**, at a 375px-wide viewport.
25. **No console errors or warnings** during dev or in the built preview.

### Code quality

26. **No new dependencies.** `package.json` is unchanged.
27. **Brief explanatory comments** on each new code block per [technical-standards.md](../../references/technical-standards.md) — the *why* on `showResults`/`playAgain`, the confirm guard, the imposter-number derivation, and the Setup seeding.
28. **Untouched files stay untouched** — every file in the "must NOT be modified" list above, including `App.svelte` and `app.css`.
29. **Production build succeeds.** `npm run build` completes with no errors and no new warnings.

## What is NOT acceptance criteria (deferred)

These are explicitly **not** required for this build to be done:

- **A Settings menu, or an actual toggle for the confirmation guard / a "reset to defaults" action.** The confirm step must merely be *built to be toggleable* (criterion 10); no settings UI is added now. `resetGame()` is kept for that future use.
- **Real discussion mechanics** (timer, voting) — Discussion stays a prompt + the reveal trigger.
- **Renaming code identifiers** `isImpostor` / `impostorCount` to the "imposter" spelling — out of scope; only visible text changes.
- **Per-player breakdown, vote tallies, win/lose scoring, player names.**
- **Card animation, theming, icons, or any visual polish** — design comes via `03-design/` later.

## Verification

Manual smoke-test sequence the builder (or a reviewer) walks through end-to-end:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console errors.
2. On Setup, leave defaults (6 players, 1 imposter), wait for "Loaded N…", press **Start**, and play through all six reveals to reach **Discussion**.
3. Discussion shows a discuss prompt and a **"Reveal the imposter"** button. There is **no** "Play again" button and **no** "coming soon" line.
4. Tap **Reveal** → a confirmation appears (ends-the-round wording, Confirm/Cancel). Tap **Cancel** → back to the discuss view; nothing revealed.
5. Tap **Reveal** → **Confirm** → the **Results** screen.
6. Results names the imposter **by player number**, and that number matches the player who saw the imposter card; the **secret word** shown equals the word crewmates saw.
7. Tap **Play again** → **Setup**, pre-filled with **6 players / 1 imposter / the same word source**; the "Loaded N…" chip reflects that source.
8. Press **Start** again → a new round runs; the secret word may differ and imposter positions are re-shuffled.
9. Run a game with **6 players / 3 imposters** through to Results: **all three** imposters are listed by player number, matching who saw the imposter card.
10. Scan every screen's visible text: it reads **"imposter"** everywhere, including the Reveal card — no "impostor".
11. At 375px width on Discussion / Results: no horizontal scroll; all buttons remain tappable.
12. **Hard-reload** the app (fresh load, no prior round): Setup shows defaults 6 / 1 / default source.
13. Stop the dev server. Run `npm run build`: it succeeds with no new errors or warnings.

If any one of criteria 1–29 fails, the build is not yet done.

## Open questions for the builder

- **Confirmation representation.** A local `confirming` flag toggling between the discuss view and the prompt is the suggested shape (mirrors `RevealScreen`'s `revealed`), but any approach is fine provided criteria 7–11 hold and the guard stays a separable block.
- **Imposter-list phrasing.** How multiple player numbers are joined (commas, "and" before the last, a list) is the builder's call, as long as all imposters are shown and the singular/plural reads naturally (criterion 12).
- **Setup seeding mechanism.** Reading `gameState` once at init (e.g. `get(gameState)`) is expected and correct, because the `{#if}` ladder remounts `SetupScreen` on each return to Setup. If the build instead keeps `SetupScreen` mounted, the seed **must** become a reactive re-read, or a preserved config won't show (failing criterion 17).
- **Reactive primitive.** `game-state.js` currently uses `writable`. Keep it or move to runes, provided the public surface (`gameState`, `startGame`, `revealDone`, `nextPlayer`, `resetGame`, plus the new `showResults`, `playAgain`) is preserved.
- **Confirm copy.** Exact wording of the confirmation prompt and button labels is the builder's, as long as it clearly conveys that confirming ends the round and reveals the answer.

## Next step

This spec is the contract for the build at `02-development/workflow/03-builds/imposter-game-app/`. Implementing it is the brief → spec → **build** stage; verify against criteria 1–29 and the smoke test before considering the Results feature done.

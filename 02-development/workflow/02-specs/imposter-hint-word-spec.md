# Spec — Imposter Hint Word

## Source brief

[02-development/workflow/01-brief/imposter-hint-word-brief.md](../01-brief/imposter-hint-word-brief.md)

> ⚠️ **If you open any reference screenshot, read [CORRECTIONS.md](../../../01-plan/references/examples-of-good-work/CORRECTIONS.md) first** — it overrides the images. The hint feature appears in **no** screenshot; it is defined by this spec alone. Where it touches the imposter reveal card, this spec wins over the image.

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a **contract, not a blueprint**. It says WHAT must be true once the feature is built — observable behaviour and the public surfaces other code depends on. It does NOT dictate exact DOM markup, class names, CSS, or copy wording; the builder makes those calls within the constraints below.

Six things *are* mandated because they are the explicit goals of this feature: (a) **every secret word carries a hint**, stored as `{ word, hint }` objects in the deck (criteria 1–5); (b) the hint is shown **only to the imposter**, behind the existing tap-to-reveal, and **never** on the crewmate card (criteria 15–18); (c) the hint is shown to **everyone on Results** (criteria 20–21); (d) a hint problem **degrades gracefully** to **"An error occurred."** and only a *whole-deck* load failure blocks Start — a strict per-entry validator is **forbidden** (criteria 6, 13, 16, 21); (e) all imposters in a round **share the one hint** (criterion 23); (f) `App.svelte` / routing is **not** modified (criterion 24). Everything else is the builder's call.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

Files this build modifies (all already exist):

| File | State after build |
|---|---|
| `public/data/common-nouns.json` | All 517 entries are `{ "word": "…", "hint": "…" }` objects; every hint authored per the rule below. Same 517 words, none dropped or altered. |
| `src/lib/word-source.js` | **Comment-only.** `loadWords()` and `pickWord()` already pass through / pick from the array generically, so no logic changes — only the stale "array of word strings" / "pick one random word" docstrings are updated to describe `{ word, hint }` entries. |
| `src/lib/game-state.js` | `initial` gains `hint: null`; `startGame()` accepts and stores `hint`. `playAgain()` / `resetGame()` and other transitions unchanged. |
| `src/screens/SetupScreen.svelte` | `start()` extracts `word` and `hint` defensively from the picked entry and passes both to `startGame()`. No other behaviour changes. |
| `src/screens/RevealScreen.svelte` | Imposter branch gains a hint line (with an "An error occurred." fallback) and a reworded sub-line. Crewmate branch and all reveal/advance logic untouched. |
| `src/screens/ResultsScreen.svelte` | Gains a hint line (with an "An error occurred." fallback) below the existing word line. Imposter-by-number line and "Play again" unchanged. |

Files that must **NOT** be modified by this build: `src/App.svelte` (routing already wired — do not touch), `src/lib/shuffle.js`, `src/lib/config.js`, `src/components/Stepper.svelte`, `src/screens/PassScreen.svelte`, `src/screens/DiscussionScreen.svelte`, `src/app.css`, `src/service-worker.js`, `src/main.js`, `vite.config.js`, `package.json`, `index.html`.

## The hint authoring rule

The deck's 517 hints are content this build authors. Each hint must:

- name a **broad, high-level association** — *a touch broader than the immediate category*. e.g. `apple → "food"` (not "fruit"), `anchor → "something at sea"`, `bicycle → "gets you around"`, `baby → "a living thing"`.
- give the imposter a **safe, generic angle** to talk from without naming or strongly implying the word. The hint is a **discussion-participation aid**, *not* a pointer to the word.
- be **short** (1–3 words / a brief phrase), **lowercase**, **no trailing punctuation** — matching the existing word-list style.
- **may repeat** across words (`"food"` covers apple, bacon, banana…). Do not force uniqueness.

**Calibrate first:** produce a worked sample of ~15–20 word→hint pairs and sanity-check the tone before generating all 517.

## Acceptance criteria

A build is "done" when **every** item below is true. Verify each before considering the work complete.

### Deck data (`public/data/common-nouns.json`)

1. The file is a valid JSON **array of objects**; **no bare strings remain**. Each element has exactly the shape `{ "word": <string>, "hint": <string> }` (extra keys are not expected).
2. **Every entry has a non-empty `word` and a non-empty `hint`** (after trimming) — there are no missing or blank hints in the shipped deck.
3. **The word set is preserved:** the 517 `word` values are exactly the 517 words that existed before this build — none added, dropped, renamed, or reordered in a way that loses a word. (The conversion *adds* hints; it does not edit the word list.)
4. **The hints follow the authoring rule** — short, lowercase, no trailing punctuation, broad/vague rather than a near-synonym or definitional pointer. Duplicate hints across words are acceptable. (A reviewer spot-checks a sample for the vague-not-pointer intent.)
5. The source metadata is unchanged: the deck still loads under the existing `common-nouns` source and the loaded **count is 517** with the `common nouns` count-noun.

### Word source (`src/lib/word-source.js`)

6. `loadWords()` returns the parsed array (now of entry objects) and **keeps** the existing `Array.isArray` guard that throws on a non-array payload or failed fetch. It does **NOT** gain a per-entry validity check that throws — bad entries are tolerated and handled downstream (criteria 13, 16, 21).
7. `pickWord(words)` still returns one uniformly-random element of the array (now an entry object), remains **pure** (no mutation of the input), and its selection logic is unchanged.
8. The module's **public surface is preserved** — `WORD_SOURCES`, `DEFAULT_WORD_SOURCE`, `loadWords`, and `pickWord` are all still exported with the same signatures. Any change here is comments only.

### Game state (`src/lib/game-state.js`)

9. `initial` includes **`hint: null`** alongside `word`.
10. **`startGame({ playerCount, impostorCount, wordSource, word, hint })` stores `hint`** in the committed state next to `word`; all other committed fields behave exactly as before.
11. **`playAgain()` and `resetGame()` reset `hint` to `null`** (via the existing `…initial` spread) so a fresh hint is chosen at the next Start, mirroring how `word` already resets. `revealDone`, `nextPlayer`, `showResults` and the `gameState` store surface are otherwise unchanged and `$gameState` still works.

### Setup screen (`src/screens/SetupScreen.svelte`)

12. **`start()` picks the entry once and extracts defensively:** word as `entry.word ?? entry` and hint as `entry.hint ?? null`, passing **both** to `startGame()`. (The `?? entry` fallback means an old-format bare string still yields a playable word.) The entry is not picked twice.
13. **Whole-deck load failure is unchanged:** a failed fetch / non-array payload still shows the existing "couldn't load… try again" message and **keeps Start disabled**. The "✓ Loaded 517 common nouns" confirmation, Start-gating (valid counts **and** words loaded), and all stepper/dropdown behaviour are otherwise unchanged.
14. **Neither the secret word nor the hint is ever rendered on Setup.**

### Reveal screen — imposter branch (`src/screens/RevealScreen.svelte`)

15. When the current player is the imposter and has tapped to reveal, the card shows **the hint word** (`$gameState.hint`) in addition to the **"YOU ARE THE IMPOSTER!"** title, and the supporting sub-line is reworded to frame the hint as a blend-in aid.
16. **Graceful fallback:** when `$gameState.hint` is `null`, empty, or whitespace-only, the imposter card shows **"An error occurred."** in place of the hint. The round still proceeds normally — the advance button (`revealDone`) still works.
17. **The hint is gated behind the existing tap-to-reveal** (`revealed` flag): nothing about the hint appears until the current player taps. The face-down prompt is unchanged.
18. **The crewmate branch is unchanged** — it shows the secret word, **no** hint and **no** "An error occurred." line. The reveal/flip logic, role selection, `advanceLabel`, and `isLastPlayer` behaviour are untouched.

### Results screen (`src/screens/ResultsScreen.svelte`)

19. The existing content is preserved: the imposter(s)-by-player-number line and the secret-word line still render as before, and **"Play again"** still calls `playAgain()`.
20. **Results shows the hint to everyone:** when `$gameState.hint` is a non-empty string, a line presents it (e.g. *The imposter's hint was "…"*), placed with the word/imposter information.
21. **Graceful fallback:** when `$gameState.hint` is `null`, empty, or whitespace-only, that hint line shows **"An error occurred."** instead. The rest of the screen is unaffected.

### Shared-hint behaviour (whole round)

22. The hint displayed is the round's single `gameState.hint`, chosen once at Start with the word.
23. **With multiple imposters, every imposter sees the same hint.** There is no per-imposter hint state or per-imposter selection logic.

### Routing (`src/App.svelte`)

24. **`App.svelte` is not modified.** No new screen or route is added; the feature rides the existing reveal → … → results flow.

### Spelling (whole app)

25. All new or changed **user-facing text reads "imposter"** (never "impostor"); existing compliant copy stays compliant. The new `hint` field/identifier is spelling-neutral, and internal identifiers (`isImpostor`, `impostorCount`) may keep their current spelling.

### Look and feel (baseline only — design comes later)

26. **Uses existing `app.css` tokens** for colour; no new colour values are introduced. (Styling the hint with existing tokens is encouraged; the exact choice is the builder's.)
27. **Touch targets** for the reveal/advance/play-again buttons remain ≥44px × 44px, and there is **no horizontal scroll**, at a 375px-wide viewport.
28. **No console errors or warnings** during dev or in the built preview.

### Code quality

29. **No new dependencies.** `package.json` is unchanged.
30. **Brief explanatory comments** on each new code block per [technical-standards.md](../../references/technical-standards.md) — the *why* on the `hint` state field, the defensive extraction in `start()`, and the hint/fallback rendering on Reveal and Results.
31. **Untouched files stay untouched** — every file in the "must NOT be modified" list above, including `App.svelte` and `app.css`.
32. **Production build succeeds.** `npm run build` completes with no errors and no new warnings.

## What is NOT acceptance criteria (deferred)

These are explicitly **not** required for this build to be done:

- **An on/off toggle for the hint, or any Settings UI.** The `{ word, hint }` model is built ready for it, but no toggle/state is added now.
- **Hints for any deck other than Common Nouns** — none exists yet.
- **Per-imposter distinct hints** — the shared single hint is intentional; do not build a per-imposter system.
- **A strict load-time validator** that disables Start on a malformed entry — explicitly rejected in favour of graceful degrade. Only a whole-deck failure blocks Start.
- **Renaming code identifiers** `isImpostor` / `impostorCount`.
- **Card animation, theming, icons, or any visual polish** — design comes via `03-design/` later.

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder **writes** this checklist but does **NOT** run `npm run dev` to walk it — **Rehaan runs the app** and verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console errors.
2. On Setup, the confirmation reads **"✓ Loaded 517 common nouns"** and Start is enabled.
3. Start a **3-player / 1-imposter** round. Play the reveals: on the **imposter's** card, after tapping, **"YOU ARE THE IMPOSTER"** *and* a **hint word** appear. On each **crewmate's** card, the **secret word** appears with **no** hint and no error line.
4. The hint shown matches its secret word (spot-check against the JSON entry).
5. Finish the round → Discussion → **Reveal** → Results. Results shows the imposter(s), the **secret word**, **and** the **hint word**.
6. **Play again** → run another round. A new word is picked **and** its matching hint (the hint changes together with the word).
7. Run a **6-player / 3-imposter** round: **all three** imposters see the **same** hint on their cards; Results shows that one hint.
8. *(Negative — graceful degrade)* In the JSON, blank one entry's `hint` and force that word to be picked → the game **still plays**; the imposter card and the Results line show **"An error occurred."**; **Start is not disabled**. (Restore the entry afterwards.)
9. *(Negative — whole-deck failure)* Make the file an invalid JSON array (or block the fetch) → Setup shows **"couldn't load… try again"** and **Start stays disabled**. (Restore afterwards.)
10. Scan visible text across Setup / Reveal / Results: it reads **"imposter"** everywhere — no "impostor".
11. At 375px width: no horizontal scroll on Reveal / Results; all buttons remain tappable.
12. Stop the dev server. Run `npm run build`: it succeeds with no new errors or warnings.

If any one of criteria 1–32 fails, the build is not yet done.

## Open questions for the builder

- **Hint presentation.** The imposter-card label (e.g. *"Your hint:"*), the reworded sub-line, and the Results line wording (e.g. *The imposter's hint was "…"*) are the builder's call, provided criteria 15–21 hold.
- **Error wording.** **"An error occurred."** is the intended fallback text (Rehaan wants a recognisable signal he can troubleshoot). Minor variation is acceptable only if it still clearly reads as an error and can't be mistaken for a real hint — keep it close to this wording.
- **"No hint" test.** Treat `null`, empty string, and whitespace-only `hint` all as "no hint" → fallback. Whether this is an inline check or a small derived `hasHint` reactive is the builder's call.
- **Authoring the 517 hints.** This is the bulk of the effort and is subjective; calibrate on the ~15–20-pair sample first, keep hints deliberately vague, and lean on repetition rather than straining for unique-but-pointed hints.
- **Reactive primitive.** `game-state.js` currently uses `writable`. Keep it or move to runes, provided the public surface (`gameState`, `startGame`, `revealDone`, `nextPlayer`, `showResults`, `playAgain`, `resetGame`) is preserved.

## Next step

This spec is the contract for the build at `02-development/workflow/03-builds/imposter-game-app/`. Implementing it is the brief → spec → **build** stage; verify against criteria 1–32 and the smoke test before considering the Imposter Hint Word feature done.

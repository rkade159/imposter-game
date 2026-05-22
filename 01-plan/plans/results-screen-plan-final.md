# Results Screen (Reveal + Play Again) Plan (Final)

## Why this plan exists

The gameplay loop currently dead-ends at the **Discussion** screen, which carries
a placeholder **"Play again"** button (`resetGame()` → Setup). The
[ResultsScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/ResultsScreen.svelte)
is a stub — wired into [App.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/App.svelte)'s
`{#if}` ladder but **never reached**. So a round has no payoff: the app never
reveals who the imposter was or what the word was.

This plan adds the payoff. Discussion gains a **"Reveal the imposter(s)"** button
that (after a confirm) ends the round and routes to a real **Results** screen,
which names the imposter(s), shows the secret word, and offers **"Play again"**.
"Play again" **moves off Discussion onto Results**, where the round actually ends.

**Intended outcome:** `setup → reveal ⇄ pass → discussion → results` becomes a
complete loop with a real ending and a clean, settings-preserving restart. Builds
directly on [reveal-pass-screens-plan-final.md](reveal-pass-screens-plan-final.md).

## The feature

1. **Discussion screen reworked.** Remove the **"Play again"** button and the
   `resetGame` import; drop the "(Discussion timer & voting coming soon.)"
   placeholder — timer/voting are explicitly *not wanted*. Keep the discuss
   prompt and add a primary button labelled **"Reveal the imposter"** (or
   **"Reveal the imposters"** when `impostorCount > 1`).
2. **Confirmation guard.** Tapping Reveal does **not** jump straight to results.
   A local confirm step (mirrors `RevealScreen`'s local `revealed` flag pattern)
   shows *"Reveal the answer? This ends the round."* with **Confirm** / **Cancel**.
   Confirm → `showResults()`; Cancel → back to the discuss view. Prevents an
   accidental tap from spoiling the game for everyone. **Kept deliberately** — a
   future Settings menu will let players toggle it on/off (see *What's deferred*),
   so it is built as a cleanly separable step, not hard-wired.
3. **Results screen built.** Reads `roles`, `word`, `impostorCount` from
   `gameState`. Names the imposter(s) **by player number** (the same 1-based
   numbering used on reveal/pass): *"The imposter was Player 3"* or *"The
   imposters were Player 2 and Player 5"*. Shows the secret word: *The word was
   "banana".* Then a **"Play again"** button.
4. **Play again preserves settings.** Instead of the old full reset, Play again
   returns to Setup with the previous round's **player count, imposter count, and
   word source pre-filled**, so the same group re-runs immediately. The secret
   word is **freshly picked at the next Start** (only the *source* is remembered,
   not the word).
5. **Routing.** No `App.svelte` change — the `results` branch already exists. The
   two new transitions live in `game-state.js`.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Imposter identification | **By player number** (e.g. "Player 3"), pluralised list for multiple | Matches the `Player N` numbering on reveal/pass; players aren't named. *(Rehaan's choice.)* |
| Reveal confirmation | **Local confirm step** on Discussion (Confirm/Cancel), no new route; **kept, not removable** | Guards an accidental spoiler tap; reuses the local-flag pattern already in `RevealScreen`. A future Settings menu will toggle it, so it's built as a separable step. *(Rehaan's choice.)* |
| Play again behaviour | **Preserve settings** via a new `playAgain()` | Same group replays fast; the word is re-picked at Start so only the source carries over. *(Rehaan's choice.)* |
| "Play again" location | **Moves from Discussion → Results** | Restart belongs at the *true end* of the round (after the reveal), not before it. |
| Where transitions live | `showResults()` + `playAgain()` in `game-state.js` | Consistent with `startGame`/`revealDone`/`nextPlayer` living there as pure store writes. |
| Setup pre-fill mechanism | `SetupScreen` seeds `players`/`impostors`/`selectedSource` from `gameState` when set, else `DEFAULT_*` | The screen currently hardcodes defaults and never reads the store, so "keep settings" needs this to actually show in the form. |
| `resetGame()` fate | Retained as the documented **hard reset**; now **unreferenced in the UI** | Its only consumer (Discussion "Play again") is replaced by `playAgain()`. Kept as the canonical full reset. **Do not delete** — useful for the future Settings menu's "reset to defaults". |
| User-facing spelling | **"Imposter" / "Imposters"** everywhere user-visible | Rehaan's correction — the word is spelled *imposter*, not *impostor*. This build also normalises the existing **"YOU ARE THE IMPOSTOR!"** copy on `RevealScreen` to *imposter*. Recorded in [technical-standards.md](../../02-development/references/technical-standards.md) and [design-system.md](../../03-design/references/design-system.md) so future work matches. Internal identifiers (`isImpostor`, `impostorCount`) keep their current spelling this round — an optional rename is noted under *deferred*. |

## How it fits the architecture

This closes the state machine the tech-stack plan promised. Prior plans built
`setup → reveal ⇄ pass → discussion`; this plan turns the dangling `results`
branch into the loop's real terminus and adds the restart edge back to setup.

```
screen: 'discussion'   (discuss prompt + "Reveal the imposter(s)")
   │ tap Reveal  → local `confirming = true`  (Confirm / Cancel)
   │                         └ Cancel → back to discuss view
   ▼ Confirm → showResults()
screen: 'results'      names imposter(s) by player number + the secret word
   │ "Play again" → playAgain()  (preserve playerCount/impostorCount/wordSource;
   ▼                              clear roles/revealIndex/word)
screen: 'setup'        form PRE-FILLED from the preserved config; new word at Start
```

Imposter numbers come straight from the existing `roles` array — `roles[i]` is
player `i` (0-based), shown 1-based:

```
roles = [ {imp:false}, {imp:true}, {imp:false}, {imp:false}, {imp:true} ]
          Player 1      Player 2     Player 3      Player 4     Player 5
                        └────────── imposters: "Player 2 and Player 5" ──┘
```

## Files this affects

| File | Change |
|---|---|
| [src/lib/game-state.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/game-state.js) | Add `showResults()` (sets `screen:'results'`). Add `playAgain()`: back to `screen:'setup'`, **keep** `playerCount`/`impostorCount`/`wordSource`, **clear** `roles`/`revealIndex`/`word`. Update the now-stale `resetGame()` comment; `resetGame()` stays as the hard reset (currently unreferenced — kept for the future Settings menu). |
| [src/screens/DiscussionScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/DiscussionScreen.svelte) | Remove the `resetGame` import, the **"Play again"** button, and the "coming soon" placeholder. Add a local `confirming` flag. Render either: the discuss view with a **"Reveal the imposter(s)"** button (label pluralised via `$gameState.impostorCount > 1`), or the confirm view (**Confirm** → `showResults()`, **Cancel** → `confirming = false`). |
| [src/screens/ResultsScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/ResultsScreen.svelte) | Build the real screen: derive imposter player numbers from `roles` (`roles.map((r,i)=>…).filter(r=>r.isImpostor)` → `i+1`), render the pluralised imposter sentence + the secret `word`, and a **"Play again"** button → `playAgain()`. |
| [src/screens/SetupScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) | Seed `players`/`impostors`/`selectedSource` from the current `gameState` values when present (read once at init via `get(gameState)`), falling back to `DEFAULT_PLAYERS`/`DEFAULT_IMPOSTORS`/`DEFAULT_WORD_SOURCE`. The existing `onMount` word-load keys off `selectedSource`, so the remembered source loads automatically. |
| [src/screens/RevealScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte) | **Copy-only:** change the user-facing **"YOU ARE THE IMPOSTOR!"** and "help identify the impostors" strings to the *imposter* spelling. No logic change. (Brings the existing screen in line with the new spelling convention.) |

**Reused, not rebuilt:** `app.css` tokens (`--accent`, `--error`, `--bg-surface`,
`--text-muted`, `--success`), the existing `.screen` / `.start-btn` /
`.play-again-btn` style patterns, the `gameState` store + reactive-`$`-read
conventions, and `RevealScreen`'s local-flag pattern for the confirm step.
`App.svelte`, `config.js`, `word-source.js`, and `Stepper.svelte` are untouched.

## What's deferred (out of scope)

- **Settings menu** — a future feature; will (among other things) let players **toggle the confirmation guard** on/off and offer a "reset to defaults" that uses the retained `resetGame()`. The confirm step here is built to be cleanly toggleable so that work is easy later.
- **Real discussion mechanics (timer, voting)** — explicitly not wanted; Discussion is just the discuss prompt + the reveal trigger.
- **Renaming code identifiers `isImpostor` / `impostorCount`** to the *imposter* spelling — an optional, app-wide cleanup; out of scope here to avoid churn. User-facing copy is the priority and is handled.
- **Visual / design polish** — colours, icons, animation. Functional styling only; real design belongs in the `03-design` silo.
- **Per-player breakdown, vote tallies, win/lose scoring** — Results shows only the imposter(s) + the word this increment.
- **Player names** — players stay numbered.

## Acceptance (what "done" looks like for the eventual build)

From `02-development/workflow/03-builds/imposter-game-app/`, `npm run dev`:

1. Play through to **Discussion**: it shows the discuss prompt and a **"Reveal the imposter"** button (or **"Reveal the imposters"** when imposters > 1). No "Play again" here; no "coming soon" text.
2. Tap **Reveal** → a confirm prompt appears (*"Reveal the answer? This ends the round."* + Confirm/Cancel). **Cancel** returns to the discuss view; nothing revealed.
3. Tap **Reveal** → **Confirm** → the **Results** screen.
4. Results names the imposter(s) **by player number**, matching exactly who saw the imposter card during reveal; with multiple imposters, all are listed. The displayed word equals the word crewmates saw.
5. **"Play again"** → **Setup**, pre-filled with the *same* player count, imposter count, and word source as the round just played; the load chip reflects that source.
6. Press **Start** again → the round runs with a (possibly) different secret word and re-shuffled imposter positions.
7. **First-ever load** (no prior round) still shows Setup at `DEFAULT_*` values (6 / 1 / default source) — the preserve logic only kicks in after a completed round.
8. Every user-facing mention reads **"imposter"**, never "impostor" — including the updated `RevealScreen` card.
9. `npm run build` succeeds; at a 375px viewport there's no horizontal scroll and all tap targets stay ≥44px.

Verification is **manual** (`npm run dev`, then `npm run build`) — no automated
test setup, consistent with prior features. Per the agreed split, the build
**writes the checklist; Rehaan runs `npm run dev`** to verify.

## Risks / open questions

- **Confirmation guard is intentional and stays.** It adds one extra tap to end each game; that's accepted as spoiler protection, and a future Settings menu will make it optional. Built as a separable step so the toggle is easy to add.
- **`resetGame()` becomes unreferenced** but is **kept on purpose** (hard reset for the future Settings menu); its comment is corrected so it doesn't look like an oversight.
- **Setup seeding reads `gameState` once at init.** Correct here because the `{#if}` ladder remounts `SetupScreen` on each return to setup. Documented in case a later refactor keeps the component mounted (then it'd need a reactive re-seed).
- **Spelling — resolved.** All user-facing copy is "imposter" and the convention is recorded in the technical-standards and design-system references. Only the internal identifiers still read "impostor", flagged above as an optional later rename.

## Status

`final` — approved by Rehaan (2026-05-22). Brief derived from this plan lives at
[02-development/workflow/01-brief/results-screen-brief.md](../../02-development/workflow/01-brief/results-screen-brief.md);
it feeds a spec, then a build.

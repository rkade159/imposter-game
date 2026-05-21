# Spec — Reveal + Pass Screens (the Gameplay Loop)

## Source brief

[02-development/workflow/01-brief/reveal-pass-screens-brief.md](../01-brief/reveal-pass-screens-brief.md)

> ⚠️ **Before interpreting any reference screenshot, read [CORRECTIONS.md](../../../01-plan/references/examples-of-good-work/CORRECTIONS.md).** It records intentional deviations from the screenshots (two separate reveal/pass screens, tap-to-reveal, **no** "New Game" button on reveal, numbered players) and **overrides** the images.

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a **contract, not a blueprint**. It says WHAT must be true once the feature is built — observable behaviour and the public surfaces other code depends on. It does NOT dictate exact DOM markup, class names, CSS, copy wording, or how a component holds its local state; the builder makes those calls within the constraints below.

Two requirements *are* structural because they are explicit goals of the feature: (a) screen routing is driven by a `screen` field on `gameState` read by `App.svelte` (criteria 11–13), and (b) reveal and pass are **two separate screens** with a tap-to-reveal gate (criteria 17–25). Those are mandated; everything else inside the screens is the builder's call.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

Files this build modifies (all already exist — several as stubs):

| File | State after build |
|---|---|
| `src/lib/shuffle.js` | Real Fisher–Yates shuffle; pure (returns a new array). |
| `src/lib/game-state.js` | Initial shape extended with `screen`, `roles`, `revealIndex`; exports the transitions `startGame`, `revealDone`, `nextPlayer`, plus the existing `resetGame`. |
| `src/App.svelte` | Renders exactly one screen based on `$gameState.screen` (routing ladder). Header preserved. |
| `src/screens/SetupScreen.svelte` | `start()` calls `startGame(...)` and navigates to reveal; the old ready-mode confirmation is removed. |
| `src/screens/RevealScreen.svelte` | Real tap-to-reveal role screen. |
| `src/screens/PassScreen.svelte` | Real hand-off screen. |
| `src/screens/DiscussionScreen.svelte` | Still a stub, **plus** a working "Play again" button. |

Files that must **NOT** be modified by this build: `src/lib/config.js`, `src/lib/word-source.js`, `src/components/Stepper.svelte`, `public/data/common-nouns.json`, `src/app.css`, `src/screens/ResultsScreen.svelte` (stays a stub), `src/service-worker.js`, `src/main.js`, `vite.config.js`, `package.json`, `index.html`.

## Acceptance criteria

A build is "done" when **every** item below is true. Verify each before considering the work complete.

### Shuffle (`src/lib/shuffle.js`)

1. **`shuffle(items)` is exported and pure** — it returns a **new** array and does not mutate the argument (the input array's order is unchanged after the call).
2. **The result is a permutation** of the input: same length, and the same multiset of elements (nothing added, dropped, or duplicated).
3. **It is a real Fisher–Yates shuffle**, not the identity passthrough it currently is — every element can reach any position, with uniform distribution. Observable check: shuffling a long array many times produces varying orders (it is not always equal to the input order).

### Game state (`src/lib/game-state.js`)

4. **`gameState` initial value** is exactly `{ screen: 'setup', playerCount: null, impostorCount: null, wordSource: null, word: null, roles: [], revealIndex: 0 }`, and `gameState` remains a Svelte store-like value (subscribable / usable as `$gameState`).
5. **`startGame(config)` is exported.** Given `config = { playerCount, impostorCount, wordSource, word }`, after the call the store satisfies **all** of: those four fields are committed from `config`; `roles` is an array of length `playerCount`; `screen === 'reveal'`; `revealIndex === 0`.
6. **Roles are correct.** Each `roles` entry identifies its player as impostor or crewmate (e.g. `{ isImpostor: true|false }`), `roles[i]` belongs to player `i`, and **exactly `impostorCount` entries are impostors** — the rest crewmates.
7. **Impostor positions are randomised** via `shuffle` — the impostors are not always the first `impostorCount` indices; across repeated `startGame` calls with the same config, which indices are impostors varies.
8. **`revealDone()` is exported** and, based on the current `revealIndex`: if `revealIndex < playerCount - 1` it sets `screen === 'pass'` and leaves `revealIndex` unchanged; otherwise (last player) it sets `screen === 'discussion'`.
9. **`nextPlayer()` is exported** and sets `revealIndex` to its current value `+ 1` and `screen === 'reveal'`.
10. **`resetGame()` is exported** and returns the store to the exact initial shape from criterion 4 (`screen: 'setup'`, `roles: []`, `revealIndex: 0`, the four fields null).

### Routing (`src/App.svelte`)

11. **Exactly one screen renders at a time, selected by `$gameState.screen`:** `'setup'` → SetupScreen, `'reveal'` → RevealScreen, `'pass'` → PassScreen, `'discussion'` → DiscussionScreen, `'results'` → ResultsScreen. (The `'results'` branch is wired but not reached by this feature.)
12. **The global header** (`<h1>Imposter Game</h1>` + tagline) and the `.app-shell` wrapper are preserved.
13. **On first load** (`screen === 'setup'`) the Setup screen is what the user sees — the app's startup behaviour is unchanged from the user's point of view until they press Start.

### Setup screen (`src/screens/SetupScreen.svelte`)

14. **Editing behaviour is unchanged** from the current build: the player/impostor steppers, the word-source dropdown, the "Loaded N…" confirmation, and the existing Start-gating (valid counts **and** words loaded) all still work as before.
15. **Pressing Start (when enabled) calls `startGame(...)`** with the committed `{ playerCount, impostorCount, wordSource, word }` (word picked via the existing `pickWord`), and the app then shows the **Reveal screen for Player 1** — not a ready-confirmation.
16. **The old ready-mode is gone:** there is no "Game ready for N players…" confirmation and no "Change settings" button on the setup screen any more (they're unreachable once Start routes to reveal). The secret word is still **never** rendered on the setup screen.

### Reveal screen (`src/screens/RevealScreen.svelte`)

17. **Player position is shown** as "Player {revealIndex + 1} of {playerCount}" (numbering is 1-based for display).
18. **It starts face-down:** on entering the screen, the role and word are **not** visible; a clear "tap to reveal your role" affordance is shown instead.
19. **Tapping reveals the role.** A **crewmate** then sees the secret word (`gameState.word`) presented as the word to remember, plus a supporting line. An **impostor** sees an unambiguous "you are the impostor" message and a supporting line, and is **not** shown the word.
20. **Role matches `roles`:** the players whose `roles` entry is the impostor (exactly `impostorCount` of them) see the impostor card; everyone else sees the word.
21. **The advance button calls `revealDone()`**, and its **label is conditional**: for a non-last player (`revealIndex < playerCount - 1`) it reads as passing to the next player (e.g. "Hide & pass to next player"); for the **last** player it reads as continuing onward (e.g. "Hide & continue to discussion") and must **not** claim to pass to a next player.
22. **Privacy on re-entry:** each time the reveal screen is shown for a player (including after a pass), it is **face-down again** — the previous player's card is never visible when the screen appears.
23. **The word never leaks:** it is shown only on a crewmate's own revealed card — never before the flip, never to an impostor, and never on the pass screen.

### Pass screen (`src/screens/PassScreen.svelte`)

24. **It names the next player** — a hand-off prompt referencing "Player {revealIndex + 2}" (the player about to reveal) with a "tap when ready" affordance — and shows **no** role or word information.
25. **Tapping calls `nextPlayer()`**, advancing to the next player's (face-down) reveal screen.

### Loop integrity

26. **A full round walks Setup → Reveal(P1) → Pass → Reveal(P2) → … → Reveal(P last) → Discussion**, showing each player exactly once and in order. There is **no** pass step after the final player's reveal; the last reveal goes straight to discussion.

### Discussion screen (`src/screens/DiscussionScreen.svelte`)

27. **A "Play again" button is present** and, when pressed, calls `resetGame()` so the app returns to the Setup screen at defaults (players 6, impostors 1, word source re-loaded). The screen otherwise remains the existing placeholder — no real discussion mechanics.

### Look and feel (baseline only — design comes later)

28. **Uses existing `app.css` tokens** for colour; no new colour values are introduced. (Distinguishing the impostor card from the crewmate card using existing tokens such as `--error` / `--accent` / `--success` is encouraged but the exact choice is the builder's.)
29. **Touch targets** for every reveal/pass/discussion button are at least 40px × 40px, and there is **no horizontal scroll**, at a 375px-wide viewport.
30. **No console errors or warnings** during dev or in the built preview.

### Code quality

31. **No new dependencies.** `package.json` is unchanged; randomness uses `Math.random`.
32. **Brief explanatory comments** on each new code block per [technical-standards.md](../../references/technical-standards.md) — the *why* on the shuffle, `buildRoles`/the role-generation, each transition, and the tap-to-reveal logic.
33. **Untouched files stay untouched** — every file in the "must NOT be modified" list above, including `ResultsScreen.svelte` (remains a stub) and `app.css`.
34. **Production build succeeds.** `npm run build` completes with no errors and no new warnings.

## What is NOT acceptance criteria (deferred)

These are explicitly **not** required for this build to be done:

- Real discussion mechanics (timer, voting) — Discussion stays a stub apart from "Play again".
- Results screen content or a "Play again" on Results — `ResultsScreen` stays a stub and is not reached this feature.
- Any restart/abort affordance on the Reveal or Pass screens (deliberately absent).
- Card-flip animation, theming, icons, or any visual polish — design comes via `03-design/` later.
- Impostor category hint, word re-roll, player names, localStorage persistence, offline caching of the word JSON.

## Verification

Manual smoke-test sequence the builder (or a reviewer) walks through end-to-end:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console errors.
2. On the Setup screen, leave defaults (6 players, 1 impostor), wait for "Loaded N common nouns", press **Start**.
3. The **Reveal screen for Player 1** appears: it reads "Player 1 of 6" and is **face-down** — no word or role visible.
4. Tap to reveal. Player 1 sees either the word (`THE WORD IS: "…"` + supporting line) or the impostor message (no word). The advance button reads as a pass to the next player.
5. Press the advance button → **Pass screen** reading "Pass to Player 2 — tap when ready"; no role/word shown.
6. Tap → **Reveal screen for Player 2**, face-down again (Player 1's card is not visible).
7. Continue through all 6 players. Confirm exactly **one** of them (impostorCount = 1) saw the impostor message and the other five saw the word.
8. On **Player 6's** reveal, the advance button reads as continuing to discussion (not "pass to next player"), and pressing it goes **straight to the Discussion screen** — no Pass screen after the last player.
9. On the **Discussion screen**, press **"Play again"** → the app returns to the Setup screen at defaults. No page refresh was needed.
10. Run a game with a higher impostor count (e.g. 6 players, 3 impostors) and play through twice: confirm exactly 3 impostors each time and that **which** players are impostors differs between the two runs (shuffle is real).
11. Resize to 375px width on the reveal/pass/discussion screens: no horizontal scroll; all buttons remain tappable.
12. Stop the dev server. Run `npm run build`: it succeeds with no new errors or warnings.

If any one of criteria 1–34 fails, the build is not yet done.

## Open questions for the builder

- **Role entry representation.** `{ isImpostor: boolean }` is the suggested shape, but `'impostor' | 'crewmate'` strings or an impostor-index set are equally acceptable, provided criteria 6–7 and 20 hold and `roles[i]` maps to player `i`.
- **How the flip state is held.** A component-local `revealed` flag is fine. The build relies on the routing ladder destroying/recreating `RevealScreen` between players to reset it (criterion 22); if the build instead keeps the component mounted, it **must** reset the flip reactively on `revealIndex` change — otherwise the next player would see the prior card already flipped (a privacy bug, failing criterion 22).
- **Copy and labels.** Exact wording of the supporting lines and the button labels is the builder's, as long as the conditional last-player label (criterion 21) and the secrecy rules (criterion 23) hold.
- **Pass screen extras.** A progress indicator (e.g. "2 of 6 done") is welcome but optional.
- **Routing mechanism.** An `{#if}/{:else if}` ladder on `$gameState.screen` is expected, but a component-map lookup is acceptable so long as criterion 11 holds.
- **Reactive primitive.** `game-state.js` currently uses `writable`. Keep it or move to Svelte 5 runes, provided the public surface (`gameState`, `startGame`, `revealDone`, `nextPlayer`, `resetGame`) is preserved.

## Next step

This spec is the contract for the build at `02-development/workflow/03-builds/imposter-game-app/`. Implementing it is the brief → spec → **build** stage; verify against criteria 1–34 and the smoke test before considering the gameplay loop done.

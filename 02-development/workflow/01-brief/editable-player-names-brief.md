# Brief — Editable Player Names

## Source plan

[01-plan/plans/editable-player-names-plan-final.md](../../../01-plan/plans/editable-player-names-plan-final.md)

> 📝 **Process note.** This brief was written **after** the build, to give the
> feature its normal paper trail (the `plan → brief → spec → build` order was
> skipped for this one change). Future features follow the pipeline in order.

> ⚠️ **If you open any reference screenshot, read [CORRECTIONS.md](../../../01-plan/references/examples-of-good-work/CORRECTIONS.md) first** — it records intentional deviations and **overrides** the images. Editable names appear in **no** screenshot; they are defined by this brief. Where they touch the setup/reveal/pass/results screens, this brief wins.

## What to build

**Editable player names, typed on the setup screen before Start**, shown across the
whole round in place of "Player N".

Today everyone is identified by position only — "Player 1", "Player 2", … — on the
reveal, pass, and results screens. After this build:

- The **setup screen** shows a **name field per player**, directly below the
  "Number of Imposters" stepper. Each field's placeholder is `Player 1`,
  `Player 2`, … and the **list grows/shrinks live with the Total Players count**.
- Names are **optional** — a blank field falls back to its `Player N` placeholder
  wherever it's displayed, and names **never** gate Start.
- The typed names appear on **Reveal**, **Pass**, and **Results**, replacing the
  bare "Player N".
- Names are **committed at Start** and **preserved on Play again**, like the
  player count / imposter count / word source already are.

`App.svelte`, routing, `config.js`, `shuffle.js`, `Stepper.svelte`, and the word
data are **not** touched.

## Why this is being built now

1. **It personalises the round.** "Pass to Sam" and "The imposter was Priya" land
   far better than "Pass to Player 3" — it's the social, around-the-table feel the
   game is for.
2. **It's strictly additive / zero-friction.** Names are optional and fall back to
   "Player N", so a host who wants to just play loses nothing and adds no setup
   steps.
3. **It reuses the existing config lifecycle.** A `names` array threads through the
   exact path `playerCount` / `word` already travel (Start → `gameState` → screens
   → Play again), so it's a small, low-risk change.

## Scope

**In scope:**

- **Game state** — [src/lib/game-state.js](../03-builds/imposter-game-app/src/lib/game-state.js):
  - Add `names: []` to `initial` (one entry per player; `''` means "use the
    `Player N` placeholder").
  - `startGame()` accepts and stores `names` (default to `[]` if omitted).
  - `playAgain()` **preserves** `state.names` alongside the counts + word source
    (so the same group's names come back pre-filled). `resetGame()` clears them via
    `…initial`.
  - Add an exported helper **`displayName(names, i)`** → the typed name (trimmed)
    if present, else `` `Player ${i + 1}` ``. Defensive against a short/missing
    `names` array. This is the **single** name-or-fallback rule, reused everywhere.
- **Setup** — [src/screens/SetupScreen.svelte](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte):
  - Seed a local `names` from `saved.names` (the Play-again pre-fill), same pattern
    as `players` / `impostors` / `selectedSource` already use.
  - A **reactive block keeps `names.length` in sync with the player count** — grow
    by appending `''`, shrink with `slice` — and **must not clobber already-typed
    values** (append/trim at the **end**). Guard it so it only assigns when the
    length actually differs (no reactive loop).
  - Render a **`Player Names:` section** below the Imposters stepper (above Word
    Source): a `{#each names}` list of `<input type="text">` with placeholder
    `` `Player ${i + 1}` ``, `maxlength="20"`, an `aria-label`, and
    `bind:value={names[i]}`.
  - `start()` passes `names` into `startGame()`.
  - Names do **not** affect `canStart` — the Start gate (valid counts + loaded
    deck) is unchanged.
- **Reveal** — [src/screens/RevealScreen.svelte](../03-builds/imposter-game-app/src/screens/RevealScreen.svelte): the player tag shows `displayName($gameState.names, revealIndex)` **and keeps the existing "n of N" progress** (e.g. `Sam — 3 of 6`). Reveal/flip, role, hint, and advance logic untouched.
- **Pass** — [src/screens/PassScreen.svelte](../03-builds/imposter-game-app/src/screens/PassScreen.svelte): the prompt and button use the next player's name — `Pass to {name}` / `I'm {name} — tap when ready` — via `displayName($gameState.names, revealIndex + 1)`.
- **Results** — [src/screens/ResultsScreen.svelte](../03-builds/imposter-game-app/src/screens/ResultsScreen.svelte): the imposter reveal line maps imposter **indices** through `displayName` instead of `` `Player ${n}` ``; the existing `formatList()` joiner keeps working on the resulting name strings. The word + hint lines and "Play again" are unchanged.
- **Styling** — a `.name-input` that matches the existing `.count-input` /
  `.source-select` look (≥48px min-height, `border-radius: 8px`,
  `1px solid var(--text-muted)`, `var(--bg)` bg, `var(--text)` text), stacked with
  a small gap. **Reuse `app.css` tokens only** — no new colour values.
- **Mobile-responsive** — tap targets ≥44px, no horizontal scroll at 375px.
- Code follows [technical-standards.md](../../references/technical-standards.md):
  plain and simple, no new dependencies, a brief comment on each new block.

**Out of scope (do NOT build here):**

- **Naming "the imposters" specifically** — roles are secret/random, so names are
  for **every** player. Do not attempt to mark or order imposter fields.
- **Required-name enforcement / duplicate detection** — names are optional and
  free-form; blanks fall back to `Player N`. The only limit is the 20-char cap.
- **Visual / design polish** of the names section (the tall-screen-at-12-players
  layout included) — that's a `03-design` concern later. Functional styling only.
- **Persisting names across app restarts** (localStorage) — within-session
  Play-again persistence only.
- **Per-name colours / avatars**, and **`App.svelte` / routing / word-data
  changes**, and **new dependencies** of any kind.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`. No
new files — every file below already exists.

| File | Change |
|---|---|
| `src/lib/game-state.js` | `names: []` in `initial`; `startGame()` stores `names`; `playAgain()` keeps `names`; export `displayName(names, i)`. |
| `src/screens/SetupScreen.svelte` | Seed `names`; reactive resize-to-count (preserve typed values); `{#each}` of name inputs (`Player N` placeholder, `maxlength=20`, `bind:value`); pass `names` to `startGame()`; `.name-input` styling. |
| `src/screens/RevealScreen.svelte` | Player tag = `displayName(...)` + existing "n of N". |
| `src/screens/PassScreen.svelte` | "Pass to {name}" / "I'm {name} — tap when ready". |
| `src/screens/ResultsScreen.svelte` | Imposter line via `displayName` through `formatList()`. |

## Constraints worth highlighting

- **Names are optional and never block Start.** The `canStart` gate stays exactly
  as it is (valid counts + loaded deck). A round with every field blank must play
  identically to today, showing "Player N" throughout.
- **One fallback rule, one place.** All four screens read names through
  `displayName()` — do not re-implement the "name or Player N" logic per screen.
- **Resizing preserves typed names.** Growing/shrinking the player count adds/
  removes fields at the **end**; names the host already typed must survive.
- **Names live in `game-state.js`**; screens are pure reactive reads — don't write
  the store directly from a screen.
- **Spelling: "imposter", not "impostor", in user-facing text** (recorded
  standard). This feature adds only "Player Names" / "Player N" copy, so it's
  spelling-neutral; keep existing copy compliant. Internal identifiers
  (`isImpostor`, `impostorCount`) stay as-is.
- **No new dependencies** — pure Svelte. Per technical-standards: *"plainly and
  simply as possible"*, *"add comments… whenever you are coding a new code block"*.
- Works on modern browsers (Chrome, Firefox, Safari latest). Mobile-responsive —
  verify at 375px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. Setup shows one name field per player with `Player 1…N` placeholders; styling
   matches the existing inputs; Start is enabled as before.
2. Raise/lower **Total Players** → fields are added/removed from the **end**;
   names already typed are **preserved**.
3. Type a few names → Start → the names appear on the **Reveal** tag, the **Pass**
   hand-off ("Pass to …" / "I'm …"), and the **Results** reveal line.
4. Leave a field **blank** → that player shows as `Player N` everywhere, and
   **Start stays enabled**.
5. Run a **multi-imposter** round (e.g. 6 players / 3 imposters) → Results lists
   the imposters by name (or `Player N`) joined correctly ("A, B and C").
6. **Play again** → Setup returns with the previous round's names **pre-filled**.
7. At 375px width: no horizontal scroll; tap targets ≥44px.
8. `npm run build` succeeds with no new errors or warnings.

## Next step

This brief feeds
[02-development/workflow/02-specs/editable-player-names-spec.md](../02-specs/editable-player-names-spec.md),
which converts it into an acceptance-criteria contract for the build.

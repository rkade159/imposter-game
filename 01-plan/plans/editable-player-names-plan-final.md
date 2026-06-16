# Editable Player Names Plan (Final)

## Why this plan exists

> 📝 **Process note.** This plan was written **after** the feature was already
> built — the normal `plan → brief → spec → build` order was skipped for this one
> change. It is reconstructed here so the feature has the same paper trail as every
> other feature and so the brief/spec exist for future reference. From now on,
> features (development **or** design) follow the pipeline in order.

Today every player is identified by **position only** — "Player 1", "Player 2", …
— derived from the player count. The reveal, pass, and results screens all print
the bare number ([RevealScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte),
[PassScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/PassScreen.svelte),
[ResultsScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/ResultsScreen.svelte)).

This plan lets the host **type real names on the setup screen before Start**, so
each round is personalised — "Pass to Sam", "The imposter was Priya" — instead of
"Pass to Player 3". The list of name fields **grows and shrinks with the player
count**, each field carries a "Player N" placeholder, and the fields match the
existing dark control styling already on the screen.

**Intended outcome:** a friendlier, more personal pass-and-play round, with names
threaded through every screen that previously said "Player N", and **zero new
friction** — names are optional, so a host who just wants to play can leave them
all blank and get the old "Player N" behaviour for free.

## The feature

1. **A name field per player on Setup.** Below the "Number of Imposters" stepper,
   the setup screen shows one text input per player, placeholder `Player 1`,
   `Player 2`, … The list resizes live as the Total Players stepper changes.
2. **Names are optional.** A blank field falls back to its `Player N` placeholder
   everywhere it's displayed. Names **never** gate Start — the existing Start
   conditions (valid counts + a loaded word deck) are untouched.
3. **Names thread through gameplay.** Reveal ("Sam — 3 of 6"), Pass ("Pass to
   Sam" / "I'm Sam — tap when ready") and Results ("The imposter was Sam") all use
   the typed name, or the `Player N` fallback when blank.
4. **Names travel with the round.** They are committed at Start and **preserved on
   Play again** (like player count, imposter count, and word source already are),
   so the same group's names come back pre-filled for the next round.

## Why names are for *every player*, not just the imposters

The phrasing that kicked this off was "edit the names of the imposters", but the
roles are assigned **randomly and secretly** at Start (`buildRoles()` in
[game-state.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/game-state.js)),
and the entire game depends on nobody knowing who the imposter is. Naming "the
imposters" on the setup screen is therefore impossible without revealing them. So
the name fields are for **every player** (the Total Players count) — the
`Player 1 / Player 2 / …` placeholders confirm this reading. *(Confirmed with
Rehaan.)*

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Whose names | **One field per player** (Total Players count), not per imposter | Roles are secret/random — you can't single out imposters on Setup without spoiling the game. *(Rehaan's choice.)* |
| Required vs optional | **Optional** — a blank field falls back to `Player N`; names never gate Start | Keeps the zero-setup quick-play path intact; personalisation is a bonus, not a tax. *(Rehaan's choice.)* |
| Where names show | **Everywhere** — Reveal, Pass, Results, not just Setup | The whole point is a personalised round; numbers-only gameplay would waste the typing. *(Rehaan's choice.)* |
| Fallback rule location | **One shared `displayName(names, i)` helper** in `game-state.js` | Single source of truth for "name or Player N", reused by all three screens — no divergent fallback logic. |
| List ↔ count sync | **Append `''` on grow, trim from the end on shrink**, preserving typed names | The host shouldn't lose names they've already typed when they nudge the count. |
| Persistence | **Names preserved on Play again**, alongside the existing kept settings | The same group usually plays several rounds — re-typing names each time would be annoying. |
| Max length | **20 characters per name** | Keeps the reveal/pass/results lines from wrapping awkwardly; long enough for real names/nicknames. |

## How it fits the architecture

No new screens, routes, or dependencies — this threads a `names` array through the
same path the round config already travels, with one tiny shared helper for the
fallback:

```
SetupScreen  names[] (one per player, live-synced to the count)
   │ Start → startGame({ …, names })
   ▼
gameState  { …, names }
   │ displayName(names, i) → typed name, else "Player i+1"
   ├─ RevealScreen  → "{name} — {n} of {N}"
   ├─ PassScreen    → "Pass to {name}" / "I'm {name} — tap when ready"
   └─ ResultsScreen → imposter name(s) via the existing formatList()
   │ Play again → names kept (like counts + word source)
```

## Files this affects

| File | Change |
|---|---|
| [src/lib/game-state.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/game-state.js) | Add `names: []` to `initial`. `startGame()` accepts and stores `names` (`?? []`). `playAgain()` keeps `state.names`. Add an exported `displayName(names, i)` → typed name trimmed, else `` `Player ${i + 1}` `` (defensive against a short/missing array). |
| [src/screens/SetupScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) | Seed `names` from `saved.names` (Play-again pre-fill). A reactive block resizes `names` to the player count without clobbering typed values (append `''` / `slice`). Render a `{#each names}` list of text inputs (placeholder `Player ${i+1}`, `maxlength=20`, `bind:value`). `start()` passes `names` to `startGame()`. New `.name-input` / `.names-field` styles matching `.count-input` / `.source-select`. |
| [src/screens/RevealScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte) | Player tag shows `displayName(names, revealIndex)` plus the existing "n of N" progress. Reveal/flip logic untouched. |
| [src/screens/PassScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/PassScreen.svelte) | "Pass to {name}" and "I'm {name} — tap when ready" via `displayName(names, revealIndex + 1)`. |
| [src/screens/ResultsScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/ResultsScreen.svelte) | Imposter reveal line maps imposter indices through `displayName` instead of `` `Player ${n}` ``; the existing `formatList()` keeps working on the resulting strings. |

**Reused, not rebuilt:** the `gameState` store + reactive-`$`-read conventions, the
existing `{#each}` + `bind:value` patterns from the word-source dropdown, the
`formatList()` joiner on Results, and all `app.css` tokens / input style patterns
(`.count-input`, `.source-select`). `App.svelte`, routing, `config.js`,
`shuffle.js`, and `Stepper.svelte` are untouched.

## Conventions to honor

- **User-facing text spells it "imposter"** (never "impostor") — the new label is
  "Player Names" and the placeholders are "Player N", so this feature is
  spelling-neutral; existing copy stays compliant. (Per
  [technical-standards.md](../../02-development/references/technical-standards.md).)
- Plain, simple, easy-to-extend code with a brief comment on each new block.
- No new dependencies — pure Svelte; mobile-responsive on modern browsers.

## What's deferred (out of scope)

- **Visual / design polish of the names section.** With up to 12 players the
  setup screen gets tall (12 stacked inputs); it scrolls fine, but a more compact
  or collapsible layout is a **design** concern for the `03-design` silo later.
  Functional styling only here.
- **Validation beyond the 20-char cap** — no duplicate-name detection, no
  required-name enforcement. Names are deliberately free-form and optional.
- **Per-name colours / avatars** — out of scope; a possible future design idea.
- **Persisting names across app restarts** (localStorage) — names survive Play
  again within a session only; durable storage is a later idea.

## Acceptance (what "done" looks like for the build)

From `02-development/workflow/03-builds/imposter-game-app/`, `npm run dev`:

1. Setup shows one name field per player with `Player N` placeholders, styled like
   the existing inputs.
2. Raising/lowering Total Players adds/removes fields; **already-typed names are
   preserved**, and the fields added/removed come from the **end** of the list.
3. Type a few names → Start → the names appear on Reveal, the Pass hand-off, and
   the Results reveal.
4. Leave a field **blank** → that player shows as `Player N`, and **Start stays
   enabled**.
5. **Play again** → Setup returns with the previous round's names pre-filled.
6. `npm run build` succeeds; at a 375px viewport there's no horizontal scroll and
   tap targets stay ≥44px.

Verification is **manual** (`npm run dev`, then `npm run build`), consistent with
prior features. Per the agreed split, the build **writes the checklist; Rehaan
runs `npm run dev`** to verify.

## Risks / open questions

- **Tall setup screen at high player counts** (noted above) — purely a layout/
  design concern, deferred to `03-design`. Functionally it scrolls fine.
- **Blank-everywhere is intentional**, not a bug: a host who types nothing gets the
  exact old "Player N" experience, so the feature is strictly additive.

## Status

`final` — feature designed, confirmed with Rehaan, and **already built and
shipped** (this plan documents it retroactively; build verified clean via
`npm run build`). Approved 2026-06-16. Routed to
`02-development/workflow/01-brief/editable-player-names-brief.md` →
`02-development/workflow/02-specs/editable-player-names-spec.md`.

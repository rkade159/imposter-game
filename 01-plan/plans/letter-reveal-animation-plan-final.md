# Letter Reveal Animation Plan (Final — backfilled)

> 📝 **This plan was written *after* the work, as a backfill.** The feature was
> built directly in a working session (2026-06-16) and this document records what
> was added so it can be found and changed later. The normal order is
> `plan → brief → spec → build`; here it ran `build → (brief + spec) → plan`. The
> brief and spec already exist in `03-design` — this plan is the top-level record.

## Why this plan exists

The role reveal was the least interactive moment in a pass-and-play party game that
lives on tension at the table: each player tapped a face-down panel and it instantly
flipped to a bordered card
([RevealScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte)).
It worked, but it had no weight.

This work adds a tactile **"secret letter" reveal** — a sealed envelope you
**press and hold** to break open, after which a note slides out with your role —
and then makes it **one of several selectable reveal animations**, so players who
prefer the original snappy reveal can keep it, and so a **third animation can be
added later as its own design**.

**Intended outcome:** opening your role feels deliberate and suspenseful (mirroring
opening a letter that's been handed to you), the choice of animation is the player's,
and the last-used choice is remembered.

## What was built (two stages)

### Stage 1 — the envelope reveal animation

- **Sealed → opening → opened** state machine, local to each player's turn (the
  router recreates the screen per player, so it resets to sealed for free).
- **Press and hold (~1.2s)** to open: a closed envelope with a wax seal; holding
  lifts the flap gradually (the lift *is* the progress cue) and fills a progress bar.
- **Early release re-seals (reset)** — opening requires one continuous hold, which
  also stops an accidental brush from revealing a role during hand-off.
- On completion the **flap swings open (3D hinge) and the note slides up + fades in**
  with the role: *"THE WORD IS: …"* (crewmate) or *"YOU ARE THE IMPOSTER!"* + hint.
- Works on **touch and mouse** (pointer events + pointer capture) and **keyboard**
  (hold Space/Enter); the mobile long-press menu / text-selection / scroll-steal are
  suppressed.

### Stage 2 — make the reveal style selectable (and extensible)

- The reveal style became a persisted **"Reveal animation"** selector in Settings,
  **defaulting to Classic** (the original tap-to-reveal). Started as an on/off
  toggle, then changed to a **named selector** because a third animation is planned.
- The styles live in one shared list
  ([reveal-styles.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/reveal-styles.js)),
  read by both the selector and the reveal screen, so they can't drift. The reveal
  screen falls back to the original for any unrecognised value.

## The hard rules (carried through both stages)

1. **Role-agnostic until the note shows.** The envelope, the hold duration, and the
   opening motion are identical for imposter and crewmate — only the note *content*
   differs. An onlooker can't read the role from the animation.
2. **Grayscale mode keeps working, untouched.** The note's colours come from the
   existing `--accent` (crewmate) / `--error` (imposter) tokens, never hardcoded, so
   `:root.grayscale` collapses both roles to one gray exactly as before. `app.css`
   was not edited. (See the [grayscale-mode plan](grayscale-mode-plan-final.md).)
3. **`prefers-reduced-motion`.** The hold is still required (it's the gameplay gate),
   but the flap/slide transitions are dropped — states snap, with no role leak.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| The reveal metaphor | **Sealed letter, press-and-hold to open** | Mirrors handing someone a sealed letter as the phone is passed; the hold adds suspense and prevents accidental reveals. *(Rehaan's idea.)* |
| Early release | **Re-seal (reset)** to zero | Opening should be one deliberate, committed hold. *(Rehaan's choice.)* |
| Animation fidelity | **Polished flap + slide**, pure CSS, no libraries | Best feel within the "standard library over third-party" standard. *(Rehaan's choice.)* |
| Optional or forced | **Optional**, original kept | Some players prefer the quick tap-to-reveal. *(Rehaan's choice.)* |
| Toggle vs selector | **Named selector**, default Classic | A third animation is planned, so a 2-way toggle wouldn't scale. *(Rehaan's choice.)* |
| Where styles are defined | **One shared `reveal-styles.js`** (mirrors `word-source.js`) | Single source for the selector options and the reveal branch; adding a style is one entry. |
| Persistence & default | **Persist to `localStorage`, default `'original'`** | Existing players see no change unless they opt in; the last-used style carries into the next round. *(Rehaan's choice.)* |

## How it fits the architecture

No new routes, no game-logic changes. The selector rides the existing `settings`
store; the reveal screen branches on it:

```
settings store  { grayscale, revealStyle }  ←→ localStorage 'imposter:settings'
   │
SettingsScreen ── <Select options={REVEAL_STYLES} bind:value={$settings.revealStyle}>
   │                                   (auto-persists)
RevealScreen   ── $: useEnvelope = $settings.revealStyle === 'envelope'
   │   {#if useEnvelope}  envelope press-and-hold (sealed→opening→opened)
   │   {:else}            original tap-to-reveal     ← also the fallback
   │
reveal-styles.js  REVEAL_STYLES [{id,label}…] + DEFAULT_REVEAL_STYLE  ← shared source
```

`game-state.js` is untouched: the advance button still calls `revealDone()`, and the
role/word/hint/name bindings are unchanged.

## Files this affects

| File | Change |
|---|---|
| [src/screens/RevealScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte) | The envelope reveal (state machine + press-and-hold + pure-CSS flap/slide + reduced-motion path), branched against the kept original tap-to-reveal, chosen by `$settings.revealStyle`. |
| [src/lib/reveal-styles.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/reveal-styles.js) | **New.** `REVEAL_STYLES` (`{ id, label }[]`) + `DEFAULT_REVEAL_STYLE` — the shared source for the selector and the reveal branch. |
| [src/components/Select.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/components/Select.svelte) | **New.** Reusable labelled dropdown row (companion to `Toggle.svelte`): `bind:value`, `options`, optional `description`/`id`; a real `<select>` styled from existing tokens. |
| [src/lib/settings.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/settings.js) | Added `revealStyle` (default `DEFAULT_REVEAL_STYLE`) to `defaults`; persists with the rest of the store. |
| [src/screens/SettingsScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/SettingsScreen.svelte) | Added a **"Reveal animation"** `Select` row (options from `REVEAL_STYLES`). |

**Reused, not rebuilt:** the `settings`-store + `localStorage` pattern, the
`Toggle.svelte`/`Stepper.svelte` row conventions (mirrored for `Select.svelte`), the
`--accent`/`--error`/neutral `app.css` tokens (so Grayscale works for free), and
`game-state.js` (`revealDone`, `displayName`, `gameState`) — all unchanged.

## Conventions honored

- **User-facing text spells it "imposter"** (never "impostor"); internal identifiers
  like `isImpostor` stay as-is. (Per
  [technical-standards.md](../../02-development/references/technical-standards.md).)
- Plain, simple, easy-to-extend code with a comment on each new block; no new
  dependencies; mobile-responsive; tap targets ≥44px.

## What's deferred (out of scope)

- **The third reveal animation** — it gets its **own plan, brief, and spec**, and
  plugs into this selector via one `REVEAL_STYLES` entry + one `RevealScreen` branch.
- **A no-hold accessibility bypass** — the deliberate hold is the point; reduced
  motion keeps the hold and only drops the animation.
- **Sound / haptics** on open — possible later polish.
- **Restyling other screens / the app shell / the palette.**

## Acceptance (what "done" looks like)

From `02-development/workflow/03-builds/imposter-game-app/`, `npm run dev`:

1. **Selector default:** Settings → **Reveal animation** = **Classic**; the reveal is
   the original tap-to-flip. A quick tap with the envelope style does **not** open it.
2. **Hold opens:** with **Secret letter**, holding ~1.2s opens the flap and slides
   out the note (word, or "YOU ARE THE IMPOSTER!" + hint).
3. **Early release re-seals:** hold then release early → flap shuts, role hidden;
   holding again from zero opens it.
4. **Role-agnostic:** an imposter turn and a crewmate turn look identical until the
   note shows.
5. **Grayscale:** Settings → Grayscale on → the envelope and both note types render
   in matched grays, neither brighter.
6. **Cross-input + reduced motion:** works on touch, mouse, and keyboard hold; OS
   "reduce motion" on → states snap, hold still required.
7. **Persistence:** change the style, reload → it sticks; start a fresh round → the
   last-used style is what you get.
8. **Build:** `npm run build` succeeds with no new warnings; no horizontal scroll at
   375px; copy reads "Imposter" everywhere.

Verification is **manual** — the build **writes the checklist; Rehaan runs
`npm run dev`** (per the agreed split). Build verified to compile cleanly.

## Risks / open questions

- **Envelope proportions are tuned by feel.** The flap height (118px) and the note's
  `bottom` offset (28px) in `RevealScreen.svelte` were set without live rendering; if
  the note sits too high/low in the pocket, each is a one-line nudge.
- **`HOLD_MS` (1200ms) is a single tunable constant** at the top of the envelope
  logic — adjust for more/less suspense.
- **Selector labels** ("Classic — tap to reveal", "Secret letter — hold to open")
  are one-line edits in `reveal-styles.js`.

## Status

`final` — built and selector-refactored 2026-06-16. Paper trail:
[letter-reveal-animation-brief.md](../../03-design/workflow/01-brief/letter-reveal-animation-brief.md)
→ [letter-reveal-animation-spec.md](../../03-design/workflow/02-specs/letter-reveal-animation-spec.md)
→ build at `02-development/workflow/03-builds/imposter-game-app/`. The next reveal
animation is a separate design that extends the selector built here.

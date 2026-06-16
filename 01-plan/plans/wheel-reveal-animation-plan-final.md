# Wheel Reveal Animation Plan (Final)

## Why this plan exists

The game now has a selectable **reveal animation** (set in Settings): the original
**Classic** tap-to-reveal and the **Secret letter** press-and-hold envelope, chosen
from a shared list and rendered by
[RevealScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte).
See the [letter-reveal-animation plan](letter-reveal-animation-plan-final.md) for that
infrastructure.

This plan adds a **third** reveal animation: a **"Wheel of Fate"** — a constantly
spinning wheel of role names that the player **presses and holds** to slow down until
it eases to a stop on their role. The wheel is **rigged**: the role is already
decided (`gameState.roles[revealIndex]`), so the spin is pure theatre to build
suspense. After it lands, a **detail card** slides in with the secret word (crewmate)
or the hint (imposter).

**Intended outcome:** a louder, more game-show-y reveal for groups who want spectacle,
sitting alongside the calmer Classic and Secret-letter styles — opt-in, persisted,
and not breaking the Grayscale anti-cheat.

## The feature

1. **A spinning wheel** of role-coded segments fills the reveal area, **already
   spinning** when the player's turn arrives (role-agnostic — same for everyone).
2. **Press and hold** to slow it: while held, the wheel **decelerates** and eases
   toward a stop.
3. **Release before it stops → it re-accelerates** back to full spin. Bringing it to
   rest takes one continuous hold (consistent with the envelope's "re-seal on
   release" and stopping accidental reveals on hand-off). *(Rehaan's choice.)*
4. **It always lands on the player's actual role** — the wheel eases to a segment
   matching `isImpostor`. Multiple segments per role keep the landing spot
   unpredictable.
5. **Then a detail card slides in** below the wheel, leading with the unambiguous
   role and then the info the player needs — the **secret word** (crewmate) or the
   **hint** (imposter) — followed by the existing pass/continue button. *(Rehaan's
   choice: detail card after landing.)*

## The segments (first-cut content — easily edited)

Six segments, alternating role so each role has three landing spots. Labels are
light comedy; the detail card is what states the role unambiguously, so the wheel can
be playful without confusing anyone:

| Role (`isImpostor`) | Segment labels |
|---|---|
| Crewmate (`false`) | `CREWMATE`, `Innocent 😇`, `Good Egg 🥚` |
| Imposter (`true`)  | `IMPOSTER`, `Sneaky 🕵️`, `Sus 😈` |

These live in a small config so adding/renaming a segment is a one-line edit. The set
is **Rehaan's to adjust** — names are placeholders chosen for a chuckle.

## The hard rules (same as every reveal style)

1. **Role-agnostic until it lands.** The idle spin shows all segments and is identical
   for both roles; nothing role-specific (the detail card) appears until the wheel has
   come to rest on the player's hold. An onlooker can't read the role from the spin.
2. **Grayscale mode keeps working, untouched.** Segment fills come from the existing
   `--accent` (crewmate) / `--error` (imposter) tokens — never hardcoded — so
   `:root.grayscale` collapses both to one gray and the colour tell vanishes; neutral
   segment **dividers** keep the wedges visually separable in gray. The detail card
   reuses the same token classes as the other reveal styles. `app.css` is **not**
   edited.
3. **`prefers-reduced-motion`.** No constant spinning (vestibular safety): the wheel is
   shown **static**, the **hold is still required**, and on completion the role segment
   is highlighted and the detail card shown — no large rotation animation.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| The metaphor | **Spinning "Wheel of Fate", hold to slow & stop** | Game-show suspense; the rig makes it safe theatre. *(Rehaan's idea.)* |
| Release behaviour | **Re-accelerate (must hold continuously)** | Deliberate, matches the envelope; stops accidental hand-off reveals. *(Rehaan's choice.)* |
| Word/hint delivery | **Detail card slides in after landing** | The wheel reveals role; crewmates still need the word and imposters the hint. Two clean beats. *(Rehaan's choice.)* |
| Segment names | **Light-comedy labels, role stated clearly on the card** | Fun without ambiguity. *(Rehaan delegated; placeholders here.)* |
| Where it lives | **A new `WheelReveal.svelte` component**, branched into RevealScreen | Keeps the now three-way RevealScreen readable; isolates the spin logic. |
| Persistence & default | **Adds a `'wheel'` option; default stays `'original'`** | Opt-in; existing players unaffected; choice persists across rounds. |

## How it fits the architecture

No game-logic changes; it plugs into the existing selector. Two real touch-points plus
the new component:

```
reveal-styles.js   REVEAL_STYLES += { id:'wheel', label:'Wheel of Fate — hold to stop' }
        │                                   (one entry — also feeds the Settings selector)
RevealScreen.svelte
        │  {#if revealStyle==='envelope'} …envelope…
        │  {:else if revealStyle==='wheel'} <WheelReveal {isImpostor} {word} {hint}
        │                                                on:done={revealDone} />
        │  {:else} …original tap-to-reveal (also the fallback)…
        │
WheelReveal.svelte (new)
        │  idle: wheel spins (rAF angle += velocity)         ← role-agnostic
        │  hold: ease toward a role-matching segment over SETTLE_MS (visibly slows)
        │  release early: cancel → re-accelerate to idle
        │  landed: lock → detail card (word | hint, token-coloured) → "done" → pass btn
        │  prefers-reduced-motion: static wheel, hold still gates the reveal
```

`gameState` (`revealDone`, `displayName`, the role/word/hint), `settings`,
`Select.svelte`, and `app.css` are all reused unchanged.

## Files this affects

| File | Change |
|---|---|
| [src/components/WheelReveal.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/components/WheelReveal.svelte) | **New.** The spinning wheel: idle spin, press-and-hold deceleration with re-accelerate-on-release, rigged landing on the player's role, the after-landing detail card (word/hint), and the reduced-motion path. Props for `isImpostor`, `word`, `hint`, `advanceLabel`; emits when the player advances. Token-coloured segments + neutral dividers. |
| [src/lib/reveal-styles.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/reveal-styles.js) | Add one `REVEAL_STYLES` entry: `{ id: 'wheel', label: … }`. (The wheel's segment list may live here too, or in the component.) |
| [src/screens/RevealScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte) | Add an `{:else if revealStyle === 'wheel'}` branch rendering `WheelReveal`, wired to the existing role/word/hint values and `revealDone()`. The original tap-to-reveal stays the final `{:else}` fallback. |

**Reused, not rebuilt:** the `revealStyle` selector + `settings` persistence, the
`--accent`/`--error`/neutral `app.css` tokens (so Grayscale works for free), the
existing role/word/hint content, and `game-state.js` (`revealDone`, `displayName`) —
all unchanged.

## Conventions to honor

- **User-facing text spells it "imposter"** (never "impostor"); internal identifiers
  like `isImpostor` stay as-is. (Per
  [technical-standards.md](../../02-development/references/technical-standards.md).)
- Plain, simple, well-commented, easy-to-extend code; no new dependencies;
  mobile-responsive; tap targets ≥44px.
- Same press-and-hold robustness as the envelope: pointer + keyboard (Space/Enter),
  pointer capture, and suppressed long-press menu / text-selection / scroll-steal.

## What's deferred (out of scope)

- **Sound / haptics / confetti** on landing — possible later polish.
- **A "skip the spin" bypass** — the hold is the gameplay gate (reduced motion keeps
  the hold, just drops the spin).
- **Per-segment custom colours or images, configurable wheel size** — first cut is
  the two role colours + the comedy labels.
- **Changes to the other reveal styles, other screens, the app shell, or the palette.**

## Acceptance (what "done" looks like)

From `02-development/workflow/03-builds/imposter-game-app/`, `npm run dev`:

1. **Select it:** Settings → **Reveal animation** → **Wheel of Fate**; persists across
   reload and into the next round. Default stays **Classic**.
2. **Idle spin:** the reveal shows a spinning wheel; nothing role-specific yet.
3. **Hold slows it:** pressing and holding visibly decelerates the wheel; it eases to a
   stop.
4. **Lands on the real role:** it always stops on a segment matching the player's role
   (cross-check with another style / the results screen).
5. **Release re-accelerates:** letting go before it stops speeds it back up; a fresh
   continuous hold is needed to land it.
6. **Detail card:** after it lands, a card shows the role clearly + the secret word
   (crewmate) or hint (imposter); then the pass/continue button advances.
7. **Role-agnostic:** the spin and hold look identical for imposter and crewmate until
   the card appears.
8. **Grayscale:** with Grayscale on, segments render in matched grays (separable only
   by their dividers/labels), and the detail card shows no colour/brightness tell.
9. **Reduced motion + input:** OS "reduce motion" → no spinning, hold still required;
   works on touch, mouse, and keyboard hold.
10. **Build:** `npm run build` succeeds, no new warnings; no horizontal scroll at
    375px; copy reads "Imposter" everywhere.

Verification is **manual** — the build **writes the checklist; Rehaan runs
`npm run dev`** (per the agreed split).

## Risks / open questions

- **Rigged landing maths.** Easing to an exact target angle (chosen among the
  role-matching segments) while keeping the deceleration smooth is the fiddly part;
  a rAF angle/velocity model with an ease-out final approach is the planned approach
  and a one-place tweak if the feel is off.
- **Re-accelerate interruption.** Cancelling a partial settle and ramping back to idle
  must not "jump" the angle — track the angle in JS so idle, decel, and re-accel share
  one continuous value.
- **Tuning constants:** spin speed, `SETTLE_MS` (how long the slow-down takes), and
  segment count are single constants in the component, easy to adjust after a playtest.
- **Reduced-motion experience** is deliberately plainer (no spin); acceptable per the
  accessibility rule, and the only honest option for a vestibular-safe spinning wheel.

## Status

`final` — concept + key interaction decisions approved by Rehaan (2026-06-16). Routed
to the design pipeline:
[wheel-reveal-animation-brief.md](../../03-design/workflow/01-brief/wheel-reveal-animation-brief.md)
→ [wheel-reveal-animation-spec.md](../../03-design/workflow/02-specs/wheel-reveal-animation-spec.md)
→ **built 2026-06-16** at `src/components/WheelReveal.svelte` (+ selector entry +
RevealScreen branch); compiles clean, pending Rehaan's `npm run dev` smoke test.
